// Shared media-card rendering and event-handling logic for the browse grids and the user's own watchlist grids. The watchlist grids have extra features (status dropdown, "Remove" button, and inline rating form) that aren't needed on the browse grids, so the caller can choose which features to include.
const WATCHLIST_STATUSES = ["Want To Watch", "Currently Watching", "Completed", "Dropped"];

// Renders a single media card for a title, optionally with a status dropdown and/or "Add to Watchlist" button. The caller can provide an id to link to a detail page, or omit it to render a non-linking card (e.g. for the dashboard's "Continue Watching" section).
function mediaCardHTML({ id, title, poster, rating, status, mediaType, showAddButton, showRemoveButton, watchlistId }) {
  // If the caller didn't provide an id, don't link to a detail page - the card
  const detailHref = id ? `detail.html?type=${mediaType}&id=${id}` : null;
  const linkOpen = detailHref ? `<a class="media-card-link" href="${detailHref}">` : "";
  const linkClose = detailHref ? `</a>` : "";

  return `
    <div class="card media-card">
      ${linkOpen}<div class="media-card-poster">
        ${poster ? `<img src="${poster}" alt="${title}" loading="lazy" decoding="async" />` : `<div class="poster-placeholder"></div>`}
      </div>${linkClose}
      <div class="media-card-body">
        ${linkOpen}<p class="media-card-title">${title}</p>${linkClose}
        ${rating ? `<p class="data media-card-rating">${rating.toFixed(1)} &#9733;</p>` : ""}
        ${
          showRemoveButton && status
            ? `<select
                class="media-card-status-select"
                data-watchlist-id="${watchlistId}"
                data-previous-value="${status}"
              >
                ${WATCHLIST_STATUSES.map(
                  (s) => `<option value="${s}" ${s === status ? "selected" : ""}>${s}</option>`
                ).join("")}
              </select>`
            : ""
        }
        ${
          showAddButton
            ? `<button
                class="btn btn-secondary btn-add-watchlist"
                data-id="${id}"
                data-title="${title.replace(/"/g, "&quot;")}"
                data-poster="${poster || ""}"
                data-media-type="${mediaType}"
              >+ Watchlist</button>`
            : ""
        }
        ${
          showRemoveButton
            ? `<button
                class="btn btn-secondary btn-remove-watchlist"
                data-watchlist-id="${watchlistId}"
              >Remove</button>`
            : ""
        }
        ${
          showRemoveButton
            ? `<button
                class="btn btn-secondary btn-rate-toggle"
                data-id="${id}"
                data-media-type="${mediaType}"
              >★ Rate</button>
              <form class="rating-form hidden" data-id="${id}" data-media-type="${mediaType}">
                <input type="number" class="rating-input" min="1" max="10" step="1" placeholder="1-10" required />
                <textarea class="rating-comment" maxlength="2000" placeholder="Optional comment..."></textarea>
                <div class="rating-form-actions">
                  <button type="submit" class="btn btn-primary">Save</button>
                  <button type="button" class="btn btn-secondary rating-cancel">Cancel</button>
                </div>
              </form>`
            : ""
        }
      </div>
    </div>
  `;
}

// Renders a row of skeleton cards for loading states - the number of cards is
function mediaCardSkeletonHTML(count = 8) {
  return Array.from(
    { length: count },
    () => `
    <div class="card media-card skeleton-card" aria-hidden="true">
      <div class="media-card-poster skeleton-block"></div>
      <div class="media-card-body">
        <div class="skeleton-block skeleton-line"></div>
        <div class="skeleton-block skeleton-line skeleton-line-short"></div>
      </div>
    </div>
  `
  ).join("");
}

// Wires up "Add to Watchlist" buttons on browse grids using event delegation - one listener on the container handles all cards, including ones added later (e.g. after a search re-renders the grid).
function attachWatchlistHandlers(container) {
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-add-watchlist");
    if (!btn) return;

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = "Adding...";

    try {
      await apiFetch("/watchlist", {
        method: "POST",
        body: JSON.stringify({
          mediaId: btn.dataset.id,
          mediaType: btn.dataset.mediaType,
          title: btn.dataset.title,
          image: btn.dataset.poster,
        }),
      });
      btn.textContent = "Added ✓";
      // Let other parts of the page (e.g. the dashboard's watchlist preview)
      // know a watchlist change happened, without coupling this shared
      // handler to any specific page's refresh logic.
      document.dispatchEvent(new CustomEvent("watchlist:updated"));
    } catch (err) {
      // If the add fails, show a message for a couple seconds and then revert to the original button state so the user can try again.
      btn.textContent = err.message.includes("already")
        ? "Already added"
        : "Failed";
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    }
  });
}

// Wires up status dropdowns on the user's own watchlist grids using event delegation - one listener on the container handles all cards, including ones added later (e.g. after a search re-renders the grid).
function attachStatusHandlers(container) {
  container.addEventListener("change", async (e) => {
    const select = e.target.closest(".media-card-status-select");
    if (!select) return;

    const previousValue = select.dataset.previousValue;
    const newValue = select.value;
    select.disabled = true;
    select.classList.remove("media-card-status-select-error");

    try {
      await apiFetch(`/watchlist/${select.dataset.watchlistId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newValue }),
      });
      select.dataset.previousValue = newValue;
    } catch (err) {
      select.value = previousValue;
      select.classList.add("media-card-status-select-error");
      setTimeout(() => select.classList.remove("media-card-status-select-error"), 2000);
    }

    select.disabled = false;
  });
}

