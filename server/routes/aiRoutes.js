import express from "express";
import { getRecommendationHistory, recommend } from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, recommend);
router.get("/history", protect, getRecommendationHistory);

export default router;