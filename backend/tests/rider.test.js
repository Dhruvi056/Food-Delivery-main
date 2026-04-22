import { jest } from "@jest/globals";
import { insforgeMock, store, clearDatabase } from "./setup.js";

// Mock the SDK module
jest.unstable_mockModule("../config/insforge.js", () => ({
  default: insforgeMock,
}));

// Mock socket.io
jest.unstable_mockModule("../config/socket.js", () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) }),
}));

// Re-import service after mocking
const { claimOrder, advanceOrder } = await import("../services/riderService.js");

describe("Rider Service Logic Tests", () => {
  beforeEach(() => {
    clearDatabase();
  });

  describe("claimOrder - Atomic Double-Assign Prevention", () => {
    it("should allow only one rider to claim an order when multiple attempts occur simultaneously", async () => {
      // 1. Setup mock order
      const orderId = "order-123";
      store.orders.push({
        id: orderId,
        status: "Ready for Pickup",
        rider_id: null,
        payment: true,
        user_id: "user-456",
      });

      // 2. Call claimOrder twice simultaneously
      // Note: In our in-memory mock, store.orders.push is synchronous, 
      // but the service uses async/await. We need to check if the mock handle atomic check.
      // In riderService.js: .is("rider_id", null) is part of the update.
      
      const p1 = claimOrder(orderId, "rider-A");
      const p2 = claimOrder(orderId, "rider-B");

      const results = await Promise.allSettled([p1, p2]);

      const success = results.filter(r => r.status === 'fulfilled');
      const failure = results.filter(r => r.status === 'rejected');

      // 3. Assertions
      expect(success.length).toBe(1);
      expect(failure.length).toBe(1);
      expect(failure[0].reason.message).toMatch(/already claimed|Claim failed/);
      
      const order = store.orders.find(o => o.id === orderId);
      expect(order.rider_id).not.toBeNull();
      // It should be either rider-A or rider-B depending on which one the mock processed first
    });
  });

  describe("Notification on Status Transition", () => {
    it("should insert a notification for every status transition", async () => {
      const orderId = "order-999";
      const userId = "user-777";
      store.orders.push({
        id: orderId,
        user_id: userId,
        status: "Ready for Pickup",
        rider_id: "rider-1",
      });

      // Transition 1: Pickup
      await advanceOrder(orderId, "rider-1");
      expect(store.notifications.length).toBe(1);
      expect(store.notifications[0].user_id).toBe(userId);
      expect(store.notifications[0].type).toBe("order_update");

      // Transition 2: Delivered
      await advanceOrder(orderId, "rider-1");
      expect(store.notifications.length).toBe(2);
      expect(store.notifications[1].message).toMatch(/delivered/i);
    });
  });
});
