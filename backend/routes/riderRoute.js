import express from "express";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";
import {
  getAvailableOrders,
  claimOrder,
  advanceOrder,
  updateLocation,
  getActiveOrder,
  getRiderDeliveries,
  getRiderEarnings,
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
    if (err.message === "RIDER_ALREADY_BUSY") {
      return res.status(400).json({ success: false, message: "You already have an active delivery. Complete it before claiming another." });
    }
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

// GET /api/rider/deliveries — all orders assigned to this rider (history)
riderRouter.get("/deliveries", async (req, res, next) => {
  try {
    const result = await getRiderDeliveries(req.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/rider/earnings — earnings summary for this rider
riderRouter.get("/earnings", async (req, res, next) => {
  try {
    const result = await getRiderEarnings(req.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default riderRouter;
