import { jest } from "@jest/globals";
import { insforgeMock, store, clearDatabase } from "./setup.js";

// Mock dependencies
jest.unstable_mockModule("../config/insforge.js", () => ({
  default: insforgeMock,
}));
jest.unstable_mockModule("../config/socket.js", () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) }),
}));

const { claimOrder } = await import("../services/riderService.js");

describe("Rider Service - Atomic Double-Assign Prevention", () => {
  beforeEach(() => {
    clearDatabase();
  });

  it("should prevent two riders from claiming the same order simultaneously", async () => {
    const orderId = "order-race-1";
    store.orders.push({
      id: orderId,
      status: "Ready for Pickup",
      rider_id: null,
      payment: true
    });

    // Simulate two concurrent claims
    // The implementation uses .is("rider_id", null) in the update query
    const claim1 = claimOrder(orderId, "rider-A");
    const claim2 = claimOrder(orderId, "rider-B");

    const results = await Promise.allSettled([claim1, claim2]);

    const successful = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(successful.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason.message).toMatch(/already claimed|Claim failed/i);
    
    const finalOrder = store.orders.find(o => o.id === orderId);
    expect(finalOrder.rider_id).not.toBeNull();
  });
});
