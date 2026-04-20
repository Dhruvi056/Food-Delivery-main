import foodModel from "../models/foodModel.js";
import userModel from "../models/userModel.js";
import fs from "fs";
import sharp from "sharp";
import redisClient from "../utils/redisClient.js";

// ── Helpers ────────────────────────────────────────────────────────────────────
const invalidateFoodCache = async () => {
  try {
    if (redisClient.isOpen) await redisClient.del("all_foods");
  } catch (_) { /* Redis optional — ignore */ }
};

const assertAdmin = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user || user.role !== "admin") throw new Error("UNAUTHORIZED");
  return user;
};

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Add a new food item (admin only).
 * @param {string} userId - ID from auth middleware
 * @param {object} body   - req.body fields (name, description, price, category, calorie)
 * @param {object} file   - multer file buffer (req.file)
 */
export const addFoodItem = async (userId, body, file) => {
  await assertAdmin(userId);

  const baseName = file.originalname.split(".")[0] || "image";
  const image_filename = `${Date.now()}-${baseName}.webp`;

  await sharp(file.buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`uploads/${image_filename}`);

  const food = new foodModel({
    name: body.name,
    description: body.description,
    price: body.price,
    category: body.category,
    image: image_filename,
    calorie: body.calorie,
  });

  await food.save();
  await invalidateFoodCache();
  return food;
};

/**
 * Update an existing food item (admin only).
 * Handles partial updates and old image deletion.
 */
export const updateFoodItem = async (userId, body, file) => {
  await assertAdmin(userId);
  const food = await foodModel.findById(body.id);
  if (!food) throw new Error("Food item not found");

  const updateData = {
    name: body.name,
    description: body.description,
    price: body.price,
    category: body.category,
    calorie: body.calorie,
  };

  if (file) {
    const baseName = file.originalname.split(".")[0] || "image";
    const image_filename = `${Date.now()}-${baseName}.webp`;

    await sharp(file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(`uploads/${image_filename}`);

    updateData.image = image_filename;

    // Remove old image to save space
    if (food.image) {
      fs.unlink(`uploads/${food.image}`, () => {
        // Ignore file missing errors dynamically
      });
    }
  }

  const updatedFood = await foodModel.findByIdAndUpdate(body.id, updateData, { new: true });
  await invalidateFoodCache();
  return updatedFood;
};

/**
 * List all non-deleted food items (public). Serves from Redis when available.
 */
export const listFoodItems = async () => {
  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get("all_foods");
      if (cached) {
        console.log("🚀 Serving foods from Redis Cache!");
        return JSON.parse(cached);
      }
    }
  } catch (_) { /* ignore */ }

  const foods = await foodModel.find({ isDeleted: { $ne: true } });

  try {
    if (redisClient.isOpen) {
      await redisClient.setEx("all_foods", 3600, JSON.stringify(foods));
      console.log("💾 Fetched from MongoDB and Cached to Redis.");
    }
  } catch (_) {
    console.log("💾 Fetched from MongoDB (Redis disabled).");
  }

  return foods;
};

/**
 * Soft-delete a food item (admin only).
 */
export const softDeleteFood = async (userId, foodId) => {
  await assertAdmin(userId);
  const food = await foodModel.findByIdAndUpdate(foodId, { isDeleted: true }, { new: true });
  await invalidateFoodCache();
  return food;
};

/**
 * Recover a soft-deleted food item (admin only).
 */
export const recoverFoodItem = async (userId, foodId) => {
  await assertAdmin(userId);
  const food = await foodModel.findByIdAndUpdate(foodId, { isDeleted: false }, { new: true });
  await invalidateFoodCache();
  return food;
};

/**
 * Update a food item's availability and/or stock count (admin only).
 */
export const updateFoodAvailability = async (userId, { id, isAvailable, stockCount }) => {
  await assertAdmin(userId);
  const updateData = {};
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
  if (stockCount !== undefined) updateData.stockCount = stockCount;

  const food = await foodModel.findByIdAndUpdate(id, updateData, { new: true });
  await invalidateFoodCache();
  return food;
};

/**
 * List ALL food items including soft-deleted (admin only).
 */
export const adminListAllFood = async (userId) => {
  await assertAdmin(userId);
  return foodModel.find({});
};
