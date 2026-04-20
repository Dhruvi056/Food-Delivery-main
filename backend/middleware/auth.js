import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const authMiddleware = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: "Not Authorized. Please login again." });
  }
  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!req.body) req.body = {};
    req.body.userId = token_decode.id;
    req.userId = token_decode.id; // Safe injection
    next();
  } catch (error) {
    // Handle expired tokens distinctly so frontend knows to refresh
    if (error.name === "TokenExpiredError") {
      return res.json({
        success: false,
        expired: true,
        message: "Session expired. Please refresh your token.",
      });
    }
    console.log(error);
    res.json({ success: false, message: "Invalid token. Please login again." });
  }
};

/**
 * Role-based access control middleware factory.
 * Usage: requireRole('admin') | requireRole('rider') | requireRole('admin', 'rider')
 * Must be used AFTER authMiddleware (relies on req.userId being set).
 */
export const requireRole = (...roles) => async (req, res, next) => {
  try {
    const user = await userModel.findById(req.userId).select("role");
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden: insufficient permissions." });
    }
    req.userRole = user.role;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: "Role check failed." });
  }
};

export default authMiddleware;
