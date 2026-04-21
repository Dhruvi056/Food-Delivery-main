import sharp from "sharp";
import insforge from "../config/insforge.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

const assertAdmin = async (userId) => {
  const { data: user } = await insforge.database
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!user || user.role !== "admin") throw new Error("UNAUTHORIZED");
  return user;
};

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Add a new food item (admin only).
 * Uploads image to InsForge storage bucket, stores public URL in DB.
 */
export const addFoodItem = async (userId, body, file) => {
  await assertAdmin(userId);

  const baseName = file.originalname.split(".")[0] || "image";
  const imageKey = `${Date.now()}-${baseName}.webp`;

  // Convert to WebP buffer using sharp
  const webpBuffer = await sharp(file.buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  // Upload to InsForge storage bucket
  const { data: uploadData, error: uploadError } = await insforge.storage
    .from("food-images")
    .upload(imageKey, webpBuffer, { contentType: "image/webp" });

  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

  // Get the public URL
  const { data: urlData } = insforge.storage
    .from("food-images")
    .getPublicUrl(imageKey);

  const imageUrl = urlData?.publicUrl || imageKey;

  const { data: food, error } = await insforge.database
    .from("foods")
    .insert([{
      name: body.name,
      description: body.description,
      price: Number(body.price),
      category: body.category,
      image: imageUrl,
      calorie: Number(body.calorie),
    }])
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  return food;
};

/**
 * Update an existing food item (admin only).
 */
export const updateFoodItem = async (userId, body, file) => {
  await assertAdmin(userId);

  const { data: food } = await insforge.database
    .from("foods")
    .select()
    .eq("id", body.id)
    .maybeSingle();
  if (!food) throw new Error("Food item not found");

  const updateData = {
    name: body.name,
    description: body.description,
    price: Number(body.price),
    category: body.category,
    calorie: Number(body.calorie),
  };

  if (file) {
    const baseName = file.originalname.split(".")[0] || "image";
    const imageKey = `${Date.now()}-${baseName}.webp`;

    const webpBuffer = await sharp(file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const { error: uploadError } = await insforge.storage
      .from("food-images")
      .upload(imageKey, webpBuffer, { contentType: "image/webp" });

    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

    const { data: urlData } = insforge.storage
      .from("food-images")
      .getPublicUrl(imageKey);

    updateData.image = urlData?.publicUrl || imageKey;

    // Delete old image from bucket if it's a storage URL
    if (food.image && food.image.includes("food-images")) {
      const oldKey = food.image.split("food-images/").pop();
      if (oldKey) {
        await insforge.storage.from("food-images").remove([oldKey]).catch(() => {});
      }
    }
  }

  const { data: updatedFood, error } = await insforge.database
    .from("foods")
    .update(updateData)
    .eq("id", body.id)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  return updatedFood;
};

/**
 * List all non-deleted food items (public).
 */
export const listFoodItems = async () => {
  const { data: foods, error } = await insforge.database
    .from("foods")
    .select()
    .eq("is_deleted", false);

  if (error) throw new Error(error.message);
  // Remap id → _id for frontend compatibility
  return (foods || []).map(remapFood);
};

/**
 * Soft-delete a food item (admin only).
 */
export const softDeleteFood = async (userId, foodId) => {
  await assertAdmin(userId);
  const { data, error } = await insforge.database
    .from("foods")
    .update({ is_deleted: true })
    .eq("id", foodId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Recover a soft-deleted food item (admin only).
 */
export const recoverFoodItem = async (userId, foodId) => {
  await assertAdmin(userId);
  const { data, error } = await insforge.database
    .from("foods")
    .update({ is_deleted: false })
    .eq("id", foodId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Update a food item's availability and/or stock count (admin only).
 */
export const updateFoodAvailability = async (userId, { id, isAvailable, stockCount }) => {
  await assertAdmin(userId);
  const updateData = {};
  if (isAvailable !== undefined) updateData.is_available = isAvailable;
  if (stockCount !== undefined) updateData.stock_count = Number(stockCount);

  const { data, error } = await insforge.database
    .from("foods")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * List ALL food items including soft-deleted (admin only).
 */
export const adminListAllFood = async (userId) => {
  await assertAdmin(userId);
  const { data: foods, error } = await insforge.database
    .from("foods")
    .select();
  if (error) throw new Error(error.message);
  return (foods || []).map(remapFood);
};

// Remap PostgreSQL snake_case → frontend-expected camelCase / _id format
const remapFood = (f) => ({
  ...f,
  _id: f.id,
  stockCount: f.stock_count,
  isAvailable: f.is_available,
  isDeleted: f.is_deleted,
});
