import { body } from "express-validator";
import { handleValidationErrors } from "./validate.js";

export const validateAiChat = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 500 })
    .withMessage("Message must be under 500 characters"),
  handleValidationErrors,
];

