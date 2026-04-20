import mongoose from "mongoose";
import "dotenv/config";
import orderModel from "./models/orderModel.js";
import userModel from "./models/userModel.js";
import { connectDB } from "./config/db.js";

async function createTestOrder() {
    await connectDB();

    // Find a user or create one
    let user = await userModel.findOne({ email: "demo@gmail.com" });
    if (!user) {
        console.log("demo@gmail.com not found, using first user");
        user = await userModel.findOne({});
    }

    const newOrder = new orderModel({
        userId: user._id.toString(),
        items: [{ name: "Real-Time Tracking Burger", price: 15, quantity: 2 }],
        amount: 30,
        address: {
            firstName: "Test",
            lastName: "User",
            street: "123 Main St",
            city: "WebSocket City",
            state: "JS",
            zipcode: "10101",
            phone: "555-0199"
        },
        payment: true,
        status: "Food Processing",
        date: new Date()
    });

    await newOrder.save();
    console.log("Mock paid order created:", newOrder._id);

    // Also we can make sure this user is admin so they can log into the admin panel
    user.role = "admin";
    await user.save();

    process.exit();
}

createTestOrder();
