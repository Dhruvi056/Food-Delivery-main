import sharp from "sharp";
import { randomUUID } from "crypto";
import insforge from "../config/insforge.js";

// ── remapFood declared FIRST to avoid ReferenceError (const is not hoisted) ───
// Remap PostgreSQL snake_case → frontend-expected camelCase / _id aliases
const remapFood = (f) => ({
  ...f,
  _id:        f.id,
  stockCount: f.stock_count,
  isAvailable: f.is_available,
  isDeleted:  f.is_deleted,
});

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

/**
 * Convert a Node.js Buffer to a Web API Blob.
 * The InsForge storage SDK expects a File | Blob, not a raw Buffer.
 */
const toBlob = (buffer, mimeType = "image/webp") =>
  new Blob([buffer], { type: mimeType });

/**
 * Process an uploaded image with sharp → WebP Blob.
 * Returns { blob, imageKey }.
 */
const processImage = async (file) => {
  const imageKey = `${randomUUID()}.webp`;

  const webpBuffer = await sharp(file.buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  return { blob: toBlob(webpBuffer), imageKey };
};

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Add a new food item (admin only).
 * Uploads image to InsForge storage bucket, stores the returned URL in DB.
 */
export const addFoodItem = async (userId, body, file) => {
  await assertAdmin(userId);

  // Validate required fields
  const price   = Number(body.price);
  const calorie = Number(body.calorie);
  if (!body.name)              throw new Error("Name is required");
  if (!body.category)          throw new Error("Category is required");
  if (!price   || price   <= 0) throw new Error("A valid price greater than 0 is required");
  if (!calorie || calorie <= 0) throw new Error("A valid calorie value greater than 0 is required");
  if (!file)                   throw new Error("An image file is required");

  const { blob, imageKey } = await processImage(file);

  // SDK upload() expects (path, File|Blob) — returns { data: { url, key }, error }
  const { data: uploadData, error: uploadError } = await insforge.storage
    .from("food-images")
    .upload(imageKey, blob);

  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

  // Use the URL returned by the SDK directly — no need for a separate getPublicUrl()
  const imageUrl = uploadData?.url || imageKey;

  const { data: food, error } = await insforge.database
    .from("foods")
    .insert([{
      name:        body.name,
      description: body.description,
      price,
      category:    body.category,
      image:       imageUrl,
      image_key:   uploadData?.key || imageKey,  // store key for reliable delete
      calorie,
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return remapFood(food);  // remap on insert response too
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

  const price   = body.price   !== undefined ? Number(body.price)   : food.price;
  const calorie = body.calorie !== undefined ? Number(body.calorie) : food.calorie;

  if (price   <= 0) throw new Error("A valid price greater than 0 is required");
  if (calorie <= 0) throw new Error("A valid calorie value greater than 0 is required");

  const updateData = {
    name:        body.name        || food.name,
    description: body.description || food.description,
    price,
    category:    body.category    || food.category,
    calorie,
  };

  if (file) {
    const { blob, imageKey } = await processImage(file);

    const { data: uploadData, error: uploadError } = await insforge.storage
      .from("food-images")
      .upload(imageKey, blob);

    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

    updateData.image     = uploadData?.url || imageKey;
    updateData.image_key = uploadData?.key || imageKey;

    // Delete the old image using the stored key (reliable, not URL parsing)
    const oldKey = food.image_key || (food.image?.includes("food-images/")
      ? food.image.split("food-images/").pop()
      : null);

    if (oldKey) {
      await insforge.storage.from("food-images").remove(oldKey).catch(() => {});
    }
  }

  const { data: updatedFood, error } = await insforge.database
    .from("foods")
    .update(updateData)
    .eq("id", body.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return remapFood(updatedFood);
};

/**
 * List all non-deleted food items (public).
 */
export const listFoodItems = async () => {
  const { data: foods, error } = await insforge.database
    .from("foods")
    .select()
    .is("is_deleted", false);   // .is() handles PostgreSQL boolean null-safely

  if (error) throw new Error(error.message);
  return (foods || []).map(remapFood);
};

/**
 * Soft-delete a food item (admin only).
 */
export const softDeleteFood = async (userId, foodId) => {
  await assertAdmin(userId);

  // Verify the food exists before attempting soft delete
  const { data: existing } = await insforge.database
    .from("foods")
    .select("id")
    .eq("id", foodId)
    .maybeSingle();
  if (!existing) throw new Error("Food item not found");

  const { data, error } = await insforge.database
    .from("foods")
    .update({ is_deleted: true })
    .eq("id", foodId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Recover a soft-deleted food item (admin only).
 */
export const recoverFoodItem = async (userId, foodId) => {
  await assertAdmin(userId);

  const { data: existing } = await insforge.database
    .from("foods")
    .select("id")
    .eq("id", foodId)
    .maybeSingle();
  if (!existing) throw new Error("Food item not found");

  const { data, error } = await insforge.database
    .from("foods")
    .update({ is_deleted: false })
    .eq("id", foodId)
    .select()
    .single();
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
  if (stockCount  !== undefined) updateData.stock_count  = Number(stockCount);

  if (!Object.keys(updateData).length) throw new Error("No fields to update");

  const { data, error } = await insforge.database
    .from("foods")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
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
