(function () {
  document.querySelectorAll(".navbar").forEach((navbar) => {
    const toggle = navbar.querySelector(".nav-toggle");
    const links = navbar.querySelector(".nav-links");
    if (!toggle || !links) return;

    const closeMenu = () => {
      navbar.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const isOpen = navbar.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    links.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  });
})();
