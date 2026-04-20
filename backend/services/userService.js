import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";
import {
  generateOTP,
  send2FAEmail,
  sendPasswordResetEmail,
} from "../utils/emailService.js";

// ── Token Helpers ──────────────────────────────────────────────────────────────

export const createAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });

export const createRefreshToken = (id) => {
  const secret =
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh";
  return jwt.sign({ id }, secret, { expiresIn: "7d" });
};

// ── Service Functions ──────────────────────────────────────────────────────────

/**
 * Step 1 of login — validates credentials and dispatches the 2FA OTP email.
 * Returns { requires2FA: true } on success.
 */
export const initiateLogin = async (email, password) => {
  const user = await userModel.findOne({ email });
  if (!user) throw new Error("USER_NOT_FOUND");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("INVALID_CREDENTIALS");

  const code = generateOTP();
  user.twoFactorCode = await bcrypt.hash(code, 10);
  user.twoFactorExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await send2FAEmail(email, code);
  return { requires2FA: true };
};

/**
 * Step 2 of login — validates the OTP and issues access + refresh tokens.
 */
export const completeTwoFA = async (email, code) => {
  const user = await userModel.findOne({ email });
  if (!user) throw new Error("USER_NOT_FOUND");

  if (!user.twoFactorCode || !user.twoFactorExpiry) {
    throw new Error("NO_PENDING_CODE");
  }

  if (new Date() > user.twoFactorExpiry) {
    user.twoFactorCode = null;
    user.twoFactorExpiry = null;
    await user.save();
    throw new Error("CODE_EXPIRED");
  }

  const isValid = await bcrypt.compare(code, user.twoFactorCode);
  if (!isValid) throw new Error("INVALID_CODE");

  user.twoFactorCode = null;
  user.twoFactorExpiry = null;

  const accessToken = createAccessToken(user._id);
  const refreshToken = createRefreshToken(user._id);
  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  await user.save();

  return { token: accessToken, refreshToken, role: user.role, name: user.name };
};

/**
 * Register a new user. Issues tokens directly (no 2FA on first signup).
 */
export const registerNewUser = async ({ name, email, password }) => {
  const exists = await userModel.findOne({ email });
  if (exists) throw new Error("USER_EXISTS");
  if (!validator.isEmail(email)) throw new Error("INVALID_EMAIL");
  if (password.length < 8) throw new Error("PASSWORD_TOO_SHORT");

  const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new userModel({ name, email, password: hashedPassword });
  const user = await newUser.save();

  const accessToken = createAccessToken(user._id);
  const refreshToken = createRefreshToken(user._id);
  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  await user.save();

  return { token: accessToken, refreshToken, role: user.role, name: user.name };
};

/**
 * Rotate access + refresh tokens using a valid refresh token.
 */
export const rotateTokens = async (refreshToken) => {
  if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");

  const secret =
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh";
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, secret);
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const user = await userModel.findById(decoded.id);
  if (!user || !user.refreshToken) throw new Error("INVALID_REFRESH_TOKEN");

  const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isValid) {
    user.refreshToken = null;
    await user.save();
    throw new Error("TOKEN_REUSE_DETECTED");
  }

  const newAccessToken = createAccessToken(user._id);
  const newRefreshToken = createRefreshToken(user._id);
  user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
  await user.save();

  return { token: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout — clears the refresh token from the database.
 */
export const logoutUserById = async (userId) => {
  await userModel.findByIdAndUpdate(userId, { refreshToken: null });
};

/**
 * Initiate a password reset — generates a reset token and emails the link.
 */
export const initiateForgotPassword = async (email) => {
  const user = await userModel.findOne({ email });
  if (!user) throw new Error("USER_NOT_FOUND");

  const resetToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  await user.save();

  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);
};

/**
 * Complete a password reset — validates the token and sets the new password.
 */
export const completePasswordReset = async (token, newPassword) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await userModel.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) throw new Error("INVALID_OR_EXPIRED_TOKEN");

  const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
};

/**
 * Add an address to a user's saved addresses.
 */
export const addUserAddress = async (userId, address) => {
  if (!address.id) {
    address.id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  const user = await userModel.findByIdAndUpdate(
    userId,
    { $push: { addresses: address } },
    { new: true }
  );
  return address;
};

/**
 * Remove a saved address by its ID.
 */
export const removeUserAddress = async (userId, addressId) => {
  await userModel.findByIdAndUpdate(userId, {
    $pull: { addresses: { id: addressId } },
  });
};

/**
 * Fetch all saved addresses for a user.
 */
export const getUserAddresses = async (userId) => {
  const user = await userModel.findById(userId);
  return user.addresses || [];
};
