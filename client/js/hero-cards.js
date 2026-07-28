// Populates the three hero poster slots with real, live data from our own
// APIs - TV on the left, anime centered, movie on the right.
async function loadHeroCards() {
  const slots = {
    tv: document.querySelector('[data-slot="tv"]'),
    anime: document.querySelector('[data-slot="anime"]'),
    movie: document.querySelector('[data-slot="movie"]'),
  };

  // If any slot is missing, this page isn't the landing page - bail quietly
  if (!slots.tv || !slots.anime || !slots.movie) return;

  const renderCard = (el, item, meta) => {
    if (!item || !item.poster) {
      el.style.display = "none"; // hide gracefully rather than show a broken card
      return;
    }
    el.innerHTML = `
      <img src="${item.poster}" alt="${item.title}" fetchpriority="high" decoding="async" />
      <div class="hero-card-label">
        <span>${item.title}</span>
        <span class="data">${meta}</span>
      </div>
    `;
  };

  try {
    const [movieData, animeData, tvData] = await Promise.all([
      apiFetch("/movies/popular"),
      apiFetch("/anime/popular"),
      apiFetch("/tv/popular"),
    ]);

    const movie = movieData.movies?.[0];
    const anime = animeData.anime?.[0];
    const tv = tvData.shows?.[0];

    renderCard(slots.movie, movie, movie?.rating ? `${movie.rating.toFixed(1)} ★` : "");
    renderCard(slots.anime, anime, anime?.score ? `${anime.score.toFixed(1)} ★` : "");
    renderCard(slots.tv, tv, tv?.rating ? `${tv.rating.toFixed(1)} ★` : "");

    renderPosterWall(movieData.movies, animeData.anime, tvData.shows);
  } catch (err) {
    // If the API is unreachable (e.g. local backend not running), just hide
    // all three slots instead of leaving broken/empty cards on screen
    console.error("Hero cards failed to load:", err.message);
    Object.values(slots).forEach((el) => (el.style.display = "none"));
  }
}

// Renders the hero wall of posters behind the hero cards
function renderPosterWall(movies = [], anime = [], shows = []) {
  const wall = document.getElementById("heroWall");
  if (!wall) return;

  const mixed = [];
  const max = Math.max(movies.length, anime.length, shows.length);
  for (let i = 0; i < max; i++) {
    if (movies[i]) mixed.push(movies[i]);
    if (anime[i]) mixed.push(anime[i]);
    if (shows[i]) mixed.push(shows[i]);
  }

  // Render the poster wall by creating an <img> element for each poster in the mixed array, filtering out any items without a poster, and joining them into a single HTML string. This ensures that only valid posters are displayed in the background.
  wall.innerHTML = mixed
    .map((item) => item.poster)
    .filter(Boolean)
    .map((src) => `<img src="${src}" alt="" loading="lazy" decoding="async" />`)
    .join("");
}

document.addEventListener("DOMContentLoaded", loadHeroCards);