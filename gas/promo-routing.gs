/**
 * Itadakimasu — Apps Script `doPost` routing (project: "Itadakimasu Careers Form")
 *
 * The live source lives in the Apps Script editor, not in this repo. This file is
 * the reference copy of the promo branch so the routing is reviewable in git.
 *
 * HOW TO APPLY
 *   1. Open the "Itadakimasu Careers Form" Apps Script project.
 *   2. Paste PROMO_SPREADSHEET_ID, handlePromoSubmission() and promoJsonOutput()
 *      at the top of the script file. If the careers code already has a
 *      JSON-response helper, use that one and delete promoJsonOutput().
 *   3. In doPost(), right after the request body is parsed into `data`, insert:
 *
 *          if (data.formType === 'promo') {
 *            return handlePromoSubmission(data);
 *          }
 *
 *      Everything below that line — the careers path — stays unchanged. Careers
 *      submissions send no `formType`, so they fall through to it as before.
 *   4. Deploy > Manage deployments > edit the existing deployment > New version.
 *      The /exec URL stays the same; without a new version the change is not live.
 *
 * The promo branch has no Turnstile check and no Drive folder lookup — the
 * spreadsheet is opened by ID directly.
 */

var PROMO_SPREADSHEET_ID = '1D9dV9KPK4lpGb3yl1O6ZhdNl22xc8SDrfL3P_aIKzb0';

/**
 * Promo signup: appends [Submission Date, Correo, Teléfono] to columns A–C of
 * the first sheet. `correo` is required; `telefono` is optional and is written
 * as an empty cell when it is missing.
 */
function handlePromoSubmission(data) {
  var correo = (data.correo || '').toString().trim();
  var telefono = (data.telefono || '').toString().trim();

  if (!correo) {
    return promoJsonOutput({ status: 'error', message: 'El correo electrónico es requerido.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return promoJsonOutput({ status: 'error', message: 'El correo electrónico no es válido.' });
  }

  try {
    var sheet = SpreadsheetApp.openById(PROMO_SPREADSHEET_ID).getSheets()[0];

    // Matches the existing "2026-02-27 00:33:09" text format already in column A
    var formattedDate = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm:ss'
    );

    sheet.appendRow([formattedDate, correo, telefono]);

    return promoJsonOutput({ status: 'ok' });
  } catch (err) {
    return promoJsonOutput({ status: 'error', message: 'No se pudo guardar el registro.' });
  }
}

function promoJsonOutput(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
