const grid = document.getElementById("exploreGrid");
const tabs = document.querySelectorAll(".filter-tab");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const sentinel = document.getElementById("scrollSentinel");
const loadingMore = document.getElementById("loadingMore");

const MAX_PAGES = 15; 

let currentType = "movie";
let currentQuery = "";
let currentPage = 1;
let isLoading = false;
let hasMore = true;

const ENDPOINTS = {
  movie: { url: "/movies/popular", key: "movies" },
  tv: { url: "/tv/popular", key: "shows" },
  anime: { url: "/anime/popular", key: "anime" },
};

function renderGrid(items, type, append) {
  const cardsHTML = items
    .map((item) =>
      mediaCardHTML({
        id: item.id,
        title: item.title,
        poster: item.poster,
        rating: item.rating || item.score,
        mediaType: type,
        showAddButton: true,
      })
    )
    .join("");

  if (append) {
    grid.insertAdjacentHTML("beforeend", cardsHTML);
  } else {
    grid.innerHTML = cardsHTML || `<p class="empty-state">No results found.</p>`;
  }
}

function showEndOfResults() {
  loadingMore.hidden = false;
  loadingMore.textContent =
    "You've explored all available recommendations. Use filters or search to discover more.";
  loadingMore.classList.remove("loading-more-error");
}

function showRetry() {
  loadingMore.hidden = false;
  loadingMore.innerHTML = `Couldn't load more. <button type="button" id="retryLoadBtn" class="retry-link">Retry</button>`;
  loadingMore.classList.add("loading-more-error");
  document.getElementById("retryLoadBtn").addEventListener("click", loadPage);
}

async function loadPage() {
  if (isLoading || !hasMore) return;

  // If the current page exceeds the maximum allowed pages, stop loading more and show the end-of-results message. This prevents excessive API calls and ensures a better user experience.
  if (currentPage > MAX_PAGES) {
    hasMore = false;
    showEndOfResults();
    return;
  }

  isLoading = true;
  loadingMore.classList.remove("loading-more-error");
  if (currentPage === 1) {
    grid.innerHTML = mediaCardSkeletonHTML(12);
    loadingMore.hidden = true;
  } else {
    loadingMore.hidden = false;
    loadingMore.textContent = "Loading more...";
  }

  try {
    let items;
    const searchType = currentType === "anime" ? "anime" : "movie";

    if (currentQuery) {
      const data = await apiFetch(
        `/search?query=${encodeURIComponent(currentQuery)}&type=${searchType}&page=${currentPage}`
      );
      items = data.results;
    } else {
      const { url, key } = ENDPOINTS[currentType];
      const data = await apiFetch(`${url}?page=${currentPage}`);
      items = data[key];
    }

    if (!items || items.length === 0) {
      hasMore = false;
      if (currentPage === 1) {
        renderGrid([], currentType, false);
      } else {
        showEndOfResults();
      }
    } else {
      renderGrid(items, currentType, currentPage > 1);
      currentPage += 1;
      loadingMore.hidden = true;

     // If the current page exceeds the maximum allowed pages after loading, stop loading more and show the end-of-results message. This ensures that users are informed when they have reached the limit of available content.
      observer.unobserve(sentinel);
      observer.observe(sentinel);
    }
  } catch (err) {
    // Transient failure, don't disable pagination permanently. Show a
    // retry option; scrolling further or clicking Retry both try again,
    // since hasMore stays true and currentPage is unchanged.
    if (currentPage === 1) {
      grid.innerHTML = `<p class="empty-state">Couldn't load titles right now.</p>`;
    } else {
      showRetry();
    }
  } finally {
    isLoading = false;
  }
}

function resetAndLoad() {
  currentPage = 1;
  hasMore = true;
  loadingMore.hidden = true;
  loadPage();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentType = tab.dataset.type;
    currentQuery = "";
    searchInput.value = "";
    resetAndLoad();
  });
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  currentQuery = searchInput.value.trim();
  resetAndLoad();
});

const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadPage();
    }
  },
  { rootMargin: "400px" }
);

// fallback for browsers that don't support IntersectionObserver (Safari 13, IE11, etc.), just load the next page when the user scrolls near the bottom of the page
window.addEventListener(
  "scroll",
  () => {
    if (isLoading || !hasMore) return;
    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.scrollHeight - 400;
    if (nearBottom) loadPage();
  },
  { passive: true }
);

document.addEventListener("DOMContentLoaded", () => {
  attachWatchlistHandlers(grid);
  observer.observe(sentinel);
  loadPage();
});