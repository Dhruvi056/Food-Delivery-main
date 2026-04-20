import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }, // 'user' | 'admin' | 'rider'
    // Rider-specific — ignored for non-rider roles
    riderStatus: { type: Boolean, default: true }, // true = available, false = busy
    cartData: { type: Object, default: {} },
    // 2FA fields
    twoFactorCode: { type: String, default: null },
    twoFactorExpiry: { type: Date, default: null },
    // Refresh token
    refreshToken: { type: String, default: null },
    // Password Reset fields
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpire: { type: Date, default: null },
    // Address Book
    addresses: { type: Array, default: [] },
  },
  { minimize: false }
);

const userModel = mongoose.model.user || mongoose.model("user", userSchema);
export default userModel;
