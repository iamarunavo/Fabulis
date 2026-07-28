const genreTags = document.getElementById("genreTags");
const genreForm = document.getElementById("genreForm");
const genreInput = document.getElementById("genreInput");

const mediaTypeTags = document.getElementById("mediaTypeTags");
const mediaTypeForm = document.getElementById("mediaTypeForm");
const mediaTypeInput = document.getElementById("mediaTypeInput");

let currentUser = null; // holds the full profile fetched from the server

function renderTags(container, items, onRemove) {
  if (!items || items.length === 0) {
    container.innerHTML = `<p class="empty-state-small">None added yet.</p>`;
    return;
  }
  container.innerHTML = items
    .map(
      (item, i) => `
      <span class="tag">
        ${item}
        <button type="button" class="tag-remove" data-index="${i}">&times;</button>
      </span>
    `
    )
    .join("");

  container.querySelectorAll(".tag-remove").forEach((btn) => {
    btn.addEventListener("click", () => onRemove(Number(btn.dataset.index)));
  });
}

async function saveProfile(updates) {
  const data = await apiFetch("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  currentUser = data.user;
  return data.user;
}

async function loadProfile() {
  try {
    const data = await apiFetch("/auth/profile");
    currentUser = data.user;

    document.getElementById("profileUsername").textContent = currentUser.username;
    document.getElementById("profileEmail").textContent = currentUser.email;

    renderTags(genreTags, currentUser.favoriteGenres, removeGenre);
    renderTags(mediaTypeTags, currentUser.favoriteMediaTypes, removeMediaType);
  } catch (err) {
    console.error("Failed to load profile:", err.message);
  }
}

async function removeGenre(index) {
  const updated = currentUser.favoriteGenres.filter((_, i) => i !== index);
  const user = await saveProfile({ favoriteGenres: updated });
  renderTags(genreTags, user.favoriteGenres, removeGenre);
}

async function removeMediaType(index) {
  const updated = currentUser.favoriteMediaTypes.filter((_, i) => i !== index);
  const user = await saveProfile({ favoriteMediaTypes: updated });
  renderTags(mediaTypeTags, user.favoriteMediaTypes, removeMediaType);
}

genreForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const value = genreInput.value.trim();
  if (!value) return;

  const updated = [...(currentUser.favoriteGenres || []), value];
  const user = await saveProfile({ favoriteGenres: updated });
  renderTags(genreTags, user.favoriteGenres, removeGenre);
  genreInput.value = "";
});

mediaTypeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const value = mediaTypeInput.value.trim();
  if (!value) return;

  const updated = [...(currentUser.favoriteMediaTypes || []), value];
  const user = await saveProfile({ favoriteMediaTypes: updated });
  renderTags(mediaTypeTags, user.favoriteMediaTypes, removeMediaType);
  mediaTypeInput.value = "";
});

// Color per status, MyAnimeList-style: green for actively watching, blue
// for completed, red for dropped, gray for not yet started. Reuses
// existing tokens where they already fit (--signal, --mist) and the same
// red already used for errors elsewhere in the app (#ff6b6b) - only green
// is new, since no green token exists yet.
const STATUS_COLORS = {
  "Currently Watching": "#4ade80",
  Completed: "var(--signal)",
  Dropped: "#ff6b6b",
  "Want To Watch": "var(--mist)",
};

// Renders the watchlist stats panel in a MyAnimeList-style format: a
// segmented bar showing the proportional breakdown, then a colored-dot
// legend with counts - same 4 statuses we've always tracked, just laid out
// to match that reference rather than a strict tile-per-status grid.
// Counted client-side from data the page already fetches, so this never
// costs an extra API call.
function watchlistStatsHTML(items) {
  const counts = Object.fromEntries(WATCHLIST_STATUSES.map((s) => [s, 0]));
  items.forEach((item) => {
    if (item.status in counts) counts[item.status] += 1;
  });
  const total = items.length;

  const barHTML = total
    ? Object.entries(counts)
        .filter(([, count]) => count > 0)
        .map(
          ([status, count]) =>
            `<div class="stats-bar-segment" style="width:${(count / total) * 100}%; background:${STATUS_COLORS[status]}"></div>`
        )
        .join("")
    : `<div class="stats-bar-segment" style="width:100%; background:var(--ink-light)"></div>`;

  const legendHTML = Object.entries(counts)
    .map(
      ([status, count]) => `
        <div class="stats-panel-row">
          <span class="stats-dot" style="background:${STATUS_COLORS[status]}"></span>
          <span class="stats-panel-label">${status}</span>
          <span class="stats-panel-count">${count}</span>
        </div>
      `
    )
    .join("");

  return `
    <div class="stats-panel">
      <div class="stats-panel-header">
        <span class="stats-panel-label">Total Entries</span>
        <span class="stats-panel-count">${total}</span>
      </div>
      <div class="stats-bar">${barHTML}</div>
      <div class="stats-legend">${legendHTML}</div>
    </div>
  `;
}

async function loadFullWatchlist() {
  const grid = document.getElementById("fullWatchlist");
  const statsContainer = document.getElementById("watchlistStats");
  grid.innerHTML = mediaCardSkeletonHTML(12);
  try {
    const data = await apiFetch("/watchlist");
    const items = data.items || [];
    statsContainer.innerHTML = watchlistStatsHTML(items);

    if (items.length === 0) {
      grid.innerHTML = `<p class="empty-state">Your watchlist is empty.</p>`;
      return;
    }
    grid.innerHTML = items
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
    attachRemoveHandlers(grid);
    attachStatusHandlers(grid);
    attachRatingHandlers(grid);
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Couldn't load your watchlist.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  loadFullWatchlist();
});