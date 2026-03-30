(() => {
  const safeJSON = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  // ===== Password toggles =====
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

  // ===== Signup =====
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("name")?.value?.trim();
      const email = document.getElementById("email")?.value?.trim();
      const password = document.getElementById("password")?.value || "";

      if (!name || !email || password.length < 6) {
        alert("Please enter a valid name, email, and a password of at least 6 characters.");
        return;
      }

      const user = { name, email, password };
      localStorage.setItem("user", JSON.stringify(user));

      alert("Signup successful!");
      window.location.href = "login.html";
    });
  }

  // ===== Login =====
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const storedUser = safeJSON(localStorage.getItem("user"), null);
      const email = document.getElementById("loginEmail")?.value?.trim();
      const password = document.getElementById("loginPassword")?.value || "";

      if (!storedUser) {
        alert("No account found. Please sign up first.");
        window.location.href = "signup.html";
        return;
      }

      if (email === storedUser.email && password === storedUser.password) {
        localStorage.setItem("loggedIn", "true");
        alert("Login successful!");
        window.location.href = "index.html";
      } else {
        alert("Invalid credentials");
      }
    });
  }
})();