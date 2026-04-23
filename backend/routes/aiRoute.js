import express from "express";
import authMiddleware, { requireRole } from "../middleware/auth.js";
import {
  chat,
  search,
  orderSummary,
  sentimentReport,
  recommend,
  support,
} from "../controllers/aiController.js";

const aiRouter = express.Router();

// Feature 1 — Food Chatbot (public, userId optional)
aiRouter.post("/chat", chat);

// Feature 2 — Smart AI Search (public)
aiRouter.post("/search", search);

// Feature 3 — Order Summary (JWT protected)
aiRouter.get("/order-summary/:orderId", authMiddleware, orderSummary);

// Feature 4 — Sentiment Report (admin only)
aiRouter.get("/sentiment-report", authMiddleware, requireRole("admin"), sentimentReport);

// Feature 5 — Meal Recommender (JWT protected)
aiRouter.get("/recommend/:userId", authMiddleware, recommend);

// Feature 6 — Customer Support Bot (public, userId optional for context)
aiRouter.post("/support", support);

export default aiRouter;
