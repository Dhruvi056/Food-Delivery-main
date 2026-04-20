import { jest } from "@jest/globals";

// In ES Modules, we must mock BEFORE importing the dependencies
jest.unstable_mockModule("../utils/emailService.js", () => ({
  generateOTP: jest.fn(() => "123456"),
  send2FAEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));

// Dynamically import dependents AFTER mock registration
const request = (await import("supertest")).default;
const { app } = await import("../server.js");
const dbHandler = await import("./setup.js");

describe("User Service Integration Tests", () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe("User Registration: POST /api/user/register", () => {
    it("should successfully register a new user and return JWT tokens", async () => {
      const res = await request(app).post("/api/user/register").send({
        name: "QA Automation Tester",
        email: "qatester@biteblitz.com",
        password: "SecurePassword123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.name).toBe("QA Automation Tester");
    });

    it("should fail registration with invalid email format", async () => {
      const res = await request(app).post("/api/user/register").send({
        name: "QA Automation",
        email: "not-an-email",
        password: "SecurePassword123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid email/i);
    });

    it("should fail registration with short password", async () => {
      const res = await request(app).post("/api/user/register").send({
        name: "QA",
        email: "qa2@biteblitz.com",
        password: "short",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least 8 characters|strong password/i);
    });
  });

  describe("User Login: POST /api/user/login", () => {
    beforeEach(async () => {
      // Seed a test user
      await request(app).post("/api/user/register").send({
        name: "Login Tester",
        email: "login@biteblitz.com",
        password: "LoginPassword123",
      });
    });

    it("should enforce 2FA and not immediately issue tokens for valid credentials", async () => {
      const res = await request(app).post("/api/user/login").send({
        email: "login@biteblitz.com",
        password: "LoginPassword123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.requires2FA).toBe(true);
      // Access tokens should NOT be defined yet in Step 1 of 2FA
      expect(res.body.token).toBeUndefined();
    });

    it("should reject invalid login credentials", async () => {
      const res = await request(app).post("/api/user/login").send({
        email: "login@biteblitz.com",
        password: "WrongPassword!",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });
  });
});
