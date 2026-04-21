import insforge from "../config/insforge.js";

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Add a single item to the user's cart.
 * Validates that the item exists, is available, and has stock.
 */
export const addItemToCart = async (userId, itemId) => {
  const { data: food } = await insforge.database
    .from("foods")
    .select("id, is_available, stock_count")
    .eq("id", itemId)
    .maybeSingle();

  if (!food) throw new Error("ITEM_NOT_FOUND");
  if (food.is_available === false || food.stock_count <= 0) throw new Error("ITEM_SOLD_OUT");

  const { data: userData } = await insforge.database
    .from("users")
    .select("cart_data")
    .eq("id", userId)
    .maybeSingle();

  const cartData = { ...(userData?.cart_data || {}) };
  cartData[itemId] = (cartData[itemId] || 0) + 1;

  await insforge.database
    .from("users")
    .update({ cart_data: cartData })
    .eq("id", userId);

  return cartData;
};

/**
 * Remove one unit of an item from the cart.
 * Deletes the key entirely when quantity reaches zero.
 */
export const removeItemFromCart = async (userId, itemId) => {
  const { data: userData } = await insforge.database
    .from("users")
    .select("cart_data")
    .eq("id", userId)
    .maybeSingle();

  const cartData = { ...(userData?.cart_data || {}) };

  if (cartData[itemId] > 1) {
    cartData[itemId] -= 1;
  } else {
    delete cartData[itemId];
  }

  await insforge.database
    .from("users")
    .update({ cart_data: cartData })
    .eq("id", userId);

  return cartData;
};

/**
 * Fetch the current cart for a user.
 */
export const getUserCart = async (userId) => {
  const { data: userData } = await insforge.database
    .from("users")
    .select("cart_data")
    .eq("id", userId)
    .maybeSingle();

  return userData?.cart_data || {};
};

/**
 * Bulk-replace cart (used for re-order from history).
 */
export const replaceUserCart = async (userId, cartItems) => {
  await insforge.database
    .from("users")
    .update({ cart_data: cartItems })
    .eq("id", userId);

  return cartItems;
};
