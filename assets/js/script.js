// ─── Site Config (update these when values change) ───────────────────────────
const WHATSAPP_NUMBER = "526681293315"; // wa.me format: country code + number, no "+"
const WHATSAPP_MESSAGE = "Hola, me gustaría ordenar";
// Single Apps Script deployment behind both forms; the `formType` field in the
// payload picks the branch in doPost (careers = default, promo = 'promo')
const GAS_URL = "https://script.google.com/macros/s/AKfycbwuVq9wLPrGa2KXZ2tap2gfglf9aSKaQup35p02bUc9qzSHLGVw0w9KlJrHeqOTlz2bRQ/exec";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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
  const promoModal = document.getElementById("promoModal");
  const modalOverlay = document.getElementById("modalOverlay");
  const promoClose = document.getElementById("promoClose");
  const registrateButton = document.getElementById("registrateButton");
  const whatsappLink = document.getElementById("whatsappLink");

  if (whatsappLink) {
    whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  }

  // If modal elements aren't on the page (careers.html), bail quietly
  if (!promoModal || !modalOverlay || !registrateButton) return;

  const promoForm = document.getElementById("promoForm");
  const promoSubmit = document.getElementById("promoSubmit");
  const promoMessage = document.getElementById("promoMessage");
  const promoCorreo = document.getElementById("promoCorreo");
  const promoTelefono = document.getElementById("promoTelefono");

  // Saved so closing the modal can restore the scroll position that
  // body{position:fixed} (the iOS scroll lock) would otherwise reset to 0
  let savedScrollY = 0;

  function showMessage(text, type) {
    promoMessage.textContent = text;
    promoMessage.className = "form-message " + type;
  }

  function clearMessage() {
    promoMessage.textContent = "";
    promoMessage.className = "form-message";
  }

  function openModal() {
    savedScrollY = window.scrollY;
    document.body.style.top = `-${savedScrollY}px`;
    document.body.classList.add("modal-open");
    modalOverlay.classList.add("is-open");
    promoModal.classList.add("is-open");
    promoCorreo.focus();
  }

  function closeModal() {
    modalOverlay.classList.remove("is-open");
    promoModal.classList.remove("is-open");
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
  if (promoClose) promoClose.addEventListener("click", closeModal);

  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && promoModal.classList.contains("is-open")) {
      closeModal();
    }
  });

  promoForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const correo = promoCorreo.value.trim();
    const telefono = promoTelefono.value.trim();

    if (!correo) {
      showMessage("Por favor escribe tu correo electrónico.", "error");
      promoCorreo.focus();
      return;
    }

    if (!EMAIL_RE.test(correo)) {
      showMessage("El correo electrónico no parece válido. Revísalo, ej. tucorreo@ejemplo.com.", "error");
      promoCorreo.focus();
      return;
    }

    // Phone is optional, but a value that's there should still look like a number
    if (telefono) {
      const telefonoDigits = telefono.replace(/\D/g, "");
      if (telefonoDigits.length < 8 || telefonoDigits.length > 15) {
        showMessage("El teléfono no parece válido. Escribe un número de 10 dígitos, ej. 668 123 4567.", "error");
        promoTelefono.focus();
        return;
      }
    }

    clearMessage();
    promoSubmit.disabled = true;
    promoSubmit.textContent = "Enviando...";

    try {
      // text/plain keeps this a CORS "simple request" (no preflight, which
      // GAS doesn't support); the JSON response is readable because GAS
      // serves Access-Control-Allow-Origin: * on the /exec redirect chain
      const response = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ formType: "promo", correo, telefono })
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const result = await response.json();

      if (result.status === "ok") {
        promoForm.style.display = "none";
        showMessage("¡Listo! Te avisaremos de nuestras próximas promociones.", "success");
      } else {
        showMessage("No se pudo completar tu registro. Intenta de nuevo o escríbenos a itadakimas.sushi@gmail.com.", "error");
        restoreSubmitButton();
      }
    } catch (err) {
      showMessage("Ocurrió un error al enviar. Revisa tu conexión e intenta de nuevo.", "error");
      restoreSubmitButton();
    }
  });

  function restoreSubmitButton() {
    promoSubmit.disabled = false;
    promoSubmit.textContent = "Enviar";
  }
}

// Prefer DOMContentLoaded so script can be placed in head or loaded async
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initModalHandlers);
} else {
  initModalHandlers();
}
