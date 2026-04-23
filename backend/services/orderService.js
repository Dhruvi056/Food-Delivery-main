import Stripe from "stripe";
import {
  sendOrderConfirmation,
  sendStatusUpdateEmail,
  sendOrderConfirmationSMS,
  sendStatusUpdateSMS,
} from "../utils/notificationService.js";
import { computeTax } from "../utils/taxUtils.js";
import insforge from "../config/insforge.js";
import { logger } from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const DELIVERY_FEE = 50;

// ── Helpers ────────────────────────────────────────────────────────────────────

const assertAdmin = async (userId) => {
  const { data: user } = await insforge.database
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!user || user.role !== "admin") throw new Error("UNAUTHORIZED");
  return user;
};

const emitSocketEvent = (io, room, event, payload) => {
  if (io) io.to(room).emit(event, payload);
};

// Remap DB row → response shape (use _id alias for frontend compatibility)
const remapOrder = (o) => (o ? { ...o, _id: o.id } : null);

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Place an order. Supports both Stripe (returns session URL) and COD.
 */
export const placeNewOrder = async (body, io) => {
  const subtotal = body.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // FIX A: Read user addresses and find selected one
  const { data: user } = await insforge.database
    .from("users")
    .select("addresses")
    .eq("id", body.userId)
    .single();

  const addresses = user?.addresses || [];
  const selectedAddress = body.addressId 
    ? addresses.find(a => a.id === body.addressId)
    : (body.addressIndex !== undefined ? addresses[body.addressIndex] : body.address);

  if (!selectedAddress) throw new Error("Delivery address not found");

  let discountValue = 0;
  let couponId = null;

  if (body.promoCode) {
    const { data: coupon } = await insforge.database
      .from("coupons")
      .select("id, discount_type, discount_value, expires_at")
      .eq("code", body.promoCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (coupon) {
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new Error("Coupon has expired");
      }
      // Check if already used
      const { data: usage } = await insforge.database
        .from("coupon_uses")
        .select("id")
        .eq("coupon_id", coupon.id)
        .eq("user_id", body.userId)
        .maybeSingle();

      if (usage) throw new Error("Coupon already used");

      couponId = coupon.id;
      if (coupon.discount_type === "percentage") {
        discountValue = subtotal * (coupon.discount_value / 100);
      } else {
        discountValue = Math.min(subtotal, coupon.discount_value);
      }
    } else if (body.promoCode === "BITE20") {
      // Legacy fallback if not in DB
      discountValue = subtotal * 0.2;
    }
  }

  const taxAmount = computeTax(selectedAddress?.state, subtotal);
  const finalAmount = subtotal + taxAmount + DELIVERY_FEE - discountValue;
  const estimatedDelivery = new Date(Date.now() + 45 * 60 * 1000).toISOString();

  const orderPayload = {
    user_id: body.userId,
    items: body.items,
    amount: finalAmount,
    subtotal,
    tax_amount: taxAmount,
    delivery_fee: DELIVERY_FEE,
    address: selectedAddress,
    delivery_address: selectedAddress, // Explicit column as requested
    payment_method: body.paymentMethod || "Stripe",
    promo_code: body.promoCode || null,
    discount_amount: discountValue,
    estimated_delivery: estimatedDelivery,
    ordered_for_someone_else: body.orderedForSomeoneElse || false,
    created_at: new Date().toISOString() // Explicit as requested
  };

  // Clear the user's cart immediately
  await insforge.database
    .from("users")
    .update({ cart_data: {} })
    .eq("id", body.userId);

  // --- COD Path ---
  if (body.paymentMethod === "COD") {
    const { data: newOrder, error } = await insforge.database
      .from("orders")
      .insert([orderPayload])
      .select()
      .single();
    if (error) throw new Error(error.message);

    emitSocketEvent(io, "admin_room", "new_order", {
      orderId: newOrder.id,
      items: newOrder.items,
      amount: newOrder.amount,
      address: newOrder.address,
      status: newOrder.status,
      date: newOrder.date,
      paymentMethod: "COD",
    });

    if (couponId) {
      await insforge.database
        .from("coupon_uses")
        .insert({ coupon_id: couponId, user_id: body.userId, order_id: newOrder.id });
    }

    return { isCOD: true };
  }

  // --- Stripe Path: insert order first to get the ID ---
  const { data: newOrder, error: insertError } = await insforge.database
    .from("orders")
    .insert([orderPayload])
    .select()
    .single();
  if (insertError) throw new Error(insertError.message);

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
    success_url: `${FRONTEND_URL}/verify?success=true&orderId=${newOrder.id}`,
    cancel_url: `${FRONTEND_URL}/verify?success=false&orderId=${newOrder.id}`,
    metadata: {
      orderId: newOrder.id,
      deliveryAddress: JSON.stringify(selectedAddress)
    }
  };

  if (body.promoCode === "BITE20") {
    const stripeCoupon = await stripe.coupons.create({
      percent_off: 20,
      duration: "once",
      name: "20% Special Discount",
    });
    sessionConfig.discounts = [{ coupon: stripeCoupon.id }];
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  // Save the Stripe session ID to the order
  await insforge.database
    .from("orders")
    .update({ stripe_session_id: session.id })
    .eq("id", newOrder.id);

  if (couponId) {
    await insforge.database
      .from("coupon_uses")
      .insert({ coupon_id: couponId, user_id: body.userId, order_id: newOrder.id });
  }

  return { session_url: session.url };
};

