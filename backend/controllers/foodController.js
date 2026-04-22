import {
  addFoodItem,
  listFoodItems,
  softDeleteFood,
  recoverFoodItem,
  updateFoodAvailability,
  adminListAllFood,
  updateFoodItem,
} from "../services/foodService.js";
import { getIO } from "../utils/socket.js";

// ── Error message map (service error code → user-facing message) ───────────────
const ERROR_MESSAGES = {
  UNAUTHORIZED: "You are not authorised to perform this action",
};

const handleServiceError = (res, error) => {
  console.error("[foodController] Service error:", error.message);
  const msg = ERROR_MESSAGES[error.message] || error.message || "An unexpected error occurred";
  res.json({ success: false, message: msg });
};

// ── Thin Controllers ───────────────────────────────────────────────────────────

const addFood = async (req, res) => {
  try {
    const food = await addFoodItem(req.body.userId, req.body, req.file);
    try {
      const io = getIO();
      io.to("admin_room").emit("new_food_added", {
        foodId: food._id,
        name: food.name,
        category: food.category,
      });
      io.emit("new_food_added", {
        foodId: food._id,
        name: food.name,
        category: food.category,
      });
    } catch (socketError) {
      console.warn("[foodController] socket emit failed:", socketError.message);
    }
    res.json({ success: true, message: "Food Added", data: food });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const listFood = async (req, res) => {
  try {
    const foods = await listFoodItems();
    res.json({ success: true, data: foods });
  } catch (error) {
    console.error("listFood error:", error);
    res.json({ success: false, message: "Error fetching food list" });
  }
};

const removeFood = async (req, res) => {
  try {
    await softDeleteFood(req.body.userId, req.body.id);
    res.json({ success: true, message: "Food Removed" });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const recoverFood = async (req, res) => {
  try {
    const food = await recoverFoodItem(req.body.userId, req.body.id);
    res.json({ success: true, message: "Food Recovered", data: food });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const updateAvailability = async (req, res) => {
  try {
    const food = await updateFoodAvailability(req.body.userId, req.body);
    res.json({ success: true, message: "Availability Updated", data: food });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const adminListFood = async (req, res) => {
  try {
    const foods = await adminListAllFood(req.userId || req.body.userId);
    res.json({ success: true, data: foods });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const updateFood = async (req, res) => {
  try {
    const food = await updateFoodItem(req.body.userId, req.body, req.file);
    res.json({ success: true, message: "Food Updated Successfully", data: food });
  } catch (error) {
    handleServiceError(res, error);
  }
};

export { addFood, listFood, adminListFood, removeFood, recoverFood, updateAvailability, updateFood };
