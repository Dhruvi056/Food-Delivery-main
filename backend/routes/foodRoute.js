import express from "express";
import { addFood, listFood, adminListFood, removeFood, recoverFood, updateAvailability, updateFood } from "../controllers/foodController.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";

const foodRouter = express.Router();

// Image Storage Engine (Memory to allow sharp processing)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

foodRouter.post("/add", upload.single("image"), authMiddleware, addFood);
foodRouter.get("/list", listFood);
foodRouter.get("/admin-list", authMiddleware, adminListFood);
foodRouter.post("/remove", authMiddleware, removeFood);
foodRouter.post("/recover", authMiddleware, recoverFood);
foodRouter.post("/update-availability", authMiddleware, updateAvailability);
foodRouter.post("/update", upload.single("image"), authMiddleware, updateFood);

export default foodRouter;
