import express from "express";
import authMiddleware, { requireRole } from "../middleware/auth.js";
import {
    listOrders,
    placeOrder,
    updateStatus,
    userOrders,
    verifyOrder,
    refundOrder,
    cancelOrder,
    getOrderDetails,
    reorderOrder,
    submitFeedback
} from "../controllers/orderController.js";
import { paymentLimiter } from "../middleware/rateLimiter.js";
import {
    validatePlaceOrder,
    validateVerifyOrder,
    validateUpdateStatus,
    validateOrderFeedback,
} from "../middleware/validate.js";

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, paymentLimiter, validatePlaceOrder, placeOrder);
orderRouter.post("/verify", paymentLimiter, validateVerifyOrder, verifyOrder);
orderRouter.post("/status", authMiddleware, requireRole('admin'), validateUpdateStatus, updateStatus);
orderRouter.post("/refund", authMiddleware, requireRole('admin'), refundOrder);
orderRouter.post("/cancel", authMiddleware, cancelOrder);
orderRouter.post("/reorder", authMiddleware, reorderOrder);
orderRouter.post("/feedback", authMiddleware, validateOrderFeedback, submitFeedback);
orderRouter.get("/userorders", authMiddleware, userOrders);
orderRouter.get("/list", authMiddleware, requireRole('admin'), listOrders);
orderRouter.get("/:orderId", authMiddleware, getOrderDetails);

export default orderRouter;