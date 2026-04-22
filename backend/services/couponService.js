import insforge from "../config/insforge.js";

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Validate a coupon code and return its discount details.
 */
export const validateCoupon = async (code, userId) => {
  const { data: coupon } = await insforge.database
    .from("coupons")
    .select()
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!coupon) throw new Error("INVALID_CODE");
  
  if (coupon.expiry_date && new Date() > new Date(coupon.expiry_date)) {
    throw new Error("EXPIRED_CODE");
  }
  
  if (coupon.used_count >= coupon.usage_limit) {
    throw new Error("LIMIT_REACHED");
  }

  // Check per-user limit (single use)
  const { data: usage } = await insforge.database
    .from("coupon_uses")
    .select()
    .eq("coupon_id", coupon.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (usage) throw new Error("COUPON_ALREADY_USED");

  return {
    id: coupon.id,
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
    .single();

  if (error) throw new Error(error.message);
  return newCoupon;
};
