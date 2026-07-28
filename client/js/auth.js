// client/js/auth.js
// handles login and registration forms, including validation, error display, and redirecting on success

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const errorMessage = document.getElementById("errorMessage");
const submitBtn = document.getElementById("submitBtn");

// Shows an error message in the form without a jarring alert() popup
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

// After a successful login/register, store the token and redirect to the dashboard
function handleAuthSuccess(data) {
  localStorage.setItem("fabulis_token", data.token);
  localStorage.setItem("fabulis_user", JSON.stringify(data.user));
  window.location.href = "dashboard.html";
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMessage.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    try {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      handleAuthSuccess(data);
    } catch (err) {
      showError(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMessage.hidden = true;

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });

      handleAuthSuccess(data);
    } catch (err) {
      showError(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Account";
    }
  });
}