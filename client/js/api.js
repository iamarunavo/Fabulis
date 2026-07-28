// client/js/api.js
// Wraps fetch with JSON parsing and basic error handling used across all pages. All API calls go through this so we can centralize the base URL, auth headers, and error handling.
const SERVED_BY_BACKEND =
  location.protocol.startsWith("http") &&
  (location.port === "5000" || location.port === "");

const API_BASE = SERVED_BY_BACKEND ? "/api" : "http://localhost:5000/api";

// Wraps fetch with JSON parsing and basic error handling used across all pages
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("fabulis_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}