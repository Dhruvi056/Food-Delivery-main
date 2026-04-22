import { jest } from "@jest/globals";
import { insforgeMock, store, clearDatabase } from "./setup.js";

// Mock dependencies
jest.unstable_mockModule("../config/insforge.js", () => ({
  default: insforgeMock,
}));

const { validateCoupon } = await import("../services/couponService.js");

describe("Coupon Service - Per-User Usage Enforcement", () => {
  beforeEach(() => {
    clearDatabase();
  });

  it("should reject a coupon if the user has already used it", async () => {
    const userId = "user-123";
    const couponCode = "WELCOME50";
    const couponId = "coupon-1";

    store.coupons.push({
      id: couponId,
      code: couponCode,
      is_active: true,
      usage_limit: 100,
      used_count: 5
    });

    // Mark as used by this user
    store.coupon_uses.push({
      user_id: userId,
      coupon_id: couponId
    });

    try {
      await validateCoupon(couponCode, userId);
      throw new Error("Should have failed");
    } catch (err) {
      expect(err.message).toMatch(/already_used|single_use|COUPON_ALREADY_USED/i);
    }
  });
});
