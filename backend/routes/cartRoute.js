import express from "express";
import {
  addToCart,
  removeFromCart,
  getCart,
  setCart
} from "../controllers/cartController.js";
import authMiddleware from "../middleware/auth.js";
import { validateCartItem } from "../middleware/validate.js";

const cartRouter = express.Router();

cartRouter.post("/add", authMiddleware, validateCartItem, addToCart);
cartRouter.post("/remove", authMiddleware, validateCartItem, removeFromCart);
cartRouter.get("/get", authMiddleware, getCart);
cartRouter.post("/set", authMiddleware, setCart);

export default cartRouter;
