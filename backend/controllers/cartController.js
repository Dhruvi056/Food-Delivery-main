import {
  addItemToCart,
  removeItemFromCart,
  getUserCart,
  replaceUserCart,
} from "../services/cartService.js";

const ERROR_MESSAGES = {
  ITEM_NOT_FOUND: "Item not found",
  ITEM_SOLD_OUT: "Item is currently sold out",
};

const handleServiceError = (res, error) => {
  const msg = ERROR_MESSAGES[error.message] || "An unexpected error occurred";
  res.json({ success: false, message: msg });
};

const addToCart = async (req, res) => {
  try {
    await addItemToCart(req.body.userId, req.body.itemId);
    res.json({ success: true, message: "Added to Cart" });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const removeFromCart = async (req, res) => {
  try {
    await removeItemFromCart(req.body.userId, req.body.itemId);
    res.json({ success: true, message: "Removed from Cart" });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const getCart = async (req, res) => {
  try {
    const cartData = await getUserCart(req.body.userId);
    res.json({ success: true, cartData });
  } catch (error) {
    res.json({ success: false, message: "Error fetching cart" });
  }
};

const setCart = async (req, res) => {
  try {
    await replaceUserCart(req.body.userId, req.body.cartItems);
    res.json({ success: true, message: "Cart Successfully Updated" });
  } catch (error) {
    res.json({ success: false, message: "Error updating cart" });
  }
};

export { addToCart, removeFromCart, getCart, setCart };
