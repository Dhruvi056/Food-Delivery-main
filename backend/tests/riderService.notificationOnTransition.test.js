import { jest } from "@jest/globals";
import { insforgeMock, store, clearDatabase } from "./setup.js";

// Mock dependencies
jest.unstable_mockModule("../config/insforge.js", () => ({
  default: insforgeMock,
}));
jest.unstable_mockModule("../config/socket.js", () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) }),
}));

const { advanceOrder } = await import("../services/riderService.js");

describe("Rider Service - Notification on Every Status Transition", () => {
  beforeEach(() => {
    clearDatabase();
  });

  it("should insert a notification row for every status step", async () => {
    const orderId = "order-notif-123";
    const userId = "user-customer";
    
    store.orders.push({
      id: orderId,
      user_id: userId,
      status: "Ready for Pickup",
      rider_id: "rider-X",
      payment: true
    });

    // Step 1: Ready for Pickup -> Out for Delivery
    await advanceOrder(orderId, "rider-X");
    expect(store.notifications.length).toBe(1);
    expect(store.notifications[0].user_id).toBe(userId);
    expect(store.notifications[0].message).toMatch(/picked up/i);

    // Step 2: Out for Delivery -> Delivered
    await advanceOrder(orderId, "rider-X");
    expect(store.notifications.length).toBe(2);
    expect(store.notifications[1].message).toMatch(/delivered/i);
  });
});
