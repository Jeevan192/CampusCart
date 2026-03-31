(() => {
  const api = window.CampusCartAPI;
  if (!api) return;

  const container = document.getElementById("productDetail");
  if (!container) return;
  const render = ({ item, fairPrice, risk }) => {
    const title = item.title || "Untitled";
    const category = item.category || "Others";
    const price = Number.isFinite(Number(item.price)) ? Number(item.price) : 0;
    const image = item.image || "https://via.placeholder.com/600x400?text=CampusCart";
    const sellerName = item.seller?.name || "Not provided";
    const sellerEmail = item.seller?.email || "";
    const sellerContact = item.sellerContact || "Not provided";
    const typeNote = item.listingType === "rent" ? `Rent • ₹${Number(item.rentalPricePerDay || 0)}/day` : "Sale";

    container.innerHTML = `
    <div class="product-image">
      <img src="${image}" alt="${title}">
    </div>

    <div class="product-info">
      <h2>${title}</h2>
      <p class="price">₹${price}</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Type:</strong> ${typeNote}</p>
      <p><strong>Condition:</strong> Used</p>
      <p class="muted">This item is available for campus students.</p>
      <p class="muted small">Fair Price Estimate: ${fairPrice ? `₹${fairPrice}` : "Not enough data"}</p>
      <p class="muted small">Risk Score: ${Number(risk || 0)}/100</p>

      <div class="seller-box">
        <h4>Seller Information</h4>
        <div class="seller-row">
          <span class="seller-pill">👤 ${sellerName}</span>
          <span class="seller-pill">📞 ${sellerContact}</span>
          ${sellerEmail ? `<span class="seller-pill">✉️ ${sellerEmail}</span>` : ``}
        </div>
      </div>

      <button class="btn btn-primary contact-btn" id="contactSellerBtn" type="button">Copy Contact</button>
      <button class="btn btn-secondary" id="startEscrowBtn" type="button">Start Safe Escrow</button>
      <button class="btn btn-ghost" id="confirmEscrowBtn" type="button">Confirm Pickup OTP</button>
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
        hint.textContent = contactText;
      }
    });

    document.getElementById("startEscrowBtn")?.addEventListener("click", async () => {
      try {
        const response = await api.request("/transactions/start", {
          method: "POST",
          body: JSON.stringify({ listingId: item._id })
        });
        hint.textContent = `Escrow started. OTP: ${response.otp} (for demo/testing)`;
        localStorage.setItem("activeTransactionId", String(response.transactionId));
      } catch (error) {
        hint.textContent = error.message || "Could not start escrow";
      }
    });

    document.getElementById("confirmEscrowBtn")?.addEventListener("click", async () => {
      const txId = localStorage.getItem("activeTransactionId") || "";
      if (!txId) {
        hint.textContent = "Start escrow first.";
        return;
      }

      const otp = prompt("Enter pickup OTP");
      if (!otp) return;

      try {
        const response = await api.request(`/transactions/${txId}/confirm`, {
          method: "POST",
          body: JSON.stringify({ otp })
        });
        hint.textContent = response.message || "Escrow completed.";
      } catch (error) {
        hint.textContent = error.message || "OTP confirmation failed";
      }
    });
  };

  (async () => {
    const productId = localStorage.getItem("selectedProductId");
    if (!productId) {
      container.innerHTML = `<div class="panel" style="width:100%;"><p class="muted" style="margin:0;">Product not found</p></div>`;
      return;
    }

    try {
      const detail = await api.request(`/listings/${productId}`);
      const fair = await api.request(`/insights/fair-price?category=${encodeURIComponent(detail.item.category)}&title=${encodeURIComponent(detail.item.title)}`);
      const risk = await api.request(`/risk/listing/${productId}`);

      render({
        item: detail.item,
        fairPrice: fair.fairPrice,
        risk: risk.listingRiskScore
      });
    } catch (error) {
      container.innerHTML = `<div class="panel" style="width:100%;"><p class="muted" style="margin:0;">${error.message || "Product not found"}</p></div>`;
    }
  })();
})();