import express from "express";
import {
  addToWatchlist,
  getWatchlist,
  updateWatchlistItem,
  deleteWatchlistItem,
} from "../controllers/watchlistController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Every route here requires a valid logged-in user
router.post("/", protect, addToWatchlist);
router.get("/", protect, getWatchlist);
router.put("/:id", protect, updateWatchlistItem);
router.delete("/:id", protect, deleteWatchlistItem);

export default router;