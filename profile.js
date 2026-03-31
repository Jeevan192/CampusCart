(() => {
  const api = window.CampusCartAPI;
  if (!api) return;

  const grid = document.getElementById("myListings");
  const meta = document.getElementById("profileMeta");

  const user = api.getUser();
  const loggedIn = Boolean(api.getToken());

  if (!user || !loggedIn) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  if (meta) meta.textContent = `${user.name} • ${user.email}`;

  // Logout button for this page too
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      api.clearSession();
      alert("Logged out!");
      window.location.href = "login.html";
    });
  }

  let products = [];

  function displayProducts() {
    if (!grid) return;
    grid.innerHTML = "";

    if (!products || products.length === 0) {
      grid.innerHTML = `<div class="panel" style="grid-column:1/-1;"><p class="muted" style="margin:0;">No products added yet</p></div>`;
      return;
    }

    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";

      const title = p.title || "Untitled";
      const price = Number.isFinite(Number(p.price)) ? Number(p.price) : 0;
      const image = p.image || "https://via.placeholder.com/600x400?text=CampusCart";
      const category = p.category || "Others";
      const typeMeta = p.listingType === "rent" ? `Rent • ₹${Number(p.rentalPricePerDay || 0)}/day` : "Sale";

      card.innerHTML = `
        <img src="${image}" alt="${title}">
        <h3>${title}</h3>
        <p class="muted small" style="margin:0 0 6px;">${category}</p>
        <p class="muted small" style="margin:0 0 6px;">${typeMeta}</p>
        <p class="price">₹${price}</p>
        <button class="delete-btn" type="button">Delete</button>
      `;

      card.addEventListener("click", () => {
        localStorage.setItem("selectedProductId", String(p._id));
        window.location.href = "product.html";
      });

      card.querySelector(".delete-btn").addEventListener("click", async (e) => {
        e.stopPropagation();

        const confirmDelete = confirm("Are you sure you want to delete this product?");
        if (!confirmDelete) return;

        try {
          await api.request(`/listings/${p._id}`, { method: "DELETE" });
          products = products.filter((x) => String(x._id) !== String(p._id));
          displayProducts();
        } catch (error) {
          alert(error.message || "Failed to delete listing");
        }
      });

      grid.appendChild(card);
    });
  }

  (async () => {
    try {
      const response = await api.request("/listings/mine");
      products = response.items || [];
      displayProducts();
    } catch (error) {
      if (grid) {
        grid.innerHTML = `<div class="panel" style="grid-column:1/-1;"><p class="muted" style="margin:0;">${error.message || "Could not load listings"}</p></div>`;
      }
    }
  })();
})();