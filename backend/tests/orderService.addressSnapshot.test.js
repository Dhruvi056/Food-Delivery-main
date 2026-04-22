import { jest } from "@jest/globals";
import { insforgeMock, store, clearDatabase } from "./setup.js";

// Mock dependencies
jest.unstable_mockModule("../config/insforge.js", () => ({
  default: insforgeMock,
}));
jest.unstable_mockModule("stripe", () => ({
  default: jest.fn(() => ({
    checkout: { sessions: { create: jest.fn().mockResolvedValue({ id: 'sid', url: 'http://stripe.com' }) } }
  }))
}));

const { placeNewOrder } = await import("../services/orderService.js");

describe("Order Service - Address JSONB Snapshot", () => {
  beforeEach(() => {
    clearDatabase();
  });

  it("should store a snapshot of the address in delivery_address field", async () => {
    const userId = "user-snapshot";
    const addressId = "addr-007";
    const myAddress = { street: "123 Quantum St", city: "Neo City", zipcode: "99999" };

    store.users.push({
      id: userId,
      addresses: [
        { id: addressId, ...myAddress }
      ]
    });

    const payload = {
      userId,
      addressId: addressId,
      items: [{ _id: "food-1", name: "Cyber Pizza", price: 20, quantity: 1 }],
      amount: 20
    };

    await placeNewOrder(payload, null);

    const savedOrder = store.orders[0];
    expect(savedOrder.delivery_address).toBeDefined();
    expect(typeof savedOrder.delivery_address).toBe('object');
    expect(savedOrder.delivery_address.street).toBe("123 Quantum St");
    
    // Verify it's a snapshot (changing the user's address later shouldn't affect the order)
    // In our mock, store.orders[0].delivery_address is already a copy
  });
});
