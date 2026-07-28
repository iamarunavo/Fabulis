// client/js/auth-guard.js
// checks if the user is logged in by looking for a token in localStorage
(function () {
  const token = localStorage.getItem("fabulis_token");

  if (!token) {
    window.location.href = "login.html";
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("fabulis_token");
      localStorage.removeItem("fabulis_user");
      window.location.href = "login.html";
    });
  }
});

// Convenience helper other page scripts can use to get the logged-in user's info
function getCurrentUser() {
  const raw = localStorage.getItem("fabulis_user");
  return raw ? JSON.parse(raw) : null;
}