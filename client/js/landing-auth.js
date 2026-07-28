// The landing page is public, so it ships with the logged-out nav. If the
// visitor already has a session, swap in the app nav and CTAs so clicking
// the logo from inside the app doesn't dump them on a logged-out page.
// Runs before nav.js so the mobile menu binds to the final links.
(function () {
  if (!localStorage.getItem("fabulis_token")) return;

  const navLinks = document.getElementById("navLinks");
  if (navLinks) {
    navLinks.innerHTML = `
      <a href="pages/dashboard.html">Dashboard</a>
      <a href="pages/explore.html">Explore</a>
      <a href="pages/ai-discovery.html">AI Discovery</a>
      <a href="pages/profile.html">Profile</a>
      <a href="#" id="logoutBtn" class="btn btn-secondary">Logout</a>
    `;
  }

  const heroActions = document.querySelector(".hero-actions");
  if (heroActions) {
    heroActions.innerHTML = `
      <a href="pages/dashboard.html" class="btn btn-primary">Go to dashboard</a>
      <a href="pages/explore.html" class="btn btn-secondary">Explore</a>
    `;
  }

  // Wired here rather than reusing auth-guard.js, which redirects visitors
  // without a token - that would break this page for logged-out users.
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("fabulis_token");
      localStorage.removeItem("fabulis_user");
      location.reload();
    });
  }
})();
