import express from "express";
import { addFood, listFood, adminListFood, removeFood, recoverFood, updateAvailability, updateFood } from "../controllers/foodController.js";
import multer from "multer";
import authMiddleware, { requireRole } from "../middleware/auth.js";

const foodRouter = express.Router();

// Image Storage Engine (Memory to allow sharp processing)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

foodRouter.post("/add", upload.single("image"), authMiddleware, requireRole('admin'), addFood);
foodRouter.get("/list", listFood);
foodRouter.get("/admin-list", authMiddleware, requireRole('admin'), adminListFood);
foodRouter.post("/remove", authMiddleware, requireRole('admin'), removeFood);
foodRouter.post("/recover", authMiddleware, requireRole('admin'), recoverFood);
foodRouter.post("/update-availability", authMiddleware, requireRole('admin'), updateAvailability);
foodRouter.post("/update", upload.single("image"), authMiddleware, requireRole('admin'), updateFood);

export default foodRouter;
