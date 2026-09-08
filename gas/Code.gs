/**
 * Itadakimasu — promo signup backend (Google Apps Script)
 *
 * Standalone project. This is the ENTIRE script: paste it into a new, empty
 * Apps Script project and deploy it as a web app. It is deliberately NOT part
 * of the "Itadakimasu Careers Form" project — the careers deployment and its
 * /exec URL are untouched by anything here.
 *
 * Backs the "¡Regístrate para promociones!" modal on index.html, which posts
 * {formType:'promo', correo, telefono} and reads back {status:'ok'}.
 *
 * No spreadsheet ID lives in this repo. It is read at runtime from a Script
 * Property set by hand under Project Settings > Script Properties:
 *
 *   PROMO_SPREADSHEET_ID  required  the promo spreadsheet's ID, the part of its
 *                                   URL between /d/ and /edit
 *   PROMO_SHEET_NAME      optional  tab to append to; defaults to 'principal'
 *
 * Deploy > Manage deployments > edit the existing deployment > New version.
 * Saving the editor changes nothing; the /exec URL survives a new version but
 * a "New deployment" mints a different one the site does not call.
 */

/** Script Property holding the promo spreadsheet ID. Required. */
var PROMO_SHEET_ID_PROPERTY = 'PROMO_SPREADSHEET_ID';

/** Script Property naming the target tab. Optional; overrides PROMO_SHEET_NAME_DEFAULT. */
var PROMO_SHEET_NAME_PROPERTY = 'PROMO_SHEET_NAME';

/** The tab promo rows live in. Named rather than positional on purpose. */
var PROMO_SHEET_NAME_DEFAULT = 'principal';

/**
 * Health check. Visiting the /exec URL in a browser confirms the deployment is
 * live and which project answered, without writing anything.
 */
function doGet() {
  return jsonOutput_({ status: 'ok', message: 'Itadakimasu promo endpoint is live' });
}

/**
 * Web app entry point. The frontend posts as text/plain to keep the request a
 * CORS "simple request" — Apps Script does not answer preflight — so the body
 * arrives as a raw JSON string rather than a parsed form.
 */
function doPost(e) {
  var data;

  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOutput_({ status: 'error', message: 'Solicitud inválida.' });
  }

  // The discriminator is kept even though this project serves one form: it
  // makes a misdirected careers payload fail loudly instead of appending a
  // half-empty row to the promo sheet.
  if (!data || data.formType !== 'promo') {
    return jsonOutput_({ status: 'error', message: 'Tipo de formulario no reconocido.' });
  }

  return handlePromoSubmission(data);
}

/**
 * Appends to columns A-C: Submission Date, Correo electrónico, Número de
 * teléfono.
 *
 * `correo` is required. `telefono` is optional and is written as an empty cell
 * when omitted, so column C stays aligned.
 *
 * @param {Object} data Parsed request body.
 * @return {TextOutput} JSON response the frontend understands.
 */
function handlePromoSubmission(data) {
  var correo = (data.correo ? String(data.correo) : '').trim();
  // Column C holds bare digits (Sheets stores them as numbers), so drop the
  // separators a visitor may type into the "Ej. 668 123 4567" placeholder
  var telefono = (data.telefono ? String(data.telefono) : '').replace(/\D/g, '');

  if (!correo) {
    return jsonOutput_({ status: 'error', message: 'El correo electrónico es requerido.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return jsonOutput_({ status: 'error', message: 'El correo electrónico no es válido.' });
  }

  // Bounds a pasted blob or a value long enough to be a payload rather than a
  // contact detail; the endpoint is public and unauthenticated
  if (correo.length > 254 || telefono.length > 20) {
    return jsonOutput_({ status: 'error', message: 'Los datos enviados no son válidos.' });
  }

  try {
    var sheet = getPromoSheet_();

    // Matches the "2026-01-04 22:46:41" text already in column A
    var formattedDate = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm:ss'
    );

    // The endpoint is public and unauthenticated, so two submissions can land in
    // the same instant. getLastRow()+setValues is not atomic the way appendRow
    // is, so serialise it or the second write silently overwrites the first.
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      return jsonOutput_({ status: 'error', message: 'No se pudo guardar el registro.' });
    }

    try {
      var row = sheet.getLastRow() + 1;

      // Column A is plain text, not datetimes — a bare appendRow would let
      // Sheets parse the string into a date value and the new row would sort
      // and display unlike every row above it. Format before writing: applying
      // '@' afterwards would just reveal the serial number.
      sheet.getRange(row, 1).setNumberFormat('@');
      sheet.getRange(row, 1, 1, 3).setValues([[formattedDate, correo, telefono]]);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    return jsonOutput_({ status: 'ok' });
  } catch (err) {
    // Logged to Executions so a misconfigured property is diagnosable, while
    // the visitor only sees a generic failure
    console.error('Promo signup failed: ' + err);
    return jsonOutput_({ status: 'error', message: 'No se pudo guardar el registro.' });
  }
}

/**
 * Resolves the promo sheet. The spreadsheet ID comes from a Script Property;
 * the tab is looked up by name. Throws with an actionable message rather than
 * failing deep inside SpreadsheetApp or writing to the wrong tab.
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
  var sheetName = props.getProperty(PROMO_SHEET_NAME_PROPERTY) || PROMO_SHEET_NAME_DEFAULT;
  var sheet = spreadsheet.getSheetByName(sheetName);

  // Deliberately no fall back to the first tab: a renamed or reordered tab
  // should fail loudly here rather than quietly divert signups somewhere else
  if (!sheet) {
    throw new Error(
      'Tab "' + sheetName + '" not found. Rename it back, or set Script Property "' +
      PROMO_SHEET_NAME_PROPERTY + '" to the new name.'
    );
  }

  return sheet;
}

/** JSON response helper. */
function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this once from the editor (Run > testPromoSubmission) to trigger the
 * authorization prompt and verify the Script Property, the spreadsheet
 * permission and the column layout before deploying. It writes one real row —
 * delete it afterwards.
 */
function testPromoSubmission() {
  var result = handlePromoSubmission({
    formType: 'promo',
    correo: 'prueba@ejemplo.com',
    telefono: '6681234567'
  });
  console.log(result.getContent());
}
