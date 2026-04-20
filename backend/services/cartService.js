import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Add a single item to the user's cart.
 * Validates that the item exists, is available, and has stock.
 */
export const addItemToCart = async (userId, itemId) => {
  const food = await foodModel.findById(itemId);
  if (!food) throw new Error("ITEM_NOT_FOUND");
  if (food.isAvailable === false || food.stockCount <= 0) throw new Error("ITEM_SOLD_OUT");

  const userData = await userModel.findById(userId);
  const cartData = { ...userData.cartData };

  cartData[itemId] = (cartData[itemId] || 0) + 1;
  await userModel.findByIdAndUpdate(userId, { cartData });
  return cartData;
};

/**
 * Remove one unit of an item from the cart.
 * Deletes the key entirely when quantity reaches zero.
 */
export const removeItemFromCart = async (userId, itemId) => {
  const userData = await userModel.findById(userId);
  const cartData = { ...userData.cartData };

  if (cartData[itemId] > 1) {
    cartData[itemId] -= 1;
  } else {
    delete cartData[itemId];
  }

  await userModel.findByIdAndUpdate(userId, { cartData });
  return cartData;
};

/**
 * Fetch the current cart for a user.
 */
export const getUserCart = async (userId) => {
  const userData = await userModel.findById(userId);
  return userData.cartData;
};

/**
 * Bulk-replace cart (used for re-order from history).
 */
export const replaceUserCart = async (userId, cartItems) => {
  await userModel.findByIdAndUpdate(userId, { cartData: cartItems });
  return cartItems;
};
