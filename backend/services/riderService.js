import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

// Rider-facing delivery lifecycle (in strict progression order)
const RIDER_LIFECYCLE = [
  "Accepted by Rider",
  "At Restaurant",
  "Picked Up",
  "Out for Delivery",
  "Delivered",
];

const emitSocketEvent = (io, room, event, payload) => {
  if (io) io.to(room).emit(event, payload);
};

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Fetch all orders visible to riders: status "Ready for Pickup" with no rider
 * assigned yet. Returns lightweight projection only.
 */
export const getAvailableOrders = async () => {
  return orderModel
    .find({ status: "Ready for Pickup", riderId: null, payment: true })
    .select("_id items amount address status date")
    .sort({ date: 1 }) // oldest first = FIFO fairness
    .lean();
};

/**
 * Atomic claim: uses findOneAndUpdate with riderId:null check so only the
 * first rider to submit wins. Returns null if order was already claimed.
 */
export const acceptOrder = async (orderId, riderId, io) => {
  const order = await orderModel.findOneAndUpdate(
    { _id: orderId, riderId: null, status: "Ready for Pickup" }, // atomic guard
    { riderId, status: "Accepted by Rider" },
    { new: true }
  );

  if (!order) return null; // already claimed by another rider

  // Mark rider as busy
  await userModel.findByIdAndUpdate(riderId, { riderStatus: false });

  // Notify admin that a rider accepted this order
  emitSocketEvent(io, "admin_room", "order_update", {
    orderId: order._id,
    status: "Accepted by Rider",
    riderId,
    updatedAt: new Date(),
  });

  return order;
};

/**
 * Advance status through RIDER_LIFECYCLE.
 * Validates the rider owns this order before mutating.
 * When status reaches "Delivered", marks rider as available again.
 */
export const advanceDeliveryStatus = async (orderId, riderId, io) => {
  const order = await orderModel.findOne({ _id: orderId, riderId });
  if (!order) throw new Error("ORDER_NOT_FOUND_OR_UNAUTHORIZED");

  const currentIdx = RIDER_LIFECYCLE.indexOf(order.status);
  if (currentIdx === -1 || currentIdx === RIDER_LIFECYCLE.length - 1) {
    throw new Error("LIFECYCLE_COMPLETE"); // already delivered or not in lifecycle
  }

  const nextStatus = RIDER_LIFECYCLE[currentIdx + 1];
  const updatedOrder = await orderModel.findByIdAndUpdate(
    orderId,
    { status: nextStatus },
    { new: true }
  );

  // If delivered: free up the rider
  if (nextStatus === "Delivered") {
    await userModel.findByIdAndUpdate(riderId, { riderStatus: true });
    emitSocketEvent(io, `rider_${riderId}`, "delivery_complete", { orderId });
  }

  // Notify the customer
  emitSocketEvent(io, `user_${updatedOrder.userId}`, "order_update", {
    orderId: updatedOrder._id,
    status: nextStatus,
    updatedAt: new Date(),
  });

  // Notify admin
  emitSocketEvent(io, "admin_room", "order_update", {
    orderId: updatedOrder._id,
    status: nextStatus,
    riderId,
    updatedAt: new Date(),
  });

  return updatedOrder;
};

/**
 * Return the single active order claimed by this rider (if any).
 */
export const getRiderActiveOrder = async (riderId) => {
  return orderModel
    .findOne({ riderId, status: { $in: RIDER_LIFECYCLE.filter(s => s !== "Delivered") } })
    .lean();
};
