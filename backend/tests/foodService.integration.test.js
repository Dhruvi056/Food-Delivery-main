import { jest } from "@jest/globals";

// ── Mock InsForge SDK (must happen BEFORE any service imports) ─────────────────
// We register the mock factory here. The actual buildInsforgeMock() call
// happens lazily inside the factory so the mock is fully wired before
// any of the service modules load.
import { buildInsforgeMock, clearDatabase, store } from "./setup.js";

jest.unstable_mockModule("../config/insforge.js", () => ({
  default: buildInsforgeMock(),
}));

// Mock sharp — no image processing in CI
jest.unstable_mockModule("sharp", () => ({
  default: jest.fn(() => ({
    resize:   jest.fn().mockReturnThis(),
    webp:     jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("fake-webp")),
  })),
}));

// Mock email so OTP emails never fire
jest.unstable_mockModule("../utils/emailService.js", () => ({
  generateOTP:            jest.fn(() => "123456"),
  send2FAEmail:           jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

// ── Import app AFTER mocks are registered ─────────────────────────────────────
const request = (await import("supertest")).default;
const { app }  = await import("../server.js");
const jwt      = (await import("jsonwebtoken")).default;

// ── Helpers ───────────────────────────────────────────────────────────────────
const JWT_SECRET    = process.env.JWT_SECRET || "citest-jwt-secret-minimum-32-characters-long";
const ADMIN_USER_ID = "mock-admin-001";

const makeToken = (id, secret = JWT_SECRET) =>
  jwt.sign({ id }, secret, { expiresIn: "10m" });

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Food Service Integration Tests", () => {
  let adminToken  = "";
  let sampleFoodId = "";

  beforeAll(() => {
    // Seed a mock admin user directly into the in-memory store
    store.users.push({
      id:         ADMIN_USER_ID,
      name:       "Admin",
      email:      "admin@biteblitz.com",
      password:   "$2b$10$irrelevant",
      role:       "admin",
      cart_data:  {},
      addresses:  [],
      created_at: new Date().toISOString(),
    });
    adminToken = makeToken(ADMIN_USER_ID);
  });

  afterAll(() => clearDatabase());

  // ── POST /api/food/add ───────────────────────────────────────────────────────
  describe("POST /api/food/add", () => {
    it("should allow an admin to add a food item", async () => {
      const res = await request(app)
        .post("/api/food/add")
        .set("token", adminToken)
        .field("name", "Test Pizza")
        .field("description", "A mock pizza")
        .field("price", "299")
        .field("category", "Pizza")
        .field("calorie", "800")
        .attach("image", Buffer.from("fake_image_data"), "pizza.png");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Food Added");
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe("Test Pizza");

      // remapFood is now applied on insert: response has both .id and ._id
      sampleFoodId = res.body.data._id || res.body.data.id;
      expect(sampleFoodId).toBeTruthy();
    });

    it("should reject a non-admin user trying to add food", async () => {
      // Seed a normal user
      store.users.push({
        id:         "mock-user-001",
        name:       "Normal User",
        email:      "user@biteblitz.com",
        password:   "$2b$10$irrelevant",
        role:       "user",
        cart_data:  {},
        addresses:  [],
        created_at: new Date().toISOString(),
      });

      const userToken = makeToken("mock-user-001");

      const res = await request(app)
        .post("/api/food/add")
        .set("token", userToken)
        .field("name", "Unauthorized Food")
        .attach("image", Buffer.from("fake"), "img.png");

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden|insufficient/i);
    });
  });

  // ── GET /api/food/list ───────────────────────────────────────────────────────
  describe("GET /api/food/list", () => {
    it("should return the food list publicly (no auth required)", async () => {
      const res = await request(app).get("/api/food/list");
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ── POST /api/food/remove ────────────────────────────────────────────────────
  describe("POST /api/food/remove", () => {
    it("should soft-delete a food item when called by an admin", async () => {
      // Ensure sampleFoodId was set in the "add" test above
      expect(sampleFoodId).toBeTruthy();

      const res = await request(app)
        .post("/api/food/remove")
        .set("token", adminToken)
        .send({ id: sampleFoodId });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Food Removed/i);
    });
  });
});
