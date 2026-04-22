process.env.JWT_SECRET = 'test-secret';
import { jest } from "@jest/globals";
import { insforgeMock, store, clearDatabase } from "./setup.js";
import { computeTax } from "../utils/taxUtils.js";

// Mock the SDK module
jest.unstable_mockModule("../config/insforge.js", () => ({
  default: insforgeMock,
}));

// Mock Stripe
jest.unstable_mockModule("stripe", () => {
  return {
    default: jest.fn(() => ({
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({ id: 'mock-session-id', url: 'https://stripe.com/pay' })
        }
      }
    }))
  };
});

const { placeNewOrder } = await import("../services/orderService.js");

describe("Order Logic Integration Tests", () => {
  beforeEach(() => {
    clearDatabase();
  });

  describe("Tax Computations (Unit)", () => {
    it("should calculate correct tax for high-tax states", () => {
      expect(computeTax("NY", 200)).toBe(18);
    });
  });

  describe("Coupon Per-User Usage Enforcement", () => {
    it("should reject order if user has already used the one-time coupon", async () => {
      const userId = "user-1";
      const couponId = "coupon-X";
      const couponCode = "SAVE50";

      // Setup store
      store.coupons.push({ id: couponId, code: couponCode, usage_limit: 10, used_count: 5, is_active: true });
      store.coupon_uses.push({ user_id: userId, coupon_id: couponId });

      store.users.push({ 
        id: userId, 
        role: 'user',
        addresses: [{ id: 'addr-1', street: '123 Main', city: 'NY' }]
      });

      const payload = {
        userId,
        items: [{ _id: 'food-1', name: 'Pizza', price: 100, quantity: 1 }],
        amount: 50,
        addressId: 'addr-1',
        promoCode: couponCode
      };

      try {
        await placeNewOrder(payload, null);
        throw new Error("Should have thrown Coupon already used error");
      } catch (err) {
        expect(err.message).toMatch(/already used|single use/i);
      }

      expect(store.orders.length).toBe(0);
      expect(store.coupons[0].used_count).toBe(5);
    });
  });

  describe("Order Placement - Delivery Address Snapshot", () => {
    it("should store a snapshot of the selected address in the order", async () => {
      const userId = "user-2";
      const addressId = "addr-home";
      const targetAddress = { street: "123 Main St", city: "NYC", zip: "10001" };

      store.users.push({
        id: userId,
        addresses: [
          { id: 'addr-work', street: '456 Office Rd', city: 'SF' },
          { id: addressId, ...targetAddress }
        ]
      });

      const payload = {
        userId,
        items: [{ _id: 'food-1', name: 'Burger', price: 10, quantity: 1 }],
        amount: 10,
        addressId: addressId
      };

      const result = await placeNewOrder(payload, null);
      
      const createdOrder = store.orders[0];
      expect(createdOrder.delivery_address).toEqual(expect.objectContaining(targetAddress));
      expect(createdOrder.delivery_address.street).toBe("123 Main St");
    });
  });
});
