import {
  getPopularMovies,
  searchMovies,
  getPopularTVShows,
  getMovieDetails,
  getTVShowDetails,
} from "../services/tmdbService.js";
import { getPopularAnime, searchAnime, getAnimeDetails } from "../services/anilistService.js";

// GET /api/tv/popular
export const getPopularTV = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const shows = await getPopularTVShows(page);
    res.status(200).json({ shows });
  } catch (err) {
    console.error("TMDB popular TV error:", err.message);
    res.status(502).json({ message: "Failed to fetch TV shows from TMDB" });
  }
};

// GET /api/movies/popular
export const getPopular = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const movies = await getPopularMovies(page);
    res.status(200).json({ movies });
  } catch (err) {
    console.error("TMDB popular movies error:", err.message);
    res.status(502).json({ message: "Failed to fetch movies from TMDB" });
  }
};

// GET /api/anime/popular
export const getPopularAnimeList = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const anime = await getPopularAnime(page);
    res.status(200).json({ anime });
  } catch (err) {
    console.error("Jikan popular anime error:", err.message);
    res.status(502).json({ message: "Failed to fetch anime from Jikan" });
  }
};

// GET /api/search?query=...&type=movie|anime (defaults to movie)&page=1
export const search = async (req, res) => {
  try {
    const { query, type, page } = req.query;
    if (!query) {
      return res.status(400).json({ message: "A search query is required" });
    }

    const pageNum = page || 1;
    const results =
      type === "anime" ? await searchAnime(query, pageNum) : await searchMovies(query, pageNum);

    res.status(200).json({ results });
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(502).json({ message: "Failed to search" });
  }
};

// GET /api/movies/:id - single movie detail page
export const getMovieDetail = async (req, res) => {
  try {
    const movie = await getMovieDetails(req.params.id);
    res.status(200).json({ movie });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ message: "Movie not found" });
    }
    console.error("TMDB movie detail error:", err.message);
    res.status(502).json({ message: "Failed to fetch movie details from TMDB" });
  }
};

// GET /api/tv/:id - single TV show detail page
export const getTVDetail = async (req, res) => {
  try {
    const show = await getTVShowDetails(req.params.id);
    res.status(200).json({ show });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ message: "TV show not found" });
    }
    console.error("TMDB TV detail error:", err.message);
    res.status(502).json({ message: "Failed to fetch TV show details from TMDB" });
  }
};

// GET /api/anime/:id - single anime detail page
export const getAnimeDetail = async (req, res) => {
  try {
    const anime = await getAnimeDetails(req.params.id);
    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }
    res.status(200).json({ anime });
  } catch (err) {
    // Jikan returns a 404 for an anime that doesn't exist, so we want to propagate that to the client instead of returning a generic 502. This way, the client can show a "not found" message instead of a generic error.
    if (err.response?.status === 404) {
      return res.status(404).json({ message: "Anime not found" });
    }
    console.error("AniList anime detail error:", err.message);
    res.status(502).json({ message: "Failed to fetch anime details from AniList" });
  }
};