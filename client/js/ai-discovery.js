const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatSubmitBtn = document.getElementById("chatSubmitBtn");

// Returns a human-readable label for a recommendation's type (e.g. "Anime Movie")
function recommendationTypeLabel(rec) {
  const formatLabel = rec.format === "movie" ? "Movie" : "Series";
  return rec.origin === "anime" ? `Anime ${formatLabel}` : formatLabel;
}

// Returns HTML for a single recommendation card
function recommendationCardHTML(rec) {
  return `
    <div class="rec-card">
      <div class="rec-card-header">
        <p class="rec-card-title">${rec.title}</p>
        <span class="rec-card-type">${recommendationTypeLabel(rec)}</span>
      </div>
      <p class="rec-card-desc">${rec.description}</p>
      <p class="rec-card-why"><span class="eyebrow">Why you'll like it</span> ${rec.whyRecommended}</p>
      ${
        rec.similarTitles?.length
          ? `<p class="rec-card-similar">Similar to: ${rec.similarTitles.join(", ")}</p>`
          : ""
      }
      ${
        rec.whereToWatch?.length
          ? `<p class="rec-card-where">Where to watch: ${rec.whereToWatch.join(", ")}</p>`
          : ""
      }
    </div>
  `;
}

function addUserMessage(text) {
  const el = document.createElement("div");
  el.className = "chat-message chat-message-user";
  el.innerHTML = `<p>${text}</p>`;
  chatWindow.appendChild(el);
}

function addAIMessage(html) {
  const el = document.createElement("div");
  el.className = "chat-message chat-message-ai";
  el.innerHTML = html;
  chatWindow.appendChild(el);
}

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

const historyToggle = document.getElementById("historyToggle");
const historyPanel = document.getElementById("historyPanel");
let historyItems = null; // null = not yet fetched; fetched once and cached

function historyEntryHTML(entry) {
  const cardsHTML = (entry.results?.recommendations || []).map(recommendationCardHTML).join("");
  return `
    <div class="history-entry">
      <p class="history-entry-prompt">${entry.prompt}</p>
      <p class="history-entry-time">${new Date(entry.createdAt).toLocaleString()}</p>
      <div class="rec-grid">${cardsHTML}</div>
    </div>
  `;
}

async function loadHistory() {
  historyPanel.innerHTML = `<p class="empty-state">Loading your past recommendations...</p>`;
  try {
    const { history } = await apiFetch("/recommend/history");
    historyItems = history;
    historyPanel.innerHTML = historyItems.length
      ? historyItems.map(historyEntryHTML).join("")
      : `<p class="empty-state">No past recommendations yet.</p>`;
  } catch (err) {
    // If the fetch fails, we leave historyItems as null so that we can retry next time
    historyPanel.innerHTML = `<p class="chat-error">Couldn't load your history: ${err.message}</p>`;
  }
}

historyToggle.addEventListener("click", async () => {
  historyPanel.classList.toggle("hidden");
  if (!historyPanel.classList.contains("hidden") && historyItems === null) {
    await loadHistory();
  }
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  addUserMessage(message);
  chatInput.value = "";
  chatInput.disabled = true;
  chatSubmitBtn.disabled = true;
  chatSubmitBtn.textContent = "Thinking...";
  scrollToBottom();

  addAIMessage(`<p class="chat-loading">Fabulis is thinking...</p>`);
  scrollToBottom();

  try {
    const data = await apiFetch("/recommend", {
      method: "POST",
      body: JSON.stringify({ message }),
    });

    // Remove the "thinking..." placeholder before showing real results
    chatWindow.removeChild(chatWindow.lastChild);

    const cardsHTML = data.recommendations.map(recommendationCardHTML).join("");
    addAIMessage(`<p>Here's what I'd recommend:</p><div class="rec-grid">${cardsHTML}</div>`);
  } catch (err) {
    chatWindow.removeChild(chatWindow.lastChild);
    addAIMessage(`<p class="chat-error">Something went wrong: ${err.message}</p>`);
  }

  chatInput.disabled = false;
  chatSubmitBtn.disabled = false;
  chatSubmitBtn.textContent = "Ask";
  chatInput.focus();
  scrollToBottom();
});