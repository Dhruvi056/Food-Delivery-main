import { body, validationResult } from "express-validator";
import xss from "xss";

// Middleware to check validation results
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

// Sanitize a string against XSS
const sanitize = (value) => {
    if (typeof value === "string") {
        return xss(value.trim());
    }
    return value;
};

// --- User Validation ---

export const validateRegister = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ max: 50 })
        .withMessage("Name must be under 50 characters")
        .customSanitizer(sanitize),
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email")
        .normalizeEmail(),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .isLength({ max: 128 })
        .withMessage("Password must be under 128 characters"),
    handleValidationErrors,
];

export const validateLogin = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email")
        .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
];

export const validate2FA = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email")
        .normalizeEmail(),
    body("code")
        .trim()
        .notEmpty()
        .withMessage("2FA code is required")
        .isLength({ min: 6, max: 6 })
        .withMessage("Code must be exactly 6 digits")
        .isNumeric()
        .withMessage("Code must contain only numbers"),
    handleValidationErrors,
];

export const validateRefreshToken = [
    body("refreshToken")
        .trim()
        .notEmpty()
        .withMessage("Refresh token is required"),
    handleValidationErrors,
];

export const validateForgotPassword = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email")
        .normalizeEmail(),
    handleValidationErrors,
];

export const validateResetPassword = [
    body("token")
        .trim()
        .notEmpty()
        .withMessage("Reset token is required"),
    body("password")
        .notEmpty()
        .withMessage("New password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .isLength({ max: 128 })
        .withMessage("Password must be under 128 characters"),
    handleValidationErrors,
];

// --- Coupon Validation ---

export const validateCouponCheck = [
    body("code")
        .trim()
        .notEmpty()
        .withMessage("Coupon code is required")
        .customSanitizer(sanitize),
    handleValidationErrors,
];

// --- Order Validation ---

export const validatePlaceOrder = [
    body("items")
        .isArray({ min: 1 })
        .withMessage("Order must contain at least one item"),
    body("items.*.name")
        .trim()
        .notEmpty()
        .withMessage("Item name is required")
        .customSanitizer(sanitize),
    body("items.*.price")
        .isNumeric()
        .withMessage("Item price must be a number"),
    body("items.*.quantity")
        .isInt({ min: 1 })
        .withMessage("Item quantity must be at least 1"),
    body("amount")
        .isNumeric()
        .withMessage("Order amount must be a number"),
    body("address.firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required")
        .customSanitizer(sanitize),
    body("address.lastName")
        .trim()
        .notEmpty()
        .withMessage("Last name is required")
        .customSanitizer(sanitize),
    body("address.street")
        .trim()
        .notEmpty()
        .withMessage("Street is required")
        .customSanitizer(sanitize),
    body("address.city")
        .trim()
        .notEmpty()
        .withMessage("City is required")
        .customSanitizer(sanitize),
    body("address.state")
        .trim()
        .notEmpty()
        .withMessage("State is required")
        .customSanitizer(sanitize),
    body("address.zipcode")
        .trim()
        .notEmpty()
        .withMessage("Zipcode is required")
        .customSanitizer(sanitize),
    body("address.phone")
        .trim()
        .notEmpty()
        .withMessage("Phone number is required")
        .customSanitizer(sanitize),
    handleValidationErrors,
];

export const validateVerifyOrder = [
    body("orderId")
        .trim()
        .notEmpty()
        .withMessage("Order ID is required"),
    body("success")
        .notEmpty()
        .withMessage("Payment success status is required"),
    handleValidationErrors,
];

export const validateUpdateStatus = [
    body("orderId")
        .trim()
        .notEmpty()
        .withMessage("Order ID is required"),
    body("status")
        .trim()
        .notEmpty()
        .withMessage("Status is required")
        .customSanitizer(sanitize),
    handleValidationErrors,
];

// --- Cart Validation ---

export const validateCartItem = [
    body("itemId")
        .trim()
        .notEmpty()
        .withMessage("Item ID is required"),
    handleValidationErrors,
];
