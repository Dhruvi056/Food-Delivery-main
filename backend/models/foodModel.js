import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  calorie: { type: Number, required: true },
  stockCount: { type: Number, default: 100 },
  isAvailable: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
});

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);

export default foodModel;
