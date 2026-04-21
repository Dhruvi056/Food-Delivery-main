import insforge from "../config/insforge.js";

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

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Fetch all orders visible to riders: status "Ready for Pickup" with no rider assigned.
 */
export const getAvailableOrders = async () => {
  const { data: orders, error } = await insforge.database
    .from("orders")
    .select("id, items, amount, address, status, date")
    .eq("status", "Ready for Pickup")
    .is("rider_id", null)
    .eq("payment", true)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  return (orders || []).map((o) => ({ ...o, _id: o.id }));
};

/**
 * Atomic claim: fetch order with guard, then update if unclaimed.
 * Returns null if the order was already claimed by another rider.
 */
export const acceptOrder = async (orderId, riderId, io) => {
  // Fetch with guard conditions
  const { data: order } = await insforge.database
    .from("orders")
    .select()
    .eq("id", orderId)
    .is("rider_id", null)
    .eq("status", "Ready for Pickup")
    .maybeSingle();

  if (!order) return null; // already claimed

  const { data: updatedOrder, error } = await insforge.database
    .from("orders")
    .update({ rider_id: riderId, status: "Accepted by Rider" })
    .eq("id", orderId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);

  // Mark rider as busy
  await insforge.database
    .from("users")
    .update({ rider_status: false })
    .eq("id", riderId);

  emitSocketEvent(io, "admin_room", "order_update", {
    orderId: updatedOrder.id,
    status: "Accepted by Rider",
    riderId,
    updatedAt: new Date(),
  });

  return { ...updatedOrder, _id: updatedOrder.id };
};

/**
 * Advance status through RIDER_LIFECYCLE.
 */
export const advanceDeliveryStatus = async (orderId, riderId, io) => {
  const { data: order } = await insforge.database
    .from("orders")
    .select()
    .eq("id", orderId)
    .eq("rider_id", riderId)
    .maybeSingle();

  if (!order) throw new Error("ORDER_NOT_FOUND_OR_UNAUTHORIZED");

  const currentIdx = RIDER_LIFECYCLE.indexOf(order.status);
  if (currentIdx === -1 || currentIdx === RIDER_LIFECYCLE.length - 1) {
    throw new Error("LIFECYCLE_COMPLETE");
  }

  const nextStatus = RIDER_LIFECYCLE[currentIdx + 1];

  const { data: updatedOrder, error } = await insforge.database
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);

  // If delivered: free up the rider
  if (nextStatus === "Delivered") {
    await insforge.database
      .from("users")
      .update({ rider_status: true })
      .eq("id", riderId);

    emitSocketEvent(io, `rider_${riderId}`, "delivery_complete", { orderId });
  }

  // Notify the customer
  emitSocketEvent(io, `user_${updatedOrder.user_id}`, "order_update", {
    orderId: updatedOrder.id,
    status: nextStatus,
    updatedAt: new Date(),
  });

  // Notify admin
  emitSocketEvent(io, "admin_room", "order_update", {
    orderId: updatedOrder.id,
    status: nextStatus,
    riderId,
    updatedAt: new Date(),
  });

  return { ...updatedOrder, _id: updatedOrder.id };
};

/**
 * Return the single active order claimed by this rider (if any).
 */
export const getRiderActiveOrder = async (riderId) => {
  const activeStatuses = RIDER_LIFECYCLE.filter((s) => s !== "Delivered");

  const { data: order } = await insforge.database
    .from("orders")
    .select()
    .eq("rider_id", riderId)
    .in("status", activeStatuses)
    .maybeSingle();

  return order ? { ...order, _id: order.id } : null;
};
