(() => {
  const api = window.CampusCartAPI;
  if (!api) return;

  const grid = document.getElementById("wishlistGrid");
  if (!grid) return;

  const render = (items) => {
    grid.innerHTML = "";

    if (!items || items.length === 0) {
      grid.innerHTML = `<div class="panel" style="grid-column:1/-1;"><p class="muted" style="margin:0;">No items in wishlist</p></div>`;
      return;
    }

    items.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    const title = p.title || "Untitled";
    const category = p.category || "Others";
    const price = Number.isFinite(Number(p.price)) ? Number(p.price) : 0;
    const image = p.image || "https://via.placeholder.com/600x400?text=CampusCart";

    card.innerHTML = `
      <img src="${image}" alt="${title}">
      <h3>${title}</h3>
      <p class="muted small" style="margin:0 0 6px;">${category}</p>
      <p class="price">₹${price}</p>
      <button class="delete-btn" type="button">Remove</button>
    `;

      card.addEventListener("click", () => {
      localStorage.setItem("selectedProductId", String(p._id));
      window.location.href = "product.html";
    });

      card.querySelector(".delete-btn").addEventListener("click", async (e) => {
      e.stopPropagation();

        try {
          await api.request(`/wishlist/${p._id}/toggle`, { method: "POST" });
          const next = items.filter((x) => String(x._id) !== String(p._id));
          render(next);
        } catch (error) {
          alert(error.message || "Could not update wishlist");
        }
      }
    );

      grid.appendChild(card);
    });
  };

  (async () => {
    try {
      const response = await api.request("/wishlist");
      render(response.items || []);
    } catch (error) {
      grid.innerHTML = `<div class="panel" style="grid-column:1/-1;"><p class="muted" style="margin:0;">${error.message || "Could not load wishlist"}</p></div>`;
    }
  })();
})();