/**
 * Verify a Stripe payment, mark order as paid, emit socket events, send notifications.
 */
export const verifyOrderPayment = async (orderId, success, io) => {
  if (success !== "true") {
    await insforge.database.from("orders").delete().eq("id", orderId);
    return { paid: false };
  }

  const { data: preOrder } = await insforge.database
    .from("orders")
    .select()
    .eq("id", orderId)
    .maybeSingle();

  let paymentIntentId = "";

  if (preOrder?.stripe_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(preOrder.stripe_session_id);
      paymentIntentId = session.payment_intent;
    } catch (err) {
      logger.error('Error retrieving Stripe session:', err);
    }
  }

  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const { data: order } = await insforge.database
    .from("orders")
    .update({
      payment: true,
      stripe_payment_intent_id: paymentIntentId,
      invoice_number: invoiceNumber,
    })
    .eq("id", orderId)
    .select()
    .single();

  if (order) {
    const { data: user } = await insforge.database
      .from("users")
      .select("email")
      .eq("id", order.user_id)
      .maybeSingle();

    emitSocketEvent(io, "admin_room", "new_order", {
      orderId: order.id,
      items: order.items,
      amount: order.amount,
      address: order.address,
      status: order.status,
      date: order.date,
    });

    if (user?.email) {
      sendOrderConfirmation(user.email, remapOrder(order)).catch(err => logger.error('sendOrderConfirmation failed:', err));
    }
    if (order.address?.phone) {
      sendOrderConfirmationSMS(order.address.phone, remapOrder(order)).catch(err => logger.error('sendOrderConfirmationSMS failed:', err));
    }
  }

  return { paid: true };
};

/**
 * Get a paginated list of orders for the authenticated user.
 */
export const getOrdersByUser = async (userId, page = 1, limit = 10) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: orders, count, error } = await insforge.database
    .from("orders")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (orders || []).map(remapOrder),
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
    totalOrders: count || 0,
  };
};

/**
 * Fetch detailed information for a single order, including rider info.
 */
export const getOrderById = async (orderId) => {
  const { data: order, error } = await insforge.database
    .from("orders")
    .select()
    .eq("id", orderId)
    .single();

  if (error || !order) throw new Error("ORDER_NOT_FOUND");

  if (order.rider_id) {
    const { data: rider } = await insforge.database
      .from("users")
      .select("id, name, phone, rider_status")
      .eq("id", order.rider_id)
      .maybeSingle();
    order.rider = rider;
  }

  return remapOrder(order);
};

/**
 * List all orders (admin only).
 */
export const getAllOrders = async (userId) => {
  await assertAdmin(userId);
  const { data: orders, error } = await insforge.database
    .from("orders")
    .select();
  if (error) throw new Error(error.message);
  return (orders || []).map(remapOrder);
};

/**
 * Update order status (admin only). Fires socket, email, and SMS notifications.
 */
export const changeOrderStatus = async (userId, orderId, status, io) => {
  await assertAdmin(userId);

  const { data: order, error } = await insforge.database
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (order) {
    const { data: customer } = await insforge.database
      .from("users")
      .select("email")
      .eq("id", order.user_id)
      .maybeSingle();

    emitSocketEvent(io, `user_${order.user_id}`, "order_update", {
      orderId: order.id,
      status,
      updatedAt: new Date(),
    });

    if (status === "Ready for Pickup") {
      emitSocketEvent(io, "rider_room", "food_ready", {
        orderId: order.id,
        items: order.items,
        amount: order.amount,
        address: {
          street: order.address?.street,
          city: order.address?.city,
        },
      });
    }

    if (customer?.email) {
      sendStatusUpdateEmail(customer.email, remapOrder(order), status).catch(err => logger.error('sendStatusUpdateEmail failed:', err));
    }
    if (order.address?.phone) {
      sendStatusUpdateSMS(order.address.phone, status).catch(err => logger.error('sendStatusUpdateSMS failed:', err));
    }
  }

  return remapOrder(order);
};

/**
 * Process an admin-initiated refund via Stripe.
 */
