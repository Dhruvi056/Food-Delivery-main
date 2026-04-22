import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getNotifications, markNotificationsRead } from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", authMiddleware, getNotifications);
notificationRouter.post("/read-all", authMiddleware, markNotificationsRead);

export default notificationRouter;
