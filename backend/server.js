import express from "express";
import cors from "cors";
import http from "http";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import couponRouter from "./routes/couponRoute.js";
import riderRouter from "./routes/riderRoute.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { initSocket } from "./utils/socket.js";
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

// api endpoints
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/rider", riderRouter);

import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./config/swagger.js";

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.send("BiteBlitz API — powered by InsForge ✅");
});

server.listen(port, () => {
  console.log(`🚀 BiteBlitz server started on port: ${port}`);
  console.log(`📦 Database: InsForge PostgreSQL`);
  console.log(`📚 API Docs: http://localhost:${port}/api-docs`);
});

export { app, server };
