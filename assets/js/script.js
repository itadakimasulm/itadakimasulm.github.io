// ─── Site Config (update these when values change) ───────────────────────────
const WHATSAPP_NUMBER = "+526681293315";
const WHATSAPP_MESSAGE = "Hola, me gustaria ordenar";
// ─────────────────────────────────────────────────────────────────────────────

// clarity + local script in one file
(function(c, l, a, r, i, t, y) {
  c[a] =
    c[a] ||
    function() {
      (c[a].q = c[a].q || []).push(arguments);
    };
  t = l.createElement(r);
  t.async = 1;
  t.src = "https://www.clarity.ms/tag/" + i;
  y = l.getElementsByTagName(r)[0];
  y.parentNode.insertBefore(t, y);
})(window, document, "clarity", "script", "tvskmotj4t");

// DOM-ready wrapper to ensure elements are present
function initModalHandlers() {
  const popupForm = document.getElementById("popupForm");
  const modalOverlay = document.getElementById("modalOverlay");
  const registrateButton = document.getElementById("registrateButton");
  const whatsappLink = document.getElementById("whatsappLink");
  const whatsappSocial = document.getElementById("whatsappSocial");

  // Set both WhatsApp links dynamically from config
  if (whatsappLink) {
    whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  }
  if (whatsappSocial) {
    whatsappSocial.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  }

  // If modal elements aren't on the page, bail quietly
  if (!popupForm || !modalOverlay || !registrateButton) return;

  registrateButton.addEventListener("click", function(event) {
    event.preventDefault();
    modalOverlay.style.display = "block";
    popupForm.style.display = "block";
    document.body.classList.add("modal-open");    // lock background scroll
  });

  modalOverlay.addEventListener("click", function() {
    modalOverlay.style.display = "none";
    popupForm.style.display = "none";
    document.body.classList.remove("modal-open"); // restore background scroll
  });
}

// Prefer DOMContentLoaded so script can be placed in head or loaded async
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initModalHandlers);
} else {
  initModalHandlers();
}
