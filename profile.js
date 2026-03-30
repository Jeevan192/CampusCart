(() => {
  const grid = document.getElementById("myListings");
  const meta = document.getElementById("profileMeta");

  const safeJSON = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const user = safeJSON(localStorage.getItem("user"), null);
  const loggedIn = localStorage.getItem("loggedIn") === "true";

  // Redirect if not logged in
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
      localStorage.removeItem("loggedIn");
      alert("Logged out!");
      window.location.href = "login.html";
    });
  }

  // Get only user's products
  let allProducts = safeJSON(localStorage.getItem("products"), []);
  let products = allProducts.filter((p) => p.owner === user.email);

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

      card.innerHTML = `
        <img src="${image}" alt="${title}">
        <h3>${title}</h3>
        <p class="muted small" style="margin:0 0 6px;">${category}</p>
        <p class="price">₹${price}</p>
        <button class="delete-btn" type="button">Delete</button>
      `;

      card.addEventListener("click", () => {
        localStorage.setItem("selectedProduct", JSON.stringify(p));
        window.location.href = "product.html";
      });

      card.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();

        const confirmDelete = confirm("Are you sure you want to delete this product?");
        if (!confirmDelete) return;

        // Remove by stable key (owner + title + price + category)
        allProducts = allProducts.filter((item) => {
          return !(
            item.owner === p.owner &&
            item.title === p.title &&
            Number(item.price) === Number(p.price) &&
            item.category === p.category
          );
        });

        localStorage.setItem("products", JSON.stringify(allProducts));
        products = allProducts.filter((item) => item.owner === user.email);
        displayProducts();
      });

      grid.appendChild(card);
    });
  }

  displayProducts();
})();