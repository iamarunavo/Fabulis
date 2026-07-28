const params = new URLSearchParams(location.search);
const type = params.get("type"); // "movie" | "tv" | "anime"
const id = params.get("id");

// The detail page is a single template for all three media types, so the API endpoint and response key vary by type. This object maps each type to its endpoint URL and the key in the response that contains the title's details.
const ENDPOINTS = {
  movie: { url: `/movies/${id}`, key: "movie" },
  tv: { url: `/tv/${id}`, key: "show" },
  anime: { url: `/anime/${id}`, key: "anime" },
};

const heroEl = document.getElementById("detailHero");
const genresEl = document.getElementById("detailGenres");
const titleEl = document.getElementById("detailTitle");
const metaEl = document.getElementById("detailMeta");
const overviewEl = document.getElementById("detailOverview");
const actionsEl = document.getElementById("detailActions");
const castHeadingEl = document.getElementById("detailCastHeading");
const castEl = document.getElementById("detailCast");

let detail = null; // the loaded title's detail response, cached for the actions fragment

function metaLine(d) {
  const parts = [];
  if (d.rating) parts.push(`${d.rating.toFixed(1)} ★`);
  if (type === "movie") {
    if (d.runtime) parts.push(`${d.runtime} min`);
    if (d.releaseDate) parts.push(d.releaseDate.slice(0, 4));
  } else if (type === "tv") {
    if (d.seasons) parts.push(`${d.seasons} season${d.seasons === 1 ? "" : "s"}`);
    if (d.episodes) parts.push(`${d.episodes} episodes`);
  } else if (type === "anime") {
    if (d.episodes) parts.push(`${d.episodes} episodes`);
    if (d.duration) parts.push(`${d.duration} min/ep`);
    if (d.studio) parts.push(d.studio);
  }
  return parts.join(" • ");
}

async function loadDetail() {
  const endpoint = ENDPOINTS[type];
  if (!endpoint || !id) {
    heroEl.innerHTML = `<div class="container"><p class="empty-state">Title not found.</p></div>`;
    return;
  }

  try {
    const data = await apiFetch(endpoint.url);
    detail = data[endpoint.key];

    document.title = `${detail.title} - Fabulis`;
    titleEl.textContent = detail.title;
    genresEl.innerHTML = (detail.genres || []).map((g) => `<span class="tag">${g}</span>`).join("");
    metaEl.textContent = metaLine(detail);
    overviewEl.textContent = detail.description || "";

    if (detail.backdrop) {
      heroEl.style.backgroundImage = `url(${detail.backdrop})`;
    } else {
      heroEl.classList.add("detail-hero-fallback");
    }

    castHeadingEl.textContent = type === "anime" ? "Voice Cast" : "Cast";
    // No empty-state message for a blank cast row - a title with no cast
    // data isn't an error state worth calling out, just leave it empty.
    castEl.innerHTML = (detail.cast || []).map(castCardHTML).join("");

    await refreshActions();
  } catch (err) {
    heroEl.innerHTML = `<div class="container"><p class="empty-state">Title not found.</p></div>`;
  }
}

function castCardHTML(member) {
  return `
    <div class="cast-card">
      ${
        member.photo
          ? `<img src="${member.photo}" alt="${member.name}" class="cast-card-photo" loading="lazy" decoding="async" />`
          : `<div class="cast-card-photo cast-card-photo-placeholder"></div>`
      }
      <p class="cast-card-name">${member.name}</p>
      <p class="cast-card-role">${member.role}</p>
    </div>
  `;
}

async function findWatchlistItem() {
  try {
    const { items } = await apiFetch("/watchlist");
    return items.find((i) => i.mediaId === id && i.mediaType === type) || null;
  } catch (err) {
    return null;
  }
}

// Renders the actions fragment based on whether the title is already in the user's watchlist. If it is, show the status dropdown, remove button, and rate button. If not, show the "+ Watchlist" button.
function renderActions(watchlistItem) {
  const addHTML = `
    <button
      class="btn btn-secondary btn-add-watchlist"
      data-id="${id}"
      data-title="${detail.title.replace(/"/g, "&quot;")}"
      data-poster="${detail.poster || ""}"
      data-media-type="${type}"
    >+ Watchlist</button>
  `;

  const managedHTML = watchlistItem
    ? `
      <select
        class="media-card-status-select"
        data-watchlist-id="${watchlistItem._id}"
        data-previous-value="${watchlistItem.status}"
      >
        ${WATCHLIST_STATUSES.map(
          (s) => `<option value="${s}" ${s === watchlistItem.status ? "selected" : ""}>${s}</option>`
        ).join("")}
      </select>
      <button
        class="btn btn-secondary btn-remove-watchlist"
        data-watchlist-id="${watchlistItem._id}"
      >Remove</button>
      <button
        class="btn btn-secondary btn-rate-toggle"
        data-id="${id}"
        data-media-type="${type}"
      >★ Rate</button>
      <form class="rating-form hidden" data-id="${id}" data-media-type="${type}">
        <input type="number" class="rating-input" min="1" max="10" step="1" placeholder="1-10" required />
        <textarea class="rating-comment" maxlength="2000" placeholder="Optional comment..."></textarea>
        <div class="rating-form-actions">
          <button type="submit" class="btn btn-primary">Save</button>
          <button type="button" class="btn btn-secondary rating-cancel">Cancel</button>
        </div>
      </form>
    `
    : "";

  // Inner .media-card wrapper (not on #detailActions itself) so
  // attachRemoveHandlers's btn.closest(".media-card").remove() only clears
  // this wrapper, leaving #detailActions itself in the DOM to render into
  // again afterward.
  actionsEl.innerHTML = `
    <div class="card media-card detail-actions-card">
      ${watchlistItem ? managedHTML : addHTML}
    </div>
  `;
}

async function refreshActions() {
  renderActions(await findWatchlistItem());
}

document.addEventListener("DOMContentLoaded", () => {
  loadDetail();
  attachWatchlistHandlers(actionsEl);
  attachStatusHandlers(actionsEl);
  attachRatingHandlers(actionsEl);
  attachRemoveHandlers(actionsEl);
});

// Re-render the actions fragment after an add/remove so the UI flips
// between "+ Watchlist" and the status/rate/remove controls without a
// manual page reload.
document.addEventListener("watchlist:updated", refreshActions);
