(() => {
  const container = document.getElementById("productDetail");
  if (!container) return;

  const safeJSON = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const product = safeJSON(localStorage.getItem("selectedProduct"), null);

  if (!product) {
    container.innerHTML = `<div class="panel" style="width:100%;"><p class="muted" style="margin:0;">Product not found</p></div>`;
    return;
  }

  const title = product.title || "Untitled";
  const category = product.category || "Others";
  const price = Number.isFinite(Number(product.price)) ? Number(product.price) : 0;
  const image = product.image || "https://via.placeholder.com/600x400?text=CampusCart";

  // Seller info (new)
  const sellerName = product.seller?.name || "Not provided";
  const sellerContact = product.seller?.contact || "Not provided";
  const sellerEmail = product.seller?.email || product.owner || "";

  container.innerHTML = `
    <div class="product-image">
      <img src="${image}" alt="${title}">
    </div>

    <div class="product-info">
      <h2>${title}</h2>
      <p class="price">₹${price}</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Condition:</strong> Used</p>
      <p class="muted">This item is available for campus students.</p>

      <div class="seller-box">
        <h4>Seller Information</h4>
        <div class="seller-row">
          <span class="seller-pill">👤 ${sellerName}</span>
          <span class="seller-pill">📞 ${sellerContact}</span>
          ${sellerEmail ? `<span class="seller-pill">✉️ ${sellerEmail}</span>` : ``}
        </div>
      </div>

      <button class="btn btn-primary contact-btn" id="contactSellerBtn" type="button">Copy Contact</button>
      <p class="muted small" id="contactHint" style="margin:10px 0 0;"></p>
    </div>
  `;

  const btn = document.getElementById("contactSellerBtn");
  const hint = document.getElementById("contactHint");

  btn.addEventListener("click", async () => {
    const contactText = `Seller: ${sellerName}\nContact: ${sellerContact}${sellerEmail ? `\nEmail: ${sellerEmail}` : ""}`;
    try {
      await navigator.clipboard.writeText(contactText);
      hint.textContent = "Seller contact copied to clipboard.";
    } catch {
      hint.textContent = contactText; // fallback display
    }
  });
})();