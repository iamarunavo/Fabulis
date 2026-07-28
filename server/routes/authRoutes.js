import express from "express";
import rateLimit from "express-rate-limit";
import { register, login, getProfile, updateProfile } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Caps failed-password guessing against a known email, keyed by IP, resets after 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;