import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/food-delivery-main';
  await mongoose
    .connect(mongoUrl)
    .then(() =>console.log("DB Connected"))
    .catch((err) => console.log("DB Connection Error: ", err));
};
