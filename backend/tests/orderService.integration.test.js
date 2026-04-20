import { jest } from "@jest/globals";

// Mock stripe to entirely prevent hitting the external Stripe API during testing
jest.unstable_mockModule("stripe", () => {
    const mStripe = {
        coupons: {
            create: jest.fn().mockResolvedValue({ id: "mock_coupon_BITE20" }),
            retrieve: jest.fn().mockResolvedValue({ id: "mock_coupon_BITE20", percent_off: 20 }),
        },
        checkout: {
            sessions: {
                create: jest.fn().mockResolvedValue({ url: "https://checkout.stripe.mock/session_id" })
            }
        }
    };
    // Mock the Stripe default export which is a class factory constructor
    return { default: jest.fn(() => mStripe) };
});

const request = (await import("supertest")).default;
const { app } = await import("../server.js");
const dbHandler = await import("./setup.js");
const userModel = (await import("../models/userModel.js")).default;
const foodModel = (await import("../models/foodModel.js")).default;

describe("Order Service Integration Tests", () => {
  let uToken = "";
  let sampleFoodId = "";

  beforeAll(async () => {
    await dbHandler.connect();

    // Setup User
    const registerRes = await request(app).post("/api/user/register").send({
      name: "Checkout Tester",
      email: "order@biteblitz.com",
      password: "TestPassword123"
    });
    uToken = registerRes.body.token;

    // Setup Food Items directly via model
    const mockFood = await foodModel.create({
      name: "Test Burger",
      description: "A juicy test burger",
      price: 150,
      image: "burger.png",
      category: "Burgers",
      calorie: 500,
    });
    sampleFoodId = mockFood._id.toString();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe("POST /api/order/place", () => {
    it("should process a COD order and NOT call Stripe", async () => {
      const orderData = {
        items: [{ _id: sampleFoodId, name: "Test Burger", price: 150, quantity: 2 }],
        amount: 350,
        address: {
            firstName: "QA", lastName: "Test", email: "temp@m.com",
            street: "123 Test St", city: "NYC", state: "NY", zipcode: "10001", country: "US", phone: "1234567890"
        },
        paymentMethod: "COD"
      };

      const res = await request(app)
        .post("/api/order/place")
        .set("token", uToken)
        .send(orderData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Order placed/i);
    });

    it("should process a Stripe order with BITE20 promo applied correctly", async () => {
        const orderData = {
          items: [{ _id: sampleFoodId, name: "Test Burger", price: 200, quantity: 1 }],
          amount: 250,
          promoCode: "BITE20",
          address: {
              firstName: "QA", lastName: "Test", email: "temp@m.com",
              street: "123 Test St", city: "NYC", state: "NY", zipcode: "10001", country: "US", phone: "1234567890"
          },
          paymentMethod: "Stripe"
        };
  
        const res = await request(app)
          .post("/api/order/place")
          .set("token", uToken)
          .send(orderData);
  
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.session_url).toBe("https://checkout.stripe.mock/session_id");
    });
  });
});
