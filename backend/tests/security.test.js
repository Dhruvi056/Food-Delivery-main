process.env.JWT_SECRET = 'test-secret';
import { jest } from "@jest/globals";
import { insforgeMock, store, clearDatabase } from "./setup.js";
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret';

// Mock the SDK module
jest.unstable_mockModule("../config/insforge.js", () => ({
  default: insforgeMock,
}));

// Mock socket.io
jest.unstable_mockModule("../config/socket.js", () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) }),
  initializeSocket: jest.fn(),
}));

const request = (await import("supertest")).default;
const { app }  = await import("../server.js");

describe("Cross-Role Access Security Checks", () => {
  beforeEach(() => {
    clearDatabase();
  });

  const signToken = (id, role = 'user') => {
    return jwt.sign({ id, role }, JWT_SECRET);
  };

  describe("CHECK 1: User visibility boundary", () => {
    it("should not return userA's orders to userB", async () => {
      // Setup
      store.users.push({ id: 'user-A', role: 'user' });
      store.users.push({ id: 'user-B', role: 'user' });
      
      store.orders.push(
        { id: 'order-A1', user_id: 'user-A', status: 'Delivered', amount: 10, items: [], address: {} },
        { id: 'order-A2', user_id: 'user-A', status: 'Delivered', amount: 20, items: [], address: {} }
      );

      const tokenB = signToken('user-B', 'user');
      const res = await request(app)
        .get("/api/order/userorders")
        .set("token", tokenB);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe("CHECK 3: Non-admin role guard", () => {
    it("should return 403 Forbidden when a user tries to access admin routes", async () => {
      store.users.push({ id: 'user-1', role: 'user' });
      
      const userToken = signToken('user-1', 'user');
      const res = await request(app)
        .get("/api/order/list") 
        .set("token", userToken);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden|Access denied|Unauthorized/i);
    });
  });

  describe("CHECK 4: Coupon Expiry", () => {
    it("should reject an order with an expired coupon", async () => {
      store.users.push({ 
        id: 'user-1', 
        role: 'user', 
        addresses: [{ id: 'addr-1', street: '123 Main St', city: 'NY' }] 
      });
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      store.coupons.push({
        id: 'c-expired',
        code: 'EXPIRED50',
        expires_at: pastDate.toISOString(),
        usage_limit: 10,
        used_count: 0,
        is_active: true
      });

      const userToken = signToken('user-1', 'user');
      const res = await request(app)
        .post("/api/order/place")
        .set("token", userToken)
        .send({
          address: {
            firstName: "QA",
            lastName: "Tester",
            email: "qa@test.com",
            phone: "1234567890",
            street: "123 Main St",
            city: "NYC",
            state: "NY",
            zipcode: "10001",
            country: "USA"
          },
          items: [{ _id: 'food-1', name: 'Pizza', price: 100, quantity: 1 }],
          amount: 50,
          addressId: 'addr-1',
          promoCode: 'EXPIRED50'
        });

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/expired|invalid/i);
    });
  });
});
