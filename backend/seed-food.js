import mongoose from "mongoose";
import "dotenv/config";
import foodModel from "./models/foodModel.js";

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/food-delivery-main';

const seedFood = async () => {
    try {
        await mongoose.connect(mongoUrl);
        console.log("DB Connected");

        const count = await foodModel.countDocuments();
        if (count > 0) {
            console.log("Database already has food items. Skipping seed.");
            return;
        }

        const foods = [
            {
                name: "Greek Salad",
                description: "Food provides essential nutrients for overall health and well-being",
                price: 12,
                image: "food_1.png",
                category: "Salad",
                calorie: 120
            },
            {
                name: "Veg Vegan Salad",
                description: "Food provides essential nutrients for overall health and well-being",
                price: 18,
                image: "food_2.png",
                category: "Salad",
                calorie: 150
            },
            {
                name: "Clover Salad",
                description: "Food provides essential nutrients for overall health and well-being",
                price: 16,
                image: "food_3.png",
                category: "Salad",
                calorie: 140
            },
            {
                name: "Chicken Salad",
                description: "Food provides essential nutrients for overall health and well-being",
                price: 24,
                image: "food_4.png",
                category: "Salad",
                calorie: 220
            },
            {
                name: "Lasagna Rolls",
                description: "Food provides essential nutrients for overall health and well-being",
                price: 14,
                image: "food_5.png",
                category: "Rolls",
                calorie: 200
            },
            {
                name: "Garlic Mushroom",
                description: "Food provides essential nutrients for overall health and well-being",
                price: 14,
                image: "food_6.png",
                category: "Rolls",
                calorie: 180
            }
        ];

        await foodModel.insertMany(foods);
        console.log("Successfully seeded food items!");
    } catch (error) {
        console.log("Error seeding:", error);
    } finally {
        mongoose.connection.close();
    }
};

seedFood();
