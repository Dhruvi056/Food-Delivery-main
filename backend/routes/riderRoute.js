import express from "express";
import authMiddleware, { requireRole } from "../middleware/auth.js";
import {
  listAvailableOrders,
  getActiveOrder,
  claimOrder,
  advanceStatus,
} from "../controllers/riderController.js";

const riderRouter = express.Router();

// All rider routes require a valid JWT + rider role
riderRouter.use(authMiddleware);
riderRouter.use(requireRole("rider"));

riderRouter.get("/available", listAvailableOrders);
riderRouter.get("/active",    getActiveOrder);
riderRouter.post("/claim",    claimOrder);
riderRouter.post("/advance",  advanceStatus);

export default riderRouter;
