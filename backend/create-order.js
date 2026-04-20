import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "dotenv/config";
import userModel from "./models/userModel.js";
import orderModel from "./models/orderModel.js";

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/food-delivery-main';

const createOrder = async () => {
    try {
        await mongoose.connect(mongoUrl);
        console.log("DB Connected");

        // 1. Create a user
        const email = "demo@gmail.com";
        const password = "demopassword123";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let user = await userModel.findOne({ email });
        if (!user) {
            user = new userModel({
                name: "Demo User",
                email: email,
                password: hashedPassword,
                role: "user",
            });
            await user.save();
            console.log(`User ${email} created with password: ${password}`);
        } else {
            console.log(`User ${email} already exists`);
        }

        // 2. Place an order for the user
        const newOrder = new orderModel({
            userId: user._id,
            items: [
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: "Cheese Pizza",
                    price: 15,
                    quantity: 2,
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: "Garlic Bread",
                    price: 5,
                    quantity: 1,
                }
            ],
            amount: 35, // (15 * 2) + 5
            address: {
                firstName: "Demo",
                lastName: "User",
                email: "demo@gmail.com",
                street: "123 Main St",
                city: "New York",
                state: "NY",
                zipcode: "10001",
                country: "USA",
                phone: "1234567890",
            },
            status: "Food Processing",
            payment: true, // Mark as paid for demo purposes
            date: Date.now(),
        });

        await newOrder.save();
        console.log(`Order placed successfully! Order ID: ${newOrder._id}`);

    } catch (error) {
        console.log("Error:", error);
    } finally {
        mongoose.connection.close();
    }
};

createOrder();
