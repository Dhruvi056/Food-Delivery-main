import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import foodModel from "./models/foodModel.js";
import dotenv from "dotenv";

dotenv.config();

const seed = async () => {
  await connectDB();
  
  const foods = [
    {
      name: "Tofu Curry Bowl",
      description: "A rich and flavorful Pure Veg Indian curry meal with seasoned tofu, fresh herbs, and fragrant basmati rice.",
      price: 250,
      image: "food_35.png",
      category: "Pure Veg",
      calorie: 450,
      isAvailable: true
    },
    {
      name: "Creamy Tomato Penne",
      description: "An elegant creamy tomato pasta platter tossed with fresh basil, parmesan cheese, and olive oil.",
      price: 320,
      image: "food_36.png",
      category: "Pasta",
      calorie: 580,
      isAvailable: true
    },
    {
      name: "Spicy Volcano Ramen",
      description: "A hot bowl of spicy ramen noodles garnished with spring onions, secret chili oil, and perfect seasoning.",
      price: 280,
      image: "food_37.png",
      category: "Noodles",
      calorie: 520,
      isAvailable: true
    }
  ];

  for (const f of foods) {
    const existing = await foodModel.findOne({ name: f.name });
    if (!existing) {
      await foodModel.create(f);
      console.log("Added", f.name);
    } else {
      console.log(f.name, "already exists");
    }
  }

  process.exit();
};

seed();
