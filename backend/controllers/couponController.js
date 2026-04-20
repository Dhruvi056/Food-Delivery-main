import { validateCouponCode, createCoupon } from "../services/couponService.js";

const COUPON_MESSAGES = {
  INVALID_CODE: "Invalid promo code",
  INACTIVE_CODE: "Promo code is inactive",
  EXPIRED_CODE: "Promo code has expired",
  LIMIT_REACHED: "Promo code usage limit reached",
};

const validateCoupon = async (req, res) => {
  try {
    const result = await validateCouponCode(req.body.code);
    res.json({ success: true, message: "Promo code applied successfully", ...result });
  } catch (error) {
    const msg = COUPON_MESSAGES[error.message] || "Error validating coupon";
    res.json({ success: false, message: msg });
  }
};

const addCoupon = async (req, res) => {
  try {
    const coupon = await createCoupon(req.body);
    res.json({ success: true, message: "Coupon created", data: coupon });
  } catch (error) {
    res.json({ success: false, message: "Error creating coupon" });
  }
};

export { validateCoupon, addCoupon };
