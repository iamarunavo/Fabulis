import axios from "axios";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";

// Helper function to make requests to the TMDB API
const tmdbRequest = async (endpoint, params = {}) => {
  const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
    params: {
      api_key: process.env.TMDB_API_KEY,
      ...params,
    },
  });
  return response.data;
};

// Reshapes TMDB's raw movie object into just what Fabulis needs on the frontend
const formatMovie = (movie) => ({
  id: movie.id,
  title: movie.title,
  genre: movie.genre_ids, 
  rating: movie.vote_average,
  releaseDate: movie.release_date,
  description: movie.overview,
  poster: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
});

// Reshapes TMDB's raw TV show object into just what Fabulis needs on the frontend
const formatTVShow = (show) => ({
  id: show.id,
  title: show.name,
  genre: show.genre_ids,
  rating: show.vote_average,
  releaseDate: show.first_air_date,
  description: show.overview,
  poster: show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : null,
});

// GET popular TV shows
export const getPopularTVShows = async (page = 1) => {
  const data = await tmdbRequest("/tv/popular", { page });
  return data.results.map(formatTVShow);
};

// GET search results for TV shows
export const getPopularMovies = async (page = 1) => {
  const data = await tmdbRequest("/movie/popular", { page });
  return data.results.map(formatMovie);
};

// GET search results, powers the Explore page's search bar
export const searchMovies = async (query, page = 1) => {
  const data = await tmdbRequest("/search/movie", { query, page });
  return data.results.map(formatMovie);
};

const formatCast = (credits) =>
  (credits?.cast || []).map((c) => ({
    name: c.name,
    role: c.character,
    photo: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : null,
  }));

const formatMovieDetails = (movie) => ({
  id: movie.id,
  title: movie.title,
  genres: movie.genres.map((g) => g.name),
  rating: movie.vote_average,
  releaseDate: movie.release_date,
  description: movie.overview,
  poster: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
  backdrop: movie.backdrop_path ? `${BACKDROP_BASE_URL}${movie.backdrop_path}` : null,
  runtime: movie.runtime,
  tagline: movie.tagline,
  cast: formatCast(movie.credits),
});

const formatTVShowDetails = (show) => ({
  id: show.id,
  title: show.name,
  genres: show.genres.map((g) => g.name),
  rating: show.vote_average,
  releaseDate: show.first_air_date,
  description: show.overview,
  poster: show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : null,
  backdrop: show.backdrop_path ? `${BACKDROP_BASE_URL}${show.backdrop_path}` : null,
  runtime: show.episode_run_time?.[0] ?? null,
  episodes: show.number_of_episodes,
  seasons: show.number_of_seasons,
  tagline: show.tagline,
  cast: formatCast(show.credits),
});

// GET a single movie's full details. append_to_response=credits merges cast
// into this same response instead of requiring a second request.
export const getMovieDetails = async (id) => {
  const movie = await tmdbRequest(`/movie/${id}`, { append_to_response: "credits" });
  return formatMovieDetails(movie);
};

// GET a single TV show's full details
export const getTVShowDetails = async (id) => {
  const show = await tmdbRequest(`/tv/${id}`, { append_to_response: "credits" });
  return formatTVShowDetails(show);
};