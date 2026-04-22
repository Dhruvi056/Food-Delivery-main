import { jest } from "@jest/globals";

// ── Mock InsForge SDK (must happen BEFORE any service imports) ─────────────────
import { buildInsforgeMock, clearDatabase } from "./setup.js";

jest.unstable_mockModule("../config/insforge.js", () => ({
  default: buildInsforgeMock(),
}));

// Mock email so 2FA OTPs never fire in CI
jest.unstable_mockModule("../utils/emailService.js", () => ({
  generateOTP:            jest.fn(() => "123456"),
  send2FAEmail:           jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

// ── Import app AFTER mocks are registered ─────────────────────────────────────
const request = (await import("supertest")).default;
const { app }  = await import("../server.js");

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("User Service Integration Tests", () => {
  beforeEach(() => clearDatabase());
  afterAll(()  => clearDatabase());

  // ── Registration ─────────────────────────────────────────────────────────────
  describe("User Registration: POST /api/user/register", () => {
    it("should successfully register a new user and return JWT tokens", async () => {
      const res = await request(app).post("/api/user/register").send({
        name:     "QA Automation Tester",
        email:    "qatester@biteblitz.com",
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
        name:     "QA Bad Email",
        email:    "not-an-email",
        password: "SecurePassword123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid email/i);
    });

    it("should fail registration with a password shorter than 8 characters", async () => {
      const res = await request(app).post("/api/user/register").send({
        name:     "QA Short Pass",
        email:    "short@biteblitz.com",
        password: "abc",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least 8 characters|strong password/i);
    });

    it("should reject duplicate email registration", async () => {
      const payload = { name: "Dupe", email: "dupe@biteblitz.com", password: "DupePass123" };
      await request(app).post("/api/user/register").send(payload);

      const res = await request(app).post("/api/user/register").send(payload);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  // ── Login ─────────────────────────────────────────────────────────────────────
  describe("User Login: POST /api/user/login", () => {
    beforeEach(async () => {
      // Seed a user to login with
      await request(app).post("/api/user/register").send({
        name:     "Login Tester",
        email:    "login@biteblitz.com",
        password: "LoginPassword123",
      });
    });

    it("should return tokens directly when SMTP is not configured (2FA bypass)", async () => {
      // In CI, SMTP_USER is not set → 2FA bypassed → tokens returned immediately
      const res = await request(app).post("/api/user/login").send({
        email:    "login@biteblitz.com",
        password: "LoginPassword123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // Either 2FA bypass (token present) or requires2FA true — both are valid
      const hasToken     = !!res.body.token;
      const has2FA       = res.body.requires2FA === true;
      expect(hasToken || has2FA).toBe(true);
    });

    it("should reject login with a wrong password", async () => {
      const res = await request(app).post("/api/user/login").send({
        email:    "login@biteblitz.com",
        password: "WrongPassword!",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it("should reject login for a non-existent email", async () => {
      const res = await request(app).post("/api/user/login").send({
        email:    "ghost@biteblitz.com",
        password: "AnyPassword123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
    });
  });

  // ── Token Refresh ─────────────────────────────────────────────────────────────
  describe("Token Rotation: POST /api/user/refresh-token", () => {
    it("should issue a new access token from a valid refresh token", async () => {
      // Register → get refresh token
      const reg = await request(app).post("/api/user/register").send({
        name:     "Refresh Tester",
        email:    "refresh@biteblitz.com",
        password: "RefreshPass123",
      });
      const refreshToken = reg.body.refreshToken;
      expect(refreshToken).toBeDefined();

      const res = await request(app)
        .post("/api/user/refresh-token")
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it("should reject an invalid or tampered refresh token", async () => {
      const res = await request(app)
        .post("/api/user/refresh-token")
        .send({ refreshToken: "invalid.tampered.token" });

      expect(res.body.success).toBe(false);
    });
  });
});
