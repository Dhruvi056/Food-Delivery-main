import "dotenv/config";

import express from "express";
import cors from "cors";
import http from "http";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import couponRouter from "./routes/couponRoute.js";
import riderRouter from "./routes/riderRoute.js";
import notificationRouter from "./routes/notificationRoute.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { initSocket } from "./utils/socket.js";
import { stripeWebhook } from "./controllers/orderController.js";
import { logger } from "./utils/logger.js";
// app config
const app = express();
// In test mode use port 0 (OS picks a free ephemeral port) to prevent
// EADDRINUSE when multiple Jest workers start the server in parallel.
const port = process.env.NODE_ENV === "test" ? 0 : (process.env.PORT || 4000);

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = initSocket(server);

// Store io instance so controllers can access it
app.set("io", io);

// MUST BE BEFORE express.json() to get the raw body for Stripe signature verification
app.post("/api/payment/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// middlewares
app.use(express.json());
app.use(cors());

// Global rate limiter
app.use("/api", generalLimiter);

// api endpoints
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/rider", riderRouter);  // auth + requireRole('rider') applied inside riderRoute.js
app.use("/api/notifications", notificationRouter);

import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./config/swagger.js";

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.send("BiteBlitz API — powered by InsForge ✅");
});

server.listen(port, () => {
  logger.info(`🚀 BiteBlitz server started on port: ${port}`);
  logger.info(`📦 Database: InsForge PostgreSQL`);
  logger.info(`📚 API Docs: http://localhost:${port}/api-docs`);
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export { app, server };
