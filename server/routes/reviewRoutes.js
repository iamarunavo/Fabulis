import express from "express";
import {
  createReview,
  getReviewsForMedia,
  deleteReview,
} from "../controllers/reviewController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createReview);
router.get("/:mediaId", getReviewsForMedia); // public - no protect
router.delete("/:id", protect, deleteReview);

export default router;