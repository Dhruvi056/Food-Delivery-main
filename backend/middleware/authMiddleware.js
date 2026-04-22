import authMiddleware, { requireRole } from "./auth.js";

export const authenticate = authMiddleware;
export { requireRole };
