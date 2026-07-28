// mediaCardHTML() now lives in media-card.js, included as a script before this file

async function loadWelcomeHeading() {
  const user = getCurrentUser();
  const heading = document.getElementById("welcomeHeading");
  if (user && heading) {
    heading.textContent = `Welcome back, ${user.username}`;
  }
}

// Constants for calculating how many watchlist cards can fit in a row
const WATCHLIST_CARD_MIN_WIDTH = 180;
const WATCHLIST_GRID_GAP = 20;

let watchlistItems = [];
let watchlistHandlersAttached = false;

function cardsPerRow(grid) {
  const width = grid.clientWidth;
  const count = Math.floor(
    (width + WATCHLIST_GRID_GAP) / (WATCHLIST_CARD_MIN_WIDTH + WATCHLIST_GRID_GAP)
  );
  return Math.max(count, 1);
}

function renderWatchlistPreview() {
  const grid = document.getElementById("watchlistGrid");
  if (watchlistItems.length === 0) {
    grid.innerHTML = `<p class="empty-state">Your watchlist is empty. <a href="explore.html">Explore titles</a> to add some.</p>`;
    return;
  }
  grid.innerHTML = watchlistItems
    .slice(0, cardsPerRow(grid))
    .map((item) =>
      mediaCardHTML({
        id: item.mediaId,
        mediaType: item.mediaType,
        title: item.title,
        poster: item.image,
        status: item.status,
        watchlistId: item._id,
        showRemoveButton: true,
      })
    )
    .join("");
  if (!watchlistHandlersAttached) {
    attachRemoveHandlers(grid);
    attachStatusHandlers(grid);
    attachRatingHandlers(grid);
    watchlistHandlersAttached = true;
  }
}

async function loadWatchlist() {
  const grid = document.getElementById("watchlistGrid");
  // Only skeleton the first load - on a watchlist:updated refresh there's
  // already real content on screen, and blanking it out to skeletons would
  // flash worse than just swapping the cards in place.
  if (!watchlistItems.length) grid.innerHTML = mediaCardSkeletonHTML(cardsPerRow(grid));
  try {
    const data = await apiFetch("/watchlist");
    watchlistItems = data.items || [];
    renderWatchlistPreview();
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Couldn't load your watchlist right now.</p>`;
  }
}

// Re-render the watchlist preview on window resize so that it always fills the row
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderWatchlistPreview, 150);
});

async function loadPopular() {
  const grid = document.getElementById("popularGrid");
  grid.innerHTML = mediaCardSkeletonHTML(8); // matches the 8 real cards below
  try {
    // Fetch popular movies, TV shows, and anime in parallel
    const [movieData, tvData, animeData] = await Promise.all([
      apiFetch("/movies/popular"),
      apiFetch("/tv/popular"),
      apiFetch("/anime/popular"),
    ]);

    const movies = (movieData.movies || []).slice(0, 4).map((m) => ({
      id: m.id,
      title: m.title,
      poster: m.poster,
      rating: m.rating,
      mediaType: "movie",
    }));

    const shows = (tvData.shows || []).slice(0, 3).map((s) => ({
      id: s.id,
      title: s.title,
      poster: s.poster,
      rating: s.rating,
      mediaType: "tv",
    }));

    const anime = (animeData.anime || []).slice(0, 3).map((a) => ({
      id: a.id,
      title: a.title,
      poster: a.poster,
      rating: a.score,
      mediaType: "anime",
    }));

    // Interleave the three arrays to create a mixed list of popular titles
    const mixed = [];
    const max = Math.max(movies.length, shows.length, anime.length);
    for (let i = 0; i < max; i++) {
      if (movies[i]) mixed.push(movies[i]);
      if (anime[i]) mixed.push(anime[i]);
      if (shows[i]) mixed.push(shows[i]);
    }

    grid.innerHTML = mixed
      .slice(0, 8) // matches #popularGrid's 8 columns so the row ends flush
      .map((item) =>
        mediaCardHTML({
          id: item.id,
          title: item.title,
          poster: item.poster,
          rating: item.rating,
          mediaType: item.mediaType,
          showAddButton: true,
        })
      )
      .join("");
    attachWatchlistHandlers(grid);
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Couldn't load recommendations right now.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadWelcomeHeading();
  loadWatchlist();
  loadPopular();
});

// Listen for the custom "watchlist:updated" event so that we can re-render the watchlist preview
document.addEventListener("watchlist:updated", loadWatchlist);