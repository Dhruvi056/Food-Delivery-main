import { jest } from "@jest/globals";
import { insforgeMock, store, clearDatabase } from "./setup.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "citest-jwt-secret-minimum-32-characters-long";

// Mock dependencies
jest.unstable_mockModule("../config/insforge.js", () => ({
  default: insforgeMock,
}));
jest.unstable_mockModule("../config/socket.js", () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) }),
  initializeSocket: jest.fn(),
}));

const request = (await import("supertest")).default;
const { app } = await import("../server.js");

describe("Security Cross-Role Access Attack Vectors", () => {
  beforeEach(() => {
    clearDatabase();
  });

  const makeToken = (id, role) => {
    store.users.push({ id, role });
    return jwt.sign({ id, role }, JWT_SECRET);
  };

  it("SEC-1: User should not access rider available orders", async () => {
    const userToken = makeToken("u1", "user");
    const res = await request(app)
      .get("/api/rider/available")
      .set("token", userToken);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("SEC-2: Rider should not access admin food add route", async () => {
    const riderToken = makeToken("r1", "rider");
    const res = await request(app)
      .post("/api/food/add")
      .set("token", riderToken)
      .send({ name: "Hacker Food" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("SEC-3: Public should not access notifications", async () => {
    const res = await request(app).get("/api/notifications/");
    
    // Should be caught by authMiddleware before controller
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Not Authorized|token/i);
  });

  it("SEC-4: Rider should not advance another rider's order", async () => {
    const riderA_Token = makeToken("rider-A", "rider");
    const orderId = "order-owned-by-B";

    store.orders.push({
      id: orderId,
      rider_id: "rider-B",
      status: "Ready for Pickup",
      user_id: "customer-1"
    });

    const res = await request(app)
      .post("/api/rider/advance")
      .set("token", riderA_Token)
      .send({ orderId });

    // The status check happens in the service layer
    // The route responds with 200 { success: false, message: ... } or 500 error handled by middleware
    // If it's a catch block in route, it might return 200 with success:false
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Not your order/i);
  });
});
