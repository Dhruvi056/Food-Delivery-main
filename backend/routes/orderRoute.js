import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
    listOrders,
    placeOrder,
    updateStatus,
    userOrders,
    verifyOrder,
    refundOrder,
    cancelOrder
} from "../controllers/orderController.js";
import { paymentLimiter } from "../middleware/rateLimiter.js";
import {
    validatePlaceOrder,
    validateVerifyOrder,
    validateUpdateStatus,
} from "../middleware/validate.js";

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, paymentLimiter, validatePlaceOrder, placeOrder);
orderRouter.post("/verify", paymentLimiter, validateVerifyOrder, verifyOrder);
orderRouter.post("/status", authMiddleware, validateUpdateStatus, updateStatus);
orderRouter.post("/refund", authMiddleware, refundOrder);
orderRouter.post("/cancel", authMiddleware, cancelOrder);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.get("/list", authMiddleware, listOrders);

export default orderRouter;