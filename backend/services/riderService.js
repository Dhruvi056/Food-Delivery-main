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
 * Includes both "Food Processing" (paid, awaiting kitchen) and
 * "Ready for Pickup" (kitchen done) orders that have no rider assigned yet.
 */
export const getAvailableOrders = async () => {
  const data = await dbQuery("orders", (q) =>
    q
      .select("*")
      .in("status", ["Food Processing", "Ready for Pickup"])
      .is("rider_id", null)
      .eq("payment", true)
      .order("created_at", { ascending: true })
  );
  console.log(`[RiderService] Available orders found: ${Array.isArray(data) ? data.length : 0}`);
  return data;
};


/**
 * Claim an available order.
 * Guards against a rider claiming multiple orders simultaneously.
 */
export const claimOrder = async (orderId, riderId) => {
  // Guard: check if this rider already has an active order
  const existingActive = await dbQuery("orders", (q) =>
    q
      .select("id")
      .eq("rider_id", riderId)
      .in("status", ["Food Processing", "Ready for Pickup", "Out for Delivery"])
      .maybeSingle()
  );
  if (existingActive) throw new Error("RIDER_ALREADY_BUSY");

  // Step 1: Read order by id
  const order = await dbQuery("orders", (q) =>
    q.select("*").eq("id", orderId).maybeSingle()
  );

  if (!order) throw new Error("Order not found");
  if (order.rider_id) throw new Error("Order already claimed");
  if (!["Food Processing", "Ready for Pickup"].includes(order.status)) throw new Error("Order not available");

  // Step 2: Update orders (atomic: only if rider_id is still null)
  const updatedOrder = await dbQuery("orders", (q) =>
    q
      .update({ rider_id: riderId })
      .eq("id", orderId)
      .is("rider_id", null)
      .select()
      .single()
  );

  if (!updatedOrder) throw new Error("Claim failed, try again");

  // Step 3: Update users (rider status)
  await dbQuery("users", (q) =>
    q.update({ rider_status: "on_delivery" }).eq("id", riderId)
  );

  // Step 4: Emit to user + admin
  const io = getIO();
  io.to(`user_${order.user_id}`).emit("order_status_update", { orderId, status: order.status, riderId });
  io.to("admin_room").emit("order_status_update", { orderId, status: order.status, riderId });

  // Step 5: Insert notification for customer
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

  // Step 4: If Delivered, free the rider
  if (transition.next === "Delivered") {
    await dbQuery("users", (q) =>
      q.update({ rider_status: "available" }).eq("id", riderId)
    );
    getIO().to("rider_room").emit("order_completed", { orderId });
  }

  // Step 5: Emit to user, admin, and rider (full sync)
  const io = getIO();
  const statusPayload = { orderId, status: transition.next };
  io.to(`user_${order.user_id}`).emit("order_status_update", statusPayload);
  io.to("admin_room").emit("order_status_update", statusPayload);
  io.to(`rider_${riderId}`).emit("order_status_update", statusPayload);

  // Step 6: Insert notification for customer
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
 * Get all completed deliveries for a rider.
 */
export const getRiderDeliveries = async (riderId) => {
  return await dbQuery("orders", (q) =>
    q
      .select("id, status, amount, delivery_fee, address, items, delivered_at, created_at")
      .eq("rider_id", riderId)
      .order("created_at", { ascending: false })
  );
};

/**
 * Get earnings summary for a rider.
 */
export const getRiderEarnings = async (riderId) => {
  const orders = await dbQuery("orders", (q) =>
    q
      .select("id, status, amount, delivery_fee, delivered_at, created_at")
      .eq("rider_id", riderId)
      .eq("status", "Delivered")
      .order("delivered_at", { ascending: false })
  );

  const RIDER_CUT_PER_DELIVERY = 40; // ₹40 flat per delivery (configurable)
  const deliveries = orders || [];

  const totalEarnings = deliveries.length * RIDER_CUT_PER_DELIVERY;
  const breakdown = deliveries.map(o => ({
    orderId: o.id,
    date: o.delivered_at || o.created_at,
    earned: RIDER_CUT_PER_DELIVERY,
    orderAmount: o.amount,
  }));

  return { totalEarnings, deliveryCount: deliveries.length, breakdown, perDelivery: RIDER_CUT_PER_DELIVERY };
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
