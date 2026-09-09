// ─── Site Config (update these when values change) ───────────────────────────
const WHATSAPP_NUMBER = "526681293315"; // wa.me format: country code + number, no "+"
const WHATSAPP_MESSAGE = "Hola, me gustaría ordenar";
// Each form has its own Apps Script project and its own /exec URL, so a change
// to one backend cannot take the other down. Read by careers.html and by the
// promo modal below.
const CAREERS_GAS_URL = "https://script.google.com/macros/s/AKfycbwuVq9wLPrGa2KXZ2tap2gfglf9aSKaQup35p02bUc9qzSHLGVw0w9KlJrHeqOTlz2bRQ/exec";
// The promo project's /exec URL. Public by construction — the modal calls it
// from the browser — so it lives here alongside the careers one. While it is
// empty the modal says registration is unavailable instead of posting nowhere.
const PROMO_GAS_URL = "https://script.google.com/macros/s/AKfycbzbdwUitv0WFMAsH46gFAo-yHKShr9DcS1igdakh-Sfsp-1mFvxVl8tctkKJXcB2j3H/exec";
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

  // Returns the modal to its blank state. Called on open rather than on close
  // so the success message stays readable until the visitor dismisses it, and
  // so reopening always offers a fresh submission.
  function resetModal() {
    promoModal.classList.remove("is-success");
    promoForm.reset();
    restoreSubmitButton();
    clearMessage();
  }

  function openModal() {
    resetModal();
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

    // Format is enforced by the input attributes in index.html: required +
    // type="email" on the address, pattern on the phone. The submit event does
    // not fire at all until the browser is satisfied, so there is nothing left
    // to re-check here.
    //
    // Lowercased so one person submitting "Ana@Gmail.com" and "ana@gmail.com"
    // does not become two rows; Code.gs reduces the phone to bare digits.
    const correo = promoCorreo.value.trim().toLowerCase();
    const telefono = promoTelefono.value.trim();

    if (!PROMO_GAS_URL) {
      showMessage("El registro no está disponible por el momento. Escríbenos por WhatsApp y te agregamos a la lista.", "error");
      return;
    }

    clearMessage();
    promoSubmit.disabled = true;
    promoSubmit.textContent = "Enviando...";

    try {
      // text/plain keeps this a CORS "simple request" (no preflight, which
      // GAS doesn't support); the JSON response is readable because GAS
      // serves Access-Control-Allow-Origin: * on the /exec redirect chain
      const response = await fetch(PROMO_GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ formType: "promo", correo, telefono })
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const result = await response.json();

      if (result.status === "ok") {
        // CSS hides the heading, the body copy and the form, leaving only the
        // confirmation. Reopening the modal clears this via resetModal().
        promoModal.classList.add("is-success");
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
