import mongoose from "mongoose";
import "dotenv/config";
import orderModel from "./models/orderModel.js";
import { connectDB } from "./config/db.js";
import { verifyOrder } from "./controllers/orderController.js";

// Mock req and res for verifyOrder
const mockVerify = async (orderId) => {
    const req = {
        body: { orderId, success: "true" },
        app: {
            get: (key) => null // Mock IO if needed, but we probably want to hit the real endpoint via fetch instead of internal controller
        }
    };
};

async function seedOrder() {
    await connectDB();

    const newOrder = new orderModel({
        userId: "test_user_id_123", // Replace this with a real user ID or just a dummy one
        items: [{ name: "Test Food", price: 10, quantity: 1 }],
        amount: 60,
        address: {
            firstName: "Test",
            lastName: "User",
            street: "123 Main St",
            city: "Testville",
            state: "TS",
            zipcode: "12345",
            phone: "1234567890"
        },
        orderedForSomeoneElse: false,
        payment: true,
        status: "Food Processing"
    });

    await newOrder.save();
    console.log("Mock order created with ID:", newOrder._id);

    process.exit();
}

seedOrder();
