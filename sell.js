(() => {
  const form = document.getElementById("sellForm");
  if (!form) return;

  const safeJSON = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const normalizePhone = (raw) => String(raw || "").replace(/\s+/g, " ").trim();

  // Pre-fill seller fields from signed-in user (if available)
  const user = safeJSON(localStorage.getItem("user"), null);
  const loggedIn = localStorage.getItem("loggedIn") === "true";
  const sellerNameInput = document.getElementById("sellerName");
  if (user?.name && sellerNameInput) sellerNameInput.value = user.name;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const user = safeJSON(localStorage.getItem("user"), null);
    const loggedIn = localStorage.getItem("loggedIn") === "true";

    if (!user || !loggedIn) {
      alert("Please login first!");
      window.location.href = "login.html";
      return;
    }

    const sellerName = document.getElementById("sellerName")?.value?.trim();
    const sellerContact = normalizePhone(document.getElementById("sellerContact")?.value);

    const title = document.getElementById("title")?.value?.trim();
    const priceRaw = document.getElementById("price")?.value;
    const category = document.getElementById("category")?.value;
    const image = document.getElementById("image")?.value?.trim();

    const price = Number(priceRaw);

    if (!sellerName || sellerContact.length < 6) {
      alert("Please enter valid seller name and contact.");
      return;
    }

    if (!title || !Number.isFinite(price) || price < 0 || !category) {
      alert("Please fill all required fields with valid values.");
      return;
    }

    const newProduct = {
      title,
      price: Math.round(price),
      category,
      image: image || "https://via.placeholder.com/600x400?text=CampusCart",
      owner: user.email,

      // Seller info (shown to buyers)
      seller: {
        name: sellerName,
        contact: sellerContact,
        email: user.email
      }
    };

    const storedProducts = safeJSON(localStorage.getItem("products"), []);
    storedProducts.push(newProduct);
    localStorage.setItem("products", JSON.stringify(storedProducts));

    alert("Product added successfully!");
    window.location.href = "index.html";
  });
})();