import express from "express";
import cors from "cors";
import http from "http";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import couponRouter from "./routes/couponRoute.js";
import riderRouter from "./routes/riderRoute.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { initSocket } from "./utils/socket.js";
import mongoSanitize from 'express-mongo-sanitize';
import { stripeWebhook } from "./controllers/orderController.js";

// app config
const app = express();
const port = process.env.PORT || 4000;

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

// Data Sanitization against NoSQL query injection
// This removes any keys containing prohibited characters like $ or .
app.use(mongoSanitize());

// DB connection
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

// api endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/rider", riderRouter);

import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger.js';

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.send("API Working");
});

// Use server.listen instead of app.listen for Socket.io
import { connectRedis } from "./utils/redisClient.js";

if (process.env.NODE_ENV !== 'test') {
  connectRedis().then(() => {
    server.listen(port, () => {
      console.log(`Server Started on port: ${port}`);
    });
  });
}

export { app, server };
