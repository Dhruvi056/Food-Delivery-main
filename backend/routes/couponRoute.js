import express from "express";
import { validateCoupon, addCoupon } from "../controllers/couponController.js";
import authMiddleware from "../middleware/auth.js";
import { validateCouponCheck } from "../middleware/validate.js";

const couponRouter = express.Router();

couponRouter.post("/validate", authMiddleware, validateCouponCheck, validateCoupon);
// Optional: restrict add to admin only
couponRouter.post("/add", authMiddleware, addCoupon);

export default couponRouter;
