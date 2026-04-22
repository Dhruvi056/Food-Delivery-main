import {
  placeNewOrder,
  verifyOrderPayment,
  getOrdersByUser,
  getAllOrders,
  changeOrderStatus,
  processRefund,
  cancelUserOrder,
  handleStripeWebhook,
  getOrderById,
} from "../services/orderService.js";

const ERROR_MESSAGES = {
  UNAUTHORIZED: "You are not authorised to perform this action",
  ORDER_NOT_PAID: "Order not found or not paid yet",
  ALREADY_REFUNDED: "Order already refunded",
  NO_PAYMENT_INTENT: "No Stripe payment intent found — cannot auto-refund",
  ORDER_NOT_FOUND: "Order not found",
  CANNOT_CANCEL: "Only orders in 'Food Processing' state can be cancelled",
};

const handleServiceError = (res, error, fallback = "An unexpected error occurred") => {
  const msg = ERROR_MESSAGES[error.message] || error.message || fallback;
  res.json({ success: false, message: msg });
};

// ── Controllers ────────────────────────────────────────────────────────────────

const placeOrder = async (req, res) => {
  try {
    const io = req.app.get("io");
    const result = await placeNewOrder(req.body, io);
    if (result.isCOD) {
      return res.json({ success: true, message: "Order Placed Successfully via COD", isCOD: true });
    }
    res.json({ success: true, session_url: result.session_url });
  } catch (error) {
    console.error("placeOrder error:", error);
    handleServiceError(res, error, "Error placing order");
  }
};

const verifyOrder = async (req, res) => {
  try {
    const io = req.app.get("io");
    const result = await verifyOrderPayment(req.body.orderId, req.body.success, io);
    if (result.paid) {
      return res.json({ success: true, message: "Paid" });
    }
    res.json({ success: false, message: "Not Paid" });
  } catch (error) {
    console.error("verifyOrder error:", error);
    handleServiceError(res, error, "Error verifying order");
  }
};

const userOrders = async (req, res) => {
  try {
    const result = await getOrdersByUser(
      req.userId,
      parseInt(req.query.page) || 1,
      parseInt(req.query.limit) || 10
    );
    res.json({ success: true, ...result });
  } catch (error) {
    handleServiceError(res, error, "Error fetching orders");
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const result = await getOrderById(req.params.orderId);
    res.json({ success: true, data: result });
  } catch (error) {
    handleServiceError(res, error, "Error fetching order details");
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await getAllOrders(req.userId || req.body.userId);
    res.json({ success: true, data: orders });
  } catch (error) {
    handleServiceError(res, error, "Error listing orders");
  }
};

const updateStatus = async (req, res) => {
  try {
    const io = req.app.get("io");
    await changeOrderStatus(req.body.userId, req.body.orderId, req.body.status, io);
    res.json({ success: true, message: "Status Updated Successfully" });
  } catch (error) {
    handleServiceError(res, error, "Error updating status");
  }
};

const refundOrder = async (req, res) => {
  try {
    const io = req.app.get("io");
    await processRefund(req.body.userId, req.body.orderId, req.body.reason, io);
    res.json({ success: true, message: "Refund Processed Successfully" });
  } catch (error) {
    handleServiceError(res, error, "Refund Error");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const io = req.app.get("io");
    await cancelUserOrder(req.body.userId, req.body.orderId, io);
    res.json({ success: true, message: "Order Cancelled Successfully" });
  } catch (error) {
    handleServiceError(res, error, "Cancellation Error");
  }
};

const stripeWebhook = async (req, res) => {
  try {
    const io = req.app.get("io");
    await handleStripeWebhook(req.body, req.headers["stripe-signature"], io);
    res.json({ received: true });
  } catch (error) {
    if (error.message?.startsWith("WEBHOOK_SIGNATURE_FAILED")) {
      return res.status(400).send(error.message.replace("WEBHOOK_SIGNATURE_FAILED: ", ""));
    }
    console.error("stripeWebhook error:", error);
    res.status(500).json({ success: false, message: "Webhook error" });
  }
};

export {
  placeOrder,
  verifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  refundOrder,
  cancelOrder,
  stripeWebhook,
  getOrderDetails,
};