export const processRefund = async (userId, orderId, reason, io) => {
  await assertAdmin(userId);

  const { data: order } = await insforge.database
    .from("orders")
    .select()
    .eq("id", orderId)
    .maybeSingle();

  if (!order || !order.payment) throw new Error("ORDER_NOT_PAID");
  if (order.is_refunded) throw new Error("ALREADY_REFUNDED");
  if (!order.stripe_payment_intent_id) throw new Error("NO_PAYMENT_INTENT");

  await stripe.refunds.create({
    payment_intent: order.stripe_payment_intent_id,
    reason: "requested_by_customer",
  });

  const { data: refundedOrder } = await insforge.database
    .from("orders")
    .update({
      status: "Refunded",
      is_refunded: true,
      refund_amount: order.amount,
      refund_reason: reason || "Admin intervention",
    })
    .eq("id", orderId)
    .select()
    .single();

  const { data: customer } = await insforge.database
    .from("users")
    .select("email")
    .eq("id", refundedOrder.user_id)
    .maybeSingle();

  emitSocketEvent(io, `user_${refundedOrder.user_id}`, "order_update", {
    orderId: refundedOrder.id,
    status: "Refunded",
    updatedAt: new Date(),
  });

  if (customer?.email) {
    sendStatusUpdateEmail(customer.email, remapOrder(refundedOrder), "Refunded").catch(err => logger.error('sendStatusUpdateEmail (refund) failed:', err));
  }
  if (refundedOrder.address?.phone) {
    sendStatusUpdateSMS(refundedOrder.address.phone, "Refunded").catch(err => logger.error('sendStatusUpdateSMS (refund) failed:', err));
  }

  return remapOrder(refundedOrder);
};

/**
 * Customer-initiated order cancellation. Auto-refunds Stripe if applicable.
 */
export const cancelUserOrder = async (userId, orderId, io) => {
  const { data: order } = await insforge.database
    .from("orders")
    .select()
    .eq("id", orderId)
    .maybeSingle();

  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.user_id !== userId) throw new Error("UNAUTHORIZED");
  if (order.status !== "Food Processing") throw new Error("CANNOT_CANCEL");

  if (order.payment && order.stripe_payment_intent_id && !order.is_refunded) {
    try {
      await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        reason: "requested_by_customer",
      });
    } catch (stripeErr) {
      logger.error('Stripe refund failed during cancellation:', stripeErr);
    }
  }

  const { data: cancelledOrder } = await insforge.database
    .from("orders")
    .update({
      status: "Cancelled",
      is_refunded: order.payment,
      refund_amount: order.payment ? order.amount : 0,
      refund_reason: "Customer Cancelled",
    })
    .eq("id", orderId)
    .select()
    .single();

  const { data: customer } = await insforge.database
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  emitSocketEvent(io, `user_${userId}`, "order_update", {
    orderId: cancelledOrder.id,
    status: "Cancelled",
    updatedAt: new Date(),
  });
  emitSocketEvent(io, "admin_room", "order_update", {
    orderId: cancelledOrder.id,
    status: "Cancelled",
    updatedAt: new Date(),
  });

  if (customer?.email) {
    sendStatusUpdateEmail(customer.email, remapOrder(cancelledOrder), "Cancelled").catch(err => logger.error('sendStatusUpdateEmail (cancel) failed:', err));
  }

  return remapOrder(cancelledOrder);
};

/**
 * Handle incoming Stripe webhooks securely.
 */
export const handleStripeWebhook = async (rawBody, signature, io) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Redundant safety-net: the controller guard fires first; this protects
  // against direct service-layer calls when the secret is still a placeholder.
  if (!endpointSecret || endpointSecret.startsWith('your_') || endpointSecret.trim() === '') {
    logger.warn('[Stripe] Webhook skipped — STRIPE_WEBHOOK_SECRET is not configured.');
    return;
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (err) {
    throw new Error(`WEBHOOK_SIGNATURE_FAILED: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const { data: order } = await insforge.database
        .from("orders")
        .select()
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (order && !order.payment) {
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        // FIX B: Parse delivery address from metadata
        const deliveryAddress = session.metadata?.deliveryAddress 
          ? JSON.parse(session.metadata.deliveryAddress) 
          : order.address;

        await insforge.database
          .from("orders")
          .update({
            payment: true,
            stripe_payment_intent_id: session.payment_intent,
            invoice_number: invoiceNumber,
            delivery_address: deliveryAddress
          })
          .eq("id", order.id);

        // Insert notification
        await insforge.database.from("notifications").insert({
          user_id: order.user_id,
          type: "payment",
          message: "Payment confirmed! Your order is being prepared.",
          order_id: order.id
        });

        // Emit payment confirmation to user
        getIO().to(`user_${order.user_id}`).emit("payment_confirmed", { orderId: order.id });

        emitSocketEvent(io, "admin_room", "new_order", {
          orderId: order.id,
          items: order.items,
          amount: order.amount,
          address: deliveryAddress,
          status: order.status,
          date: order.date,
        });

        logger.info(`✅ Webhook: Order ${order.id} confirmed and paid!`);
      }
    } catch (err) {
      logger.error('Error processing completed checkout session:', err);
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    logger.info(`❌ Webhook: Payment failed for intent: ${paymentIntent.id}`);
    try {
      const { data: order } = await insforge.database
        .from("orders")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (order) {
        await insforge.database
          .from("orders")
          .update({ status: "Cancelled", refund_reason: "Payment Failed" })
          .eq("id", order.id);
      }
    } catch (err) {
      logger.error('Error processing failed payment intent:', err);
    }
  }
};
