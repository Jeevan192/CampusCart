(() => {
  const api = window.CampusCartAPI;
  if (!api) return;

  const CURRENT_PAGE = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const AUTH_PAGES = new Set(["login.html", "signup.html"]);

  const isLoggedIn = () => Boolean(api.getToken());
  const getUser = () => api.getUser();

  const requireAuth = () => {
    if (!AUTH_PAGES.has(CURRENT_PAGE) && !isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  };

  const wireLogout = () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {
      api.clearSession();
      alert("Logged out!");
      window.location.href = "login.html";
    });
  };

  wireLogout();
  if (!requireAuth()) return;

  // ========= Index page logic only =========
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const searchInput = document.querySelector(".search-bar");
  const categoryFilter = document.getElementById("categoryFilter");
  const priceFilter = document.getElementById("priceFilter");
  const clearBtn = document.getElementById("clearFilters");

  // Accept search intent from landing page and URL query string.
  const params = new URLSearchParams(window.location.search);
  const incomingQuery = (params.get("q") || localStorage.getItem("landingQuery") || "").trim();
  if (incomingQuery && searchInput) {
    searchInput.value = incomingQuery;
    localStorage.removeItem("landingQuery");
  }

  let products = [];
  let wishlistIds = new Set();

  const getProductKey = (p) => {
    return String(p?._id || "");
  };

  function displayProducts(items) {
    grid.innerHTML = "";

    if (!items || items.length === 0) {
      grid.innerHTML = `<div class="panel" style="grid-column:1/-1;"><p class="muted" style="margin:0;">No products found</p></div>`;
      return;
    }

    items.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";
      const inWishlist = wishlistIds.has(getProductKey(p));

      const safeImg = p.image || "https://via.placeholder.com/600x400?text=CampusCart";
      const safeTitle = p.title || "Untitled";
      const safeCategory = p.category || "Others";
      const safePrice = Number.isFinite(Number(p.price)) ? Number(p.price) : 0;

      // Seller hint line (if present)
      const sellerName = p.seller?.name ? String(p.seller.name) : "";
      const sellerLine = sellerName ? `<p class="muted small" style="margin:0 0 6px;">Seller: ${sellerName}</p>` : "";

      card.innerHTML = `
        <div class="wishlist-icon ${inWishlist ? "active" : ""}" role="button" aria-label="Toggle wishlist" title="Wishlist">❤</div>
        <img src="${safeImg}" alt="${safeTitle}">
        <h3>${safeTitle}</h3>
        <p class="muted small" style="margin:0 0 6px;">${safeCategory}</p>
        ${sellerLine}
        <p class="price">₹${safePrice}</p>
      `;

      card.addEventListener("click", () => {
        localStorage.setItem("selectedProductId", String(p._id));
        window.location.href = "product.html";
      });

      const heart = card.querySelector(".wishlist-icon");
      heart.addEventListener("click", async (e) => {
        e.stopPropagation();

        try {
          const response = await api.request(`/wishlist/${p._id}/toggle`, { method: "POST" });
          if (response.inWishlist) {
            wishlistIds.add(String(p._id));
            heart.classList.add("active");
          } else {
            wishlistIds.delete(String(p._id));
            heart.classList.remove("active");
          }
        } catch (error) {
          alert(error.message || "Could not update wishlist");
        }
      });

      grid.appendChild(card);
    });
  }

  async function fetchWishlist() {
    try {
      const response = await api.request("/wishlist");
      wishlistIds = new Set((response.items || []).map((i) => String(i._id)));
    } catch {
      wishlistIds = new Set();
    }
  }

  async function applyFilters() {
    const searchValue = (searchInput?.value || "").trim();
    const categoryValue = categoryFilter?.value || "all";
    const maxPrice = priceFilter?.value ? Number(priceFilter.value) : "";

    try {
      const query = new URLSearchParams({
        q: searchValue,
        category: categoryValue,
        maxPrice: String(maxPrice || "")
      });

      const response = await api.request(`/listings/search?${query.toString()}`);
      products = response.items || [];
      displayProducts(products);
    } catch (error) {
      grid.innerHTML = `<div class="panel" style="grid-column:1/-1;"><p class="muted" style="margin:0;">${error.message || "Failed to load products"}</p></div>`;
    }
  }

  document.querySelectorAll(".category[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (categoryFilter) categoryFilter.value = btn.dataset.category;
      applyFilters();
      window.scrollTo({ top: document.getElementById("featured")?.offsetTop || 0, behavior: "smooth" });
    });
  });

  if (searchInput) searchInput.addEventListener("input", () => applyFilters());
  if (categoryFilter) categoryFilter.addEventListener("change", () => applyFilters());
  if (priceFilter) priceFilter.addEventListener("input", () => applyFilters());

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (categoryFilter) categoryFilter.value = "all";
      if (priceFilter) priceFilter.value = "";
      applyFilters();
    });
  }

  (async () => {
    await fetchWishlist();
    await applyFilters();

    // Update integration/demand context in console only for technical hooks.
    try {
      await api.request("/integrations/context");
      await api.request("/buy-requests/heatmap");
    } catch {
      // Non-critical insights endpoints should not block core browsing.
    }
  })();
})();