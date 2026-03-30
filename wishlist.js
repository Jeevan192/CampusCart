(() => {
  const grid = document.getElementById("wishlistGrid");
  if (!grid) return;

  const safeJSON = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const wishlist = safeJSON(localStorage.getItem("wishlist"), []);
  grid.innerHTML = "";

  if (!wishlist || wishlist.length === 0) {
    grid.innerHTML = `<div class="panel" style="grid-column:1/-1;"><p class="muted" style="margin:0;">No items in wishlist</p></div>`;
    return;
  }

  wishlist.forEach((p) => {
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
      localStorage.setItem("selectedProduct", JSON.stringify(p));
      window.location.href = "product.html";
    });

    card.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();

      const key = String(p.title || "").trim().toLowerCase();
      let updated = wishlist.filter((x) => String(x.title || "").trim().toLowerCase() !== key);
      localStorage.setItem("wishlist", JSON.stringify(updated));
      card.remove();

      if (updated.length === 0) {
        grid.innerHTML = `<div class="panel" style="grid-column:1/-1;"><p class="muted" style="margin:0;">No items in wishlist</p></div>`;
      }
    });

    grid.appendChild(card);
  });
})();