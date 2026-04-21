import insforge from "../config/insforge.js";

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Validate a coupon code and return its discount details.
 */
export const validateCouponCode = async (code) => {
  const { data: coupon } = await insforge.database
    .from("coupons")
    .select()
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!coupon) throw new Error("INVALID_CODE");
  if (!coupon.is_active) throw new Error("INACTIVE_CODE");
  if (new Date() > new Date(coupon.expiry_date)) throw new Error("EXPIRED_CODE");
  if (coupon.used_count >= coupon.usage_limit) throw new Error("LIMIT_REACHED");

  return {
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    code: coupon.code,
  };
};

/**
 * Create a new coupon (admin / seeding use).
 */
export const createCoupon = async (couponData) => {
  const { data: newCoupon, error } = await insforge.database
    .from("coupons")
    .insert([{
      code: couponData.code?.toUpperCase(),
      discount_type: couponData.discountType,
      discount_value: couponData.discountValue,
      expiry_date: couponData.expiryDate,
      usage_limit: couponData.usageLimit ?? 100,
      is_active: couponData.isActive ?? true,
    }])
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  return newCoupon;
};
