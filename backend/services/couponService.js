import couponModel from "../models/couponModel.js";

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Validate a coupon code and return its discount details.
 * Throws descriptive errors for all invalid states.
 * @param {string} code - raw code string from the user
 * @returns {{ discountType, discountValue, code }}
 */
export const validateCouponCode = async (code) => {
  const coupon = await couponModel.findOne({ code: code.toUpperCase() });

  if (!coupon) throw new Error("INVALID_CODE");
  if (!coupon.isActive) throw new Error("INACTIVE_CODE");
  if (new Date() > coupon.expiryDate) throw new Error("EXPIRED_CODE");
  if (coupon.usedCount >= coupon.usageLimit) throw new Error("LIMIT_REACHED");

  return {
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    code: coupon.code,
  };
};

/**
 * Create a new coupon (admin / seeding use).
 */
export const createCoupon = async (couponData) => {
  const newCoupon = new couponModel(couponData);
  await newCoupon.save();
  return newCoupon;
};
