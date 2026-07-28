import express from "express";
import {
  getPopular,
  getPopularAnimeList,
  getPopularTV,
  search,
  getMovieDetail,
  getTVDetail,
  getAnimeDetail,
} from "../controllers/mediaController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// router endpoints for media-related routes, including popular movies, anime, TV shows, and search functionality.
router.get("/movies/popular", getPopular);
router.get("/anime/popular", getPopularAnimeList);
router.get("/tv/popular", getPopularTV);
router.get("/search", protect, search);

router.get("/movies/:id", protect, getMovieDetail);
router.get("/tv/:id", protect, getTVDetail);
router.get("/anime/:id", protect, getAnimeDetail);

export default router;