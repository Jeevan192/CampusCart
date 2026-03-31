(() => {
  const api = window.CampusCartAPI;
  if (!api) return;

  const form = document.getElementById("sellForm");
  if (!form) return;

  const normalizePhone = (raw) => String(raw || "").replace(/\s+/g, " ").trim();

  const user = api.getUser();
  const loggedIn = Boolean(api.getToken());
  const sellerNameInput = document.getElementById("sellerName");
  if (user?.name && sellerNameInput) sellerNameInput.value = user.name;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

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
    const listingType = document.getElementById("listingType")?.value || "sale";
    const rentalPricePerDay = Number(document.getElementById("rentalPricePerDay")?.value || 0);
    const availabilityNote = document.getElementById("availabilityNote")?.value?.trim() || "";

    const price = Number(priceRaw);

    if (!sellerName || sellerContact.length < 6) {
      alert("Please enter valid seller name and contact.");
      return;
    }

    if (!title || !Number.isFinite(price) || price < 0 || !category) {
      alert("Please fill all required fields with valid values.");
      return;
    }

    try {
      await api.request("/listings", {
        method: "POST",
        body: JSON.stringify({
          title,
          price: Math.round(price),
          category,
          image: image || "https://via.placeholder.com/600x400?text=CampusCart",
          sellerContact,
          listingType,
          rentalPricePerDay,
          availabilityNote
        })
      });

      // Keep demand engine warm with inferred intent when users list items.
      await api.request("/buy-requests", {
        method: "POST",
        body: JSON.stringify({
          title,
          category,
          maxBudget: Math.round(price),
          department: "General",
          semester: "Any"
        })
      });

      alert("Product added successfully!");
      window.location.href = "index.html";
    } catch (error) {
      alert(error.message || "Could not add product");
    }
  });
})();