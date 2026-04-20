import mongoose from "mongoose";
import "dotenv/config";
import foodModel from "./models/foodModel.js";
import { connectDB } from "./config/db.js";

const check = async () => {
    await connectDB();
    const all = await foodModel.find({});
    console.log(`Total items in DB: ${all.length}`);
    const salads = await foodModel.find({ category: "Salad" });
    console.log(`Salad items in DB: ${salads.length}`);
    console.log(salads);
    process.exit();
};
check();
