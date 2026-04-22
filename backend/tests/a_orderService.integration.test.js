import { jest } from "@jest/globals";

// ── Order service integration tests ───────────────────────────────────────────
// This file MUST be alphabetically first in the tests/ directory so that:
//   1. jest.unstable_mockModule for insforge + stripe are registered BEFORE
//      any other suite imports server.js (and thus orderService.js)
//   2. The shared module cache in --runInBand mode sees our mocks first.
//
// File is named "a_orderService..." to sort before foodService/userService.

import { buildInsforgeMock, store, clearDatabase } from "./setup.js";

jest.unstable_mockModule("../config/insforge.js", () => ({
  default: buildInsforgeMock(),
}));

// ── Mock Stripe ───────────────────────────────────────────────────────────────
const mockStripeInstance = {
  coupons: {
    create:   jest.fn().mockResolvedValue({ id: "mock_coupon_BITE20" }),
    retrieve: jest.fn().mockResolvedValue({ id: "mock_coupon_BITE20", percent_off: 20 }),
  },
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id:  "mock_session_id",
        url: "https://checkout.stripe.mock/session_id",
      }),
      retrieve: jest.fn().mockResolvedValue({
        id:             "mock_session_id",
        payment_intent: "mock_pi_id",
      }),
    },
  },
  refunds: {
    create: jest.fn().mockResolvedValue({ id: "mock_refund_id" }),
  },
};

jest.unstable_mockModule("stripe", () => ({
  default: jest.fn(() => mockStripeInstance),
}));

// ── Mock notifications ────────────────────────────────────────────────────────
jest.unstable_mockModule("../utils/notificationService.js", () => ({
  sendOrderConfirmation:    jest.fn().mockResolvedValue(undefined),
  sendStatusUpdateEmail:    jest.fn().mockResolvedValue(undefined),
  sendOrderConfirmationSMS: jest.fn().mockResolvedValue(undefined),
  sendStatusUpdateSMS:      jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule("../utils/emailService.js", () => ({
  generateOTP:            jest.fn(() => "123456"),
  send2FAEmail:           jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule("sharp", () => ({
  default: jest.fn(() => ({
    resize:   jest.fn().mockReturnThis(),
    webp:     jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("fake-webp")),
  })),
}));

// ── Import app AFTER all mocks ────────────────────────────────────────────────
const request = (await import("supertest")).default;
const { app }  = await import("../server.js");
const jwt      = (await import("jsonwebtoken")).default;

// ── Constants ─────────────────────────────────────────────────────────────────
const JWT_SECRET    = process.env.JWT_SECRET || "citest-jwt-secret-minimum-32-characters-long";
const ORDER_USER_ID = "mock-order-user-001";

const MOCK_FOOD = {
  id:           "mock-food-order-001",
  _id:          "mock-food-order-001",
  name:         "Test Burger",
  description:  "A juicy test burger",
  price:        150,
  image:        "https://mock-cdn.insforge.app/food-images/burger.webp",
  category:     "Burgers",
  calorie:      500,
  is_deleted:   false,
  is_available: true,
  stock_count:  100,
  created_at:   new Date().toISOString(),
};

const ORDER_ADDRESS = {
  firstName: "QA", lastName: "Test",
  street: "123 Test St", city: "Mumbai",
  state: "MH", zipcode: "400001",
  phone: "9876543210",
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Order Service Integration Tests", () => {
  let uToken = "";

  beforeAll(() => {
    // Seed user and food directly into the in-memory store
    store.users.push({
      id:         ORDER_USER_ID,
      name:       "Checkout Tester",
      email:      "order@biteblitz.com",
      password:   "$2b$10$irrelevant",
      role:       "user",
      cart_data:  { "mock-food-order-001": 2 },
      addresses:  [],
      created_at: new Date().toISOString(),
    });
    store.foods.push(MOCK_FOOD);

    uToken = jwt.sign({ id: ORDER_USER_ID }, JWT_SECRET, { expiresIn: "10m" });
  });

  afterAll(() => {
    store.users  = store.users.filter(u => u.id !== ORDER_USER_ID);
    store.foods  = store.foods.filter(f => f.id !== "mock-food-order-001");
    store.orders = [];
  });

  // ── COD ─────────────────────────────────────────────────────────────────────
  describe("POST /api/order/place — COD", () => {
    it("should place a COD order without calling Stripe", async () => {
      mockStripeInstance.checkout.sessions.create.mockClear();

      const res = await request(app)
        .post("/api/order/place")
        .set("token", uToken)
        .send({
          userId:        ORDER_USER_ID,
          items:         [{ _id: "mock-food-order-001", name: "Test Burger", price: 150, quantity: 2 }],
          amount:        300,
          address:       ORDER_ADDRESS,
          paymentMethod: "COD",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isCOD).toBe(true);
      expect(mockStripeInstance.checkout.sessions.create).not.toHaveBeenCalled();
    });
  });

  // ── Stripe ───────────────────────────────────────────────────────────────────
  describe("POST /api/order/place — Stripe", () => {
    beforeEach(() => {
      // Restore cart between tests
      const user = store.users.find(u => u.id === ORDER_USER_ID);
      if (user) user.cart_data = { "mock-food-order-001": 1 };
    });

    it("should create a Stripe checkout session and return the session URL", async () => {
      mockStripeInstance.checkout.sessions.create.mockClear();

      const res = await request(app)
        .post("/api/order/place")
        .set("token", uToken)
        .send({
          userId:        ORDER_USER_ID,
          items:         [{ _id: "mock-food-order-001", name: "Test Burger", price: 200, quantity: 1 }],
          amount:        200,
          address:       ORDER_ADDRESS,
          paymentMethod: "Stripe",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.session_url).toBe("https://checkout.stripe.mock/session_id");
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledTimes(1);
    });

    it("should apply BITE20 promo and create a Stripe coupon", async () => {
      mockStripeInstance.coupons.create.mockClear();
      mockStripeInstance.checkout.sessions.create.mockClear();

      const res = await request(app)
        .post("/api/order/place")
        .set("token", uToken)
        .send({
          userId:        ORDER_USER_ID,
          items:         [{ _id: "mock-food-order-001", name: "Test Burger", price: 200, quantity: 1 }],
          amount:        160,
          promoCode:     "BITE20",
          address:       ORDER_ADDRESS,
          paymentMethod: "Stripe",
        });

      expect(res.body.success).toBe(true);
      expect(res.body.session_url).toBeDefined();
      expect(mockStripeInstance.coupons.create).toHaveBeenCalledTimes(1);
      expect(mockStripeInstance.coupons.create).toHaveBeenCalledWith(
        expect.objectContaining({ percent_off: 20 })
      );
    });
  });

  // ── Auth guard ───────────────────────────────────────────────────────────────
  describe("POST /api/order/place — Auth guard", () => {
    it("should reject order placement without an auth token", async () => {
      const res = await request(app)
        .post("/api/order/place")
        .send({ items: [], paymentMethod: "COD" });

      expect(res.body.success).toBe(false);
    });
  });
});
