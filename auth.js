(() => {
  const api = window.CampusCartAPI;

  if (!api) {
    alert("API client not loaded.");
    return;
  }

  const toggle = (btnId, inputId) => {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener("click", () => {
      const isPwd = input.type === "password";
      input.type = isPwd ? "text" : "password";
      btn.textContent = isPwd ? "🙈" : "👁";
    });
  };

  toggle("toggleLoginPassword", "loginPassword");
  toggle("toggleSignupPassword", "password");

  const getStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 25;
    if (/\d/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;

    let label = "Weak";
    if (score > 75) label = "Strong";
    else if (score > 50) label = "Good";
    else if (score > 25) label = "Fair";

    return { score, label };
  };

  const passwordInput = document.getElementById("password");
  const strengthBar = document.getElementById("passwordStrengthBar");
  const strengthLabel = document.getElementById("passwordStrengthLabel");

  if (passwordInput && strengthBar && strengthLabel) {
    passwordInput.addEventListener("input", () => {
      const value = passwordInput.value || "";
      const { score, label } = getStrength(value);
      strengthBar.style.width = `${score}%`;
      strengthLabel.textContent = `Strength: ${label} (${score}%)`;
    });
  }

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name")?.value?.trim();
      const email = document.getElementById("email")?.value?.trim();
      const password = document.getElementById("password")?.value || "";
      const strength = getStrength(password);

      if (!name || !email || password.length < 6 || strength.score < 50) {
        alert("Use a valid name/email and a stronger password (Good or Strong).");
        return;
      }

      try {
        const response = await api.request("/auth/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password })
        });

        alert(response.message || "Signup successful!");
        window.location.href = "login.html";
      } catch (error) {
        alert(error.message || "Signup failed");
      }
    });
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail")?.value?.trim();
      const password = document.getElementById("loginPassword")?.value || "";

      try {
        const response = await api.request("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });

        api.setSession(response);
        alert("Login successful!");
        window.location.href = "index.html";
      } catch (error) {
        alert(error.message || "Invalid credentials");
      }
    });
  }
})();