import express from "express";
import {
    loginUser,
    registerUser,
    verify2FA,
    refreshTokenHandler,
    logoutUser,
    forgotPassword,
    resetPassword,
    addAddress,
    removeAddress,
    getAddresses
} from "../controllers/userController.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import {
    validateLogin,
    validateRegister,
    validate2FA,
    validateRefreshToken,
    validateForgotPassword,
    validateResetPassword
} from "../middleware/validate.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User authentication and management
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully created
 */
userRouter.post("/register", authLimiter, validateRegister, registerUser);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Authenticate a user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA OTP triggered or login successful
 */
userRouter.post("/login", authLimiter, validateLogin, loginUser);

/**
 * @swagger
 * /api/user/verify-2fa:
 *   post:
 *     summary: Verify 2FA OTP
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully verified, returns access and refresh tokens
 */
userRouter.post("/verify-2fa", authLimiter, validate2FA, verify2FA);

/**
 * @swagger
 * /api/user/refresh-token:
 *   post:
 *     summary: Refresh an expired access token
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully generated new access token
 */
userRouter.post("/refresh-token", validateRefreshToken, refreshTokenHandler);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
userRouter.post("/logout", authMiddleware, logoutUser);

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 */
userRouter.post("/forgot-password", authLimiter, validateForgotPassword, forgotPassword);

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Reset password with secure token
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
userRouter.post("/reset-password", authLimiter, validateResetPassword, resetPassword);

// Address Book Routes
userRouter.post("/address", authMiddleware, addAddress);
userRouter.delete("/address/:addressId", authMiddleware, removeAddress);
userRouter.get("/addresses", authMiddleware, getAddresses);

export default userRouter;
