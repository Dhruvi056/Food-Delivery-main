import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import {
  sendOrderConfirmation,
  sendStatusUpdateEmail,
  sendOrderConfirmationSMS,
  sendStatusUpdateSMS,
} from "../utils/notificationService.js";
import { computeTax } from "../utils/taxUtils.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const DELIVERY_FEE = 50;

// ── Helpers ────────────────────────────────────────────────────────────────────

const assertAdmin = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user || user.role !== "admin") throw new Error("UNAUTHORIZED");
  return user;
};

const emitSocketEvent = (io, room, event, payload) => {
  if (io) io.to(room).emit(event, payload);
};

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Place an order. Supports both Stripe (returns session URL) and COD.
 * @param {object} body   - req.body (userId, items, address, paymentMethod, etc.)
 * @param {object} io     - Socket.io instance from req.app.get("io")
 * @returns {{ isCOD?, session_url? }}
 */
export const placeNewOrder = async (body, io) => {
  const subtotal = body.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  
  let discountValue = 0;
  if (body.promoCode === "BITE20") {
    discountValue = subtotal * 0.20;
  }

  const taxAmount = computeTax(body.address?.state, subtotal);
  const finalAmount = subtotal + taxAmount + DELIVERY_FEE - discountValue;
  const estimatedDelivery = new Date(Date.now() + 45 * 60 * 1000);

  const newOrder = new orderModel({
    userId: body.userId,
    items: body.items,
    amount: finalAmount,
    subtotal,
    taxAmount,
    deliveryFee: DELIVERY_FEE,
    address: body.address,
    paymentMethod: body.paymentMethod || "Stripe",
    promoCode: body.promoCode || null,
    discountAmount: discountValue,
    estimatedDelivery,
    orderedForSomeoneElse: body.orderedForSomeoneElse,
  });

  // Clear the user's cart immediately
  await userModel.findByIdAndUpdate(body.userId, { cartData: {} });

  // --- COD Path ---
  if (body.paymentMethod === "COD") {
    await newOrder.save();
    emitSocketEvent(io, "admin_room", "new_order", {
      orderId: newOrder._id,
      items: newOrder.items,
      amount: newOrder.amount,
      address: newOrder.address,
      status: newOrder.status,
      date: newOrder.date,
      paymentMethod: "COD",
    });
    return { isCOD: true };
  }

  // --- Stripe Path ---
  const line_items = body.items.map((item) => ({
    price_data: {
      currency: "INR",
      product_data: { name: item.name },
      unit_amount: item.price * 100,
    },
    quantity: item.quantity,
  }));

  line_items.push({
    price_data: {
      currency: "INR",
      product_data: { name: "Delivery Charges" },
      unit_amount: DELIVERY_FEE * 100,
    },
    quantity: 1,
  });

  if (taxAmount > 0) {
    line_items.push({
      price_data: {
        currency: "INR",
        product_data: { name: "Estimated Tax" },
        unit_amount: taxAmount * 100,
      },
      quantity: 1,
    });
  }

  const sessionConfig = {
    payment_method_types: ["card", "alipay", "amazon_pay"],
    line_items,
    mode: "payment",
    success_url: `${FRONTEND_URL}/verify?success=true&orderId=${newOrder._id}`,
    cancel_url: `${FRONTEND_URL}/verify?success=false&orderId=${newOrder._id}`,
  };

  if (body.promoCode === "BITE20") {
    const stripeCoupon = await stripe.coupons.create({
      percent_off: 20,
      duration: 'once',
      name: '20% Special Discount'
    });
    sessionConfig.discounts = [{ coupon: stripeCoupon.id }];
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  newOrder.stripeSessionId = session.id;
  await newOrder.save();

  return { session_url: session.url };
};

/**
 * Verify a Stripe payment, mark order as paid, emit socket events, send notifications.
 */
export const verifyOrderPayment = async (orderId, success, io) => {
  if (success !== "true") {
    await orderModel.findByIdAndDelete(orderId);
    return { paid: false };
  }

  const preOrder = await orderModel.findById(orderId);
  let paymentIntentId = "";

  if (preOrder?.stripeSessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(preOrder.stripeSessionId);
      paymentIntentId = session.payment_intent;
    } catch (err) {
      console.error("Error retrieving Stripe session:", err);
    }
  }

  const order = await orderModel.findByIdAndUpdate(
    orderId,
    {
      payment: true,
      stripePaymentIntentId: paymentIntentId,
      invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    { new: true }
  );

  if (order) {
    const user = await userModel.findById(order.userId);

    emitSocketEvent(io, "admin_room", "new_order", {
      orderId: order._id,
      items: order.items,
      amount: order.amount,
      address: order.address,
      status: order.status,
      date: order.date,
    });

    if (user?.email) {
      sendOrderConfirmation(user.email, order).catch(console.error);
    }
    if (order.address?.phone) {
      sendOrderConfirmationSMS(order.address.phone, order).catch(console.error);
    }
  }

  return { paid: true };
};

/**
 * Get a paginated list of orders for the authenticated user.
 */
export const getOrdersByUser = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [orders, totalOrders] = await Promise.all([
    orderModel.find({ userId }).sort({ date: -1 }).skip(skip).limit(limit),
    orderModel.countDocuments({ userId }),
  ]);
  return {
    data: orders,
    totalPages: Math.ceil(totalOrders / limit),
    currentPage: page,
    totalOrders,
  };
};

