(() => {
  const CURRENT_PAGE = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const AUTH_PAGES = new Set(["login.html", "signup.html"]);

  // ========= Helpers =========
  const safeJSON = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const isLoggedIn = () => localStorage.getItem("loggedIn") === "true";
  const getUser = () => safeJSON(localStorage.getItem("user"), null);

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
      localStorage.removeItem("loggedIn");
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

  const user = getUser();

  const defaultProducts = [
    { title: "Engineering Drawing Apron", price: 150, category: "Aprons", image: "https://via.placeholder.com/600x400?text=Apron" },
    { title: "1st Year Physics Notes", price: 100, category: "Notes", image: "https://via.placeholder.com/600x400?text=Notes" },
    { title: "Calculator (Casio)", price: 300, category: "Stationery", image: "https://via.placeholder.com/600x400?text=Calculator" },
    { title: "Workshop Tools Kit", price: 250, category: "Others", image: "https://via.placeholder.com/600x400?text=Tools" }
  ];

  const storedProducts = safeJSON(localStorage.getItem("products"), []);
  const allProducts = [...defaultProducts, ...storedProducts];

  // Hide user's own products on index
  const products = allProducts.filter((p) => {
    if (!user) return true;
    return !p.owner || p.owner !== user.email;
  });

  const getWishlist = () => safeJSON(localStorage.getItem("wishlist"), []);
  const setWishlist = (items) => localStorage.setItem("wishlist", JSON.stringify(items));

  const normalizeTitleKey = (p) => String(p?.title || "").trim().toLowerCase();

  function displayProducts(items) {
    grid.innerHTML = "";

    if (!items || items.length === 0) {
      grid.innerHTML = `<div class="panel" style="grid-column:1/-1;"><p class="muted" style="margin:0;">No products found</p></div>`;
      return;
    }

    const wishlist = getWishlist();
    const wishlistKeys = new Set(wishlist.map(normalizeTitleKey));

    items.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";
      const inWishlist = wishlistKeys.has(normalizeTitleKey(p));

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
        localStorage.setItem("selectedProduct", JSON.stringify({
          title: safeTitle,
          price: safePrice,
          category: safeCategory,
          image: safeImg,
          owner: p.owner || null,
          seller: p.seller || null
        }));
        window.location.href = "product.html";
      });

      const heart = card.querySelector(".wishlist-icon");
      heart.addEventListener("click", (e) => {
        e.stopPropagation();

        let wishlist = getWishlist();
        const key = normalizeTitleKey(p);

        const exists = wishlist.some((item) => normalizeTitleKey(item) === key);
        if (exists) {
          wishlist = wishlist.filter((item) => normalizeTitleKey(item) !== key);
          heart.classList.remove("active");
        } else {
          wishlist.push({
            title: safeTitle,
            price: safePrice,
            category: safeCategory,
            image: safeImg,
            owner: p.owner || null,
            seller: p.seller || null
          });
          heart.classList.add("active");
        }
        setWishlist(wishlist);
      });

      grid.appendChild(card);
    });
  }

  function applyFilters() {
    const searchValue = (searchInput?.value || "").toLowerCase().trim();
    const categoryValue = categoryFilter?.value || "all";
    const maxPrice = priceFilter?.value ? Number(priceFilter.value) : null;

    const filtered = products.filter((p) => {
      const title = String(p.title || "").toLowerCase();
      const sellerName = String(p.seller?.name || "").toLowerCase();

      const matchSearch = title.includes(searchValue) || sellerName.includes(searchValue);
      const matchCategory = categoryValue === "all" || p.category === categoryValue;

      const priceNum = Number(p.price);
      const matchPrice = maxPrice === null || (Number.isFinite(priceNum) && priceNum <= maxPrice);

      return matchSearch && matchCategory && matchPrice;
    });

    displayProducts(filtered);
  }

  document.querySelectorAll(".category[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (categoryFilter) categoryFilter.value = btn.dataset.category;
      applyFilters();
      window.scrollTo({ top: document.getElementById("featured")?.offsetTop || 0, behavior: "smooth" });
    });
  });

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
  if (priceFilter) priceFilter.addEventListener("input", applyFilters);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (categoryFilter) categoryFilter.value = "all";
      if (priceFilter) priceFilter.value = "";
      applyFilters();
    });
  }

  displayProducts(products);
})();