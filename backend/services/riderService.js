import { dbQuery } from "../config/db.js";
import { getIO } from "../config/socket.js";

const STATUS_FLOW = {
  "Ready for Pickup": {
    next: "Out for Delivery",
    timestampCol: "picked_up_at",
    notifMessage: "Your order has been picked up and is on the way!",
  },
  "Out for Delivery": {
    next: "Delivered",
    timestampCol: "delivered_at",
    notifMessage: "Your order has been delivered. Enjoy your meal!",
  },
};

/**
 * Fetch all orders available for riders to claim.
 */
export const getAvailableOrders = async () => {
  return await dbQuery("orders", (q) =>
    q
      .select("*")
      .eq("status", "Ready for Pickup")
      .is("rider_id", null)
      .eq("payment", true)
      .order("created_at", { ascending: true })
  );
};

/**
 * Claim an available order.
 */
export const claimOrder = async (orderId, riderId) => {
  // Step 1: Read order by id
  const order = await dbQuery("orders", (q) =>
    q.select("*").eq("id", orderId).maybeSingle()
  );

  if (!order) throw new Error("Order not found");
  if (order.rider_id) throw new Error("Order already claimed");
  if (order.status !== "Ready for Pickup") throw new Error("Order not available");

  // Step 2: Update orders
  const updatedOrder = await dbQuery("orders", (q) =>
    q
      .update({
        rider_id: riderId,
      })
      .eq("id", orderId)
      .is("rider_id", null) // Atomic check
      .select()
      .single()
  );

  if (!updatedOrder) throw new Error("Claim failed, try again");

  // Step 3: Update users (rider status)
  await dbQuery("users", (q) =>
    q.update({ rider_status: "on_delivery" }).eq("id", riderId)
  );

  // Step 4: Emit via Socket.io
  getIO()
    .to(`user_${order.user_id}`)
    .emit("order_status_update", {
      orderId,
      status: "Ready for Pickup",
      riderId,
    });

  // Step 5: Insert notification
  await dbQuery("notifications", (q) =>
    q.insert({
      user_id: order.user_id,
      type: "rider_assigned",
      message: "A rider has been assigned to your order!",
      order_id: orderId,
    })
  );

  return updatedOrder;
};

/**
 * Advance an order to the next status in the flow.
 */
export const advanceOrder = async (orderId, riderId) => {
  // Step 1: Read order by id
  const order = await dbQuery("orders", (q) =>
    q.select("*").eq("id", orderId).maybeSingle()
  );

  if (!order) throw new Error("Order not found");
  if (order.rider_id !== riderId) throw new Error("Not your order");

  // Step 2: Get transition
  const transition = STATUS_FLOW[order.status];
  if (!transition) throw new Error("Cannot advance from current status");

  // Step 3: Update orders
  const updatedOrder = await dbQuery("orders", (q) =>
    q
      .update({
        status: transition.next,
        [transition.timestampCol]: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single()
  );

  // Step 4: If Delivered: free the rider
  if (transition.next === "Delivered") {
    await dbQuery("users", (q) =>
      q.update({ rider_status: "available" }).eq("id", riderId)
    );
    getIO().to("rider_room").emit("order_completed", { orderId });
  }

  // Step 5: Emit to user
  getIO()
    .to(`user_${order.user_id}`)
    .emit("order_status_update", {
      orderId,
      status: transition.next,
    });

  // Step 6: Insert notification
  await dbQuery("notifications", (q) =>
    q.insert({
      user_id: order.user_id,
      type: "order_update",
      message: transition.notifMessage,
      order_id: orderId,
    })
  );

  return updatedOrder;
};

/**
 * Update rider's GPS location.
 */
export const updateLocation = async (riderId, lat, lng) => {
  return await dbQuery("rider_locations", (q) =>
    q
      .upsert({
        rider_id: riderId,
        latitude: lat,
        longitude: lng,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'rider_id' })
      .select()
      .single()
  );
};

/**
 * Get the current active order for a rider.
 */
export const getActiveOrder = async (riderId) => {
  const data = await dbQuery("orders", (q) =>
    q
      .select("*")
      .eq("rider_id", riderId)
      .in("status", ["Ready for Pickup", "Out for Delivery"])
      .maybeSingle()
  );
  return data || null;
};
