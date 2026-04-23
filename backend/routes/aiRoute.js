import express from "express";
import { validateAiChat } from "../middleware/validateAi.js";
import { chat } from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post("/chat", validateAiChat, chat);

export default aiRouter;

