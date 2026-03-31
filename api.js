(() => {
  const API_BASE = window.CAMPUSCART_API_BASE || `${window.location.origin}/api`;

  const TOKEN_KEY = "cc_token";
  const USER_KEY = "cc_user";

  const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
  const getUser = () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const setSession = ({ token, user }) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

    // Keep older keys in sync for backward-compatible UI checks.
    if (user) localStorage.setItem("user", JSON.stringify({ name: user.name, email: user.email }));
    if (token) localStorage.setItem("loggedIn", "true");
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("user");
  };

  const request = async (path, options = {}) => {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const message = data.message || `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data;
  };

  window.CampusCartAPI = {
    getToken,
    getUser,
    setSession,
    clearSession,
    request
  };
})();
