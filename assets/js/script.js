// ─── Site Config (update these when values change) ───────────────────────────
const WHATSAPP_NUMBER = "526681293315"; // wa.me format: country code + number, no "+"
const WHATSAPP_MESSAGE = "Hola, me gustaría ordenar";
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
})(window, document, "clarity", "script", "twhjkyhexc");

// DOM-ready wrapper to ensure elements are present
function initModalHandlers() {
  const popupForm = document.getElementById("popupForm");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalClose = document.getElementById("modalClose");
  const registrateButton = document.getElementById("registrateButton");
  const whatsappLink = document.getElementById("whatsappLink");

  if (whatsappLink) {
    whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  }

  // If modal elements aren't on the page, bail quietly
  if (!popupForm || !modalOverlay || !registrateButton) return;

  // Saved so closing the modal can restore the scroll position that
  // body{position:fixed} (the iOS scroll lock) would otherwise reset to 0
  let savedScrollY = 0;

  function openModal() {
    savedScrollY = window.scrollY;
    document.body.style.top = `-${savedScrollY}px`;
    document.body.classList.add("modal-open");
    modalOverlay.style.display = "block";
    popupForm.style.display = "block";
    if (modalClose) {
      modalClose.style.display = "block";
      modalClose.focus();
    }

    // If the Weavely embed never loaded (CDN down, blocked), the container
    // is empty — show a fallback instead of a blank white box. Delayed so a
    // lazy render still wins.
    setTimeout(function() {
      if (popupForm.style.display === "block" && popupForm.childElementCount === 0) {
        popupForm.innerHTML =
          '<p class="popup-fallback">No se pudo cargar el formulario de registro. ' +
          'Recarga la página e intenta de nuevo, o escríbenos por WhatsApp para recibir promociones.</p>';
      }
    }, 1500);
  }

  function closeModal() {
    modalOverlay.style.display = "none";
    popupForm.style.display = "none";
    if (modalClose) modalClose.style.display = "none";
    document.body.classList.remove("modal-open");
    document.body.style.top = "";
    window.scrollTo(0, savedScrollY);
    registrateButton.focus();
  }

  registrateButton.addEventListener("click", function(event) {
    event.preventDefault();
    openModal();
  });

  modalOverlay.addEventListener("click", closeModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);

  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && modalOverlay.style.display === "block") {
      closeModal();
    }
  });
}

// Prefer DOMContentLoaded so script can be placed in head or loaded async
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initModalHandlers);
} else {
  initModalHandlers();
}
