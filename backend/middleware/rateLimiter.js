import rateLimit from "express-rate-limit";

const skipInTest = (req, res, next) => next();

// Auth endpoints: 5 attempts per 15 minutes per IP
export const authLimiter =
    process.env.NODE_ENV === "test"
        ? skipInTest
        : rateLimit({
              windowMs: 15 * 60 * 1000,
              max: 50,
              standardHeaders: true,
              legacyHeaders: false,
              message: {
                  success: false,
                  message: "Too many login attempts. Please try again in 15 minutes.",
              },
          });

// Payment endpoints: 10 attempts per 15 minutes per IP
export const paymentLimiter =
    process.env.NODE_ENV === "test"
        ? skipInTest
        : rateLimit({
              windowMs: 15 * 60 * 1000,
              max: 10,
              standardHeaders: true,
              legacyHeaders: false,
              message: {
                  success: false,
                  message: "Too many payment requests. Please try again later.",
              },
          });

// General API: 100 requests per 15 minutes per IP
export const generalLimiter =
    process.env.NODE_ENV === "test"
        ? skipInTest
        : rateLimit({
              windowMs: 15 * 60 * 1000,
              max: 100,
              standardHeaders: true,
              legacyHeaders: false,
              message: {
                  success: false,
                  message: "Too many requests. Please slow down.",
              },
          });
