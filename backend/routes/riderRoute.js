import express from "express";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";
import {
  getAvailableOrders,
  claimOrder,
  advanceOrder,
  updateLocation,
  getActiveOrder,
} from "../services/riderService.js";

const riderRouter = express.Router();

// All routes require rider authentication
riderRouter.use(authenticate, requireRole("rider"));

riderRouter.get("/available", async (req, res, next) => {
  try {
    const result = await getAvailableOrders();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

riderRouter.post("/claim", async (req, res, next) => {
  try {
    const result = await claimOrder(req.body.orderId, req.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

riderRouter.post("/advance", async (req, res, next) => {
  try {
    const result = await advanceOrder(req.body.orderId, req.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

riderRouter.post("/location", async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const result = await updateLocation(req.userId, latitude, longitude);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

riderRouter.get("/active", async (req, res, next) => {
  try {
    const result = await getActiveOrder(req.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default riderRouter;