/**
 * List all orders (admin only).
 */
export const getAllOrders = async (userId) => {
  await assertAdmin(userId);
  return orderModel.find({});
};

/**
 * Update order status (admin only). Fires socket, email, and SMS notifications.
 */
export const changeOrderStatus = async (userId, orderId, status, io) => {
  await assertAdmin(userId);

  const order = await orderModel.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  );

  if (order) {
    const customer = await userModel.findById(order.userId);

    emitSocketEvent(io, `user_${order.userId}`, "order_update", {
      orderId: order._id,
      status,
      updatedAt: new Date(),
    });

    // 🛵 Broadcast to all connected riders when food is ready for collection
    if (status === "Ready for Pickup") {
      emitSocketEvent(io, "rider_room", "food_ready", {
        orderId: order._id,
        items: order.items,
        amount: order.amount,
        address: {
          street: order.address?.street,
          city: order.address?.city,
        },
      });
    }

    if (customer?.email) {
      sendStatusUpdateEmail(customer.email, order, status).catch(console.error);
    }
    if (order.address?.phone) {
      sendStatusUpdateSMS(order.address.phone, status).catch(console.error);
    }
  }

  return order;
};


/**
 * Process an admin-initiated refund via Stripe.
 */
export const processRefund = async (userId, orderId, reason, io) => {
  await assertAdmin(userId);

  const order = await orderModel.findById(orderId);
  if (!order || !order.payment) throw new Error("ORDER_NOT_PAID");
  if (order.isRefunded) throw new Error("ALREADY_REFUNDED");
  if (!order.stripePaymentIntentId) throw new Error("NO_PAYMENT_INTENT");

  await stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
    reason: "requested_by_customer",
  });

  const refundedOrder = await orderModel.findByIdAndUpdate(
    orderId,
    {
      status: "Refunded",
      isRefunded: true,
      refundAmount: order.amount,
      refundReason: reason || "Admin intervention",
    },
    { new: true }
  );

  const customer = await userModel.findById(refundedOrder.userId);

  emitSocketEvent(io, `user_${refundedOrder.userId}`, "order_update", {
    orderId: refundedOrder._id,
    status: "Refunded",
    updatedAt: new Date(),
  });

  if (customer?.email) {
    sendStatusUpdateEmail(customer.email, refundedOrder, "Refunded").catch(console.error);
  }
  if (refundedOrder.address?.phone) {
    sendStatusUpdateSMS(refundedOrder.address.phone, "Refunded").catch(console.error);
  }

  return refundedOrder;
};

/**
 * Customer-initiated order cancellation. Auto-refunds Stripe if applicable.
 */
export const cancelUserOrder = async (userId, orderId, io) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.userId !== userId) throw new Error("UNAUTHORIZED");
  if (order.status !== "Food Processing") throw new Error("CANNOT_CANCEL");

  if (order.payment && order.stripePaymentIntentId && !order.isRefunded) {
    try {
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        reason: "requested_by_customer",
      });
    } catch (stripeErr) {
      console.error("Stripe refund failed during cancellation:", stripeErr);
    }
  }

  const cancelledOrder = await orderModel.findByIdAndUpdate(
    orderId,
    {
      status: "Cancelled",
      isRefunded: order.payment,
      refundAmount: order.payment ? order.amount : 0,
      refundReason: "Customer Cancelled",
    },
    { new: true }
  );

  const customer = await userModel.findById(userId);

  emitSocketEvent(io, `user_${userId}`, "order_update", {
    orderId: cancelledOrder._id,
    status: "Cancelled",
    updatedAt: new Date(),
  });
  emitSocketEvent(io, "admin_room", "order_update", {
    orderId: cancelledOrder._id,
    status: "Cancelled",
    updatedAt: new Date(),
  });

  if (customer?.email) {
    sendStatusUpdateEmail(customer.email, cancelledOrder, "Cancelled").catch(console.error);
  }

  return cancelledOrder;
};

/**
 * Handle incoming Stripe webhooks securely.
 */
export const handleStripeWebhook = async (rawBody, signature, io) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (err) {
    throw new Error(`WEBHOOK_SIGNATURE_FAILED: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const order = await orderModel.findOne({ stripeSessionId: session.id });
      if (order && !order.payment) {
        order.payment = true;
        order.stripePaymentIntentId = session.payment_intent;
        order.invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await order.save();

        emitSocketEvent(io, "admin_room", "new_order", {
          orderId: order._id,
          items: order.items,
          amount: order.amount,
          address: order.address,
          status: order.status,
          date: order.date,
        });

        console.log(`✅ Webhook: Order ${order._id} confirmed and paid!`);
      }
    } catch (err) {
      console.error("Error processing completed checkout session:", err);
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    console.log(`❌ Webhook: Payment failed for intent: ${paymentIntent.id}`);
    try {
      const order = await orderModel.findOne({ stripePaymentIntentId: paymentIntent.id });
      if (order) {
        order.status = "Cancelled";
        order.refundReason = "Payment Failed";
        await order.save();
      }
    } catch (err) {
      console.error("Error processing failed payment intent:", err);
    }
  }
};