// Wires up rating forms on the user's own watchlist grids using the same
function attachRatingHandlers(container) {
  container.addEventListener("click", async (e) => {
    const cancelBtn = e.target.closest(".rating-cancel");
    if (cancelBtn) {
      cancelBtn.closest(".rating-form").classList.add("hidden");
      return;
    }

    const toggleBtn = e.target.closest(".btn-rate-toggle");
    if (!toggleBtn) return;

    const form = toggleBtn.nextElementSibling;
    form.classList.toggle("hidden");
    if (form.classList.contains("hidden") || form.dataset.loaded) return;

    form.dataset.loaded = "true";
    try {
      const { reviews } = await apiFetch(`/reviews/${toggleBtn.dataset.id}`);
      const currentUser = getCurrentUser();
      const own = reviews.find(
        (r) => r.mediaType === toggleBtn.dataset.mediaType && r.userId?._id === currentUser?.id
      );
      if (own) {
        form.querySelector(".rating-input").value = own.rating;
        form.querySelector(".rating-comment").value = own.comment || "";
        form.querySelector("button[type=submit]").textContent = "Update";
      }
    } catch (err) {
      // No existing review, or the lookup failed - leave the form blank
      // rather than blocking the user from submitting a new rating.
    }
  });

  container.addEventListener("submit", async (e) => {
    const form = e.target.closest(".rating-form");
    if (!form) return;
    e.preventDefault();

    const submitBtn = form.querySelector("button[type=submit]");
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;

    try {
      await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({
          mediaId: form.dataset.id,
          mediaType: form.dataset.mediaType,
          rating: Number(form.querySelector(".rating-input").value),
          comment: form.querySelector(".rating-comment").value.trim() || undefined,
        }),
      });
      form.classList.add("hidden");
      const rating = form.querySelector(".rating-input").value;
      form.previousElementSibling.textContent = `★ Rated ${rating}`;
      submitBtn.textContent = "Update";
    } catch (err) {
      submitBtn.textContent = "Failed";
      setTimeout(() => (submitBtn.textContent = originalLabel), 2000);
    }

    submitBtn.disabled = false;
  });
}

// Wires up "Remove" buttons on the user's own watchlist grids
function attachRemoveHandlers(container) {
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-remove-watchlist");
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = "Removing...";

    try {
      await apiFetch(`/watchlist/${btn.dataset.watchlistId}`, {
        method: "DELETE",
      });
      btn.closest(".media-card").remove();
      document.dispatchEvent(new CustomEvent("watchlist:updated"));
    } catch (err) {
      btn.textContent = "Failed";
      btn.disabled = false;
    }
  });
}