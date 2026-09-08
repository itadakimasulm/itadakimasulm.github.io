/**
 * Itadakimasu — promo signup handler (Google Apps Script)
 *
 * Self-contained module for the "¡Regístrate para promociones!" modal on
 * index.html. Paste this whole file into the existing Apps Script project as a
 * NEW script file (File > New > Script file, name it `promo`), then wire the
 * two-line route into the existing doPost — see gas/README.md.
 *
 * It deliberately defines NO doPost and NO doGet, so it cannot collide with the
 * entry points the careers form already relies on.
 *
 * No spreadsheet ID lives in this repo. The ID is read at runtime from a Script
 * Property you set by hand in the Apps Script UI (Project Settings > Script
 * Properties). See gas/README.md for the key name.
 */

/** Script Property holding the promo spreadsheet ID. */
var PROMO_SHEET_ID_PROPERTY = 'PROMO_SPREADSHEET_ID';

/** Optional Script Property naming the target tab; defaults to the first sheet. */
var PROMO_SHEET_NAME_PROPERTY = 'PROMO_SHEET_NAME';

/**
 * Handles a promo signup posted as {formType:'promo', correo, telefono}.
 * Appends [Submission Date, Correo, Teléfono] to columns A-C.
 *
 * `correo` is required. `telefono` is optional and is written as an empty cell
 * when omitted, so column C stays aligned.
 *
 * @param {Object} data Parsed request body.
 * @return {TextOutput} JSON response the frontend understands.
 */
function handlePromoSubmission(data) {
  var correo = (data && data.correo ? String(data.correo) : '').trim();
  var telefono = (data && data.telefono ? String(data.telefono) : '').trim();

  if (!correo) {
    return promoJsonOutput_({ status: 'error', message: 'El correo electrónico es requerido.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return promoJsonOutput_({ status: 'error', message: 'El correo electrónico no es válido.' });
  }

  // Guard against a paste of the whole sheet into one field, and against a
  // value long enough to be a payload rather than a phone number
  if (correo.length > 254 || telefono.length > 40) {
    return promoJsonOutput_({ status: 'error', message: 'Los datos enviados no son válidos.' });
  }

  try {
    var sheet = getPromoSheet_();

    // Matches the "2026-02-27 00:33:09" text already in column A
    var formattedDate = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm:ss'
    );

    sheet.appendRow([formattedDate, correo, telefono]);

    return promoJsonOutput_({ status: 'ok' });
  } catch (err) {
    // Surfaced in Executions so a misconfigured property is diagnosable, while
    // the visitor only sees a generic failure
    console.error('Promo signup failed: ' + err);
    return promoJsonOutput_({ status: 'error', message: 'No se pudo guardar el registro.' });
  }
}

/**
 * Resolves the promo sheet from Script Properties. Throws with an actionable
 * message when the property is missing, rather than failing deep inside
 * SpreadsheetApp.
 *
 * @return {Sheet} The sheet promo rows are appended to.
 */
function getPromoSheet_() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty(PROMO_SHEET_ID_PROPERTY);

  if (!spreadsheetId) {
    throw new Error(
      'Missing Script Property "' + PROMO_SHEET_ID_PROPERTY + '". ' +
      'Set it in Project Settings > Script Properties.'
    );
  }

  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheetName = props.getProperty(PROMO_SHEET_NAME_PROPERTY);
  var sheet = sheetName ? spreadsheet.getSheetByName(sheetName) : spreadsheet.getSheets()[0];

  if (!sheet) {
    throw new Error('Promo sheet "' + sheetName + '" not found in the spreadsheet.');
  }

  return sheet;
}

/**
 * JSON response helper. Named with a trailing underscore and a promo prefix so
 * it cannot clash with a helper the careers code already defines.
 */
function promoJsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this once from the editor (Run > testPromoSubmission) to verify the
 * Script Property, the spreadsheet permission and the column layout before
 * touching doPost. It writes one real row — delete it afterwards.
 */
function testPromoSubmission() {
  var result = handlePromoSubmission({
    formType: 'promo',
    correo: 'prueba@ejemplo.com',
    telefono: '6681234567'
  });
  console.log(result.getContent());
}
