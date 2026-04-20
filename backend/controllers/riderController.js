import {
  getAvailableOrders,
  acceptOrder,
  advanceDeliveryStatus,
  getRiderActiveOrder,
} from "../services/riderService.js";

const ERROR_MESSAGES = {
  ORDER_NOT_FOUND_OR_UNAUTHORIZED: "Order not found or you are not assigned to it.",
  LIFECYCLE_COMPLETE: "This order has already been delivered.",
};

const handleError = (res, error, fallback = "An unexpected error occurred") => {
  const msg = ERROR_MESSAGES[error.message] || error.message || fallback;
  res.json({ success: false, message: msg });
};

// GET /api/rider/available
export const listAvailableOrders = async (req, res) => {
  try {
    const orders = await getAvailableOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    handleError(res, error, "Error fetching available orders");
  }
};

// GET /api/rider/active
export const getActiveOrder = async (req, res) => {
  try {
    const order = await getRiderActiveOrder(req.userId);
    res.json({ success: true, data: order || null });
  } catch (error) {
    handleError(res, error, "Error fetching active order");
  }
};

// POST /api/rider/claim  { orderId }
export const claimOrder = async (req, res) => {
  try {
    const io = req.app.get("io");
    const order = await acceptOrder(req.body.orderId, req.userId, io);
    if (!order) {
      return res.json({ success: false, message: "This order was already claimed by another rider." });
    }
    res.json({ success: true, message: "Order claimed!", data: order });
  } catch (error) {
    handleError(res, error, "Error claiming order");
  }
};

// POST /api/rider/advance  { orderId }
export const advanceStatus = async (req, res) => {
  try {
    const io = req.app.get("io");
    const order = await advanceDeliveryStatus(req.body.orderId, req.userId, io);
    res.json({ success: true, message: `Status updated to: ${order.status}`, data: order });
  } catch (error) {
    handleError(res, error, "Error advancing delivery status");
  }
};
