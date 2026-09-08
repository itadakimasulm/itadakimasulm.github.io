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
 * No spreadsheet ID lives in this repo. The ID is read at runtime from a Script
 * Property set by hand in the Apps Script UI (Project Settings > Script
 * Properties). See gas/README.md.
 */

/** Script Property holding the promo spreadsheet ID. Required. */
var PROMO_SHEET_ID_PROPERTY = 'PROMO_SPREADSHEET_ID';

/** Script Property naming the target tab. Optional; defaults to the first tab. */
var PROMO_SHEET_NAME_PROPERTY = 'PROMO_SHEET_NAME';

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
 * Appends [Submission Date, Correo, Teléfono] to columns A-C.
 *
 * `correo` is required. `telefono` is optional and is written as an empty cell
 * when omitted, so column C stays aligned.
 *
 * @param {Object} data Parsed request body.
 * @return {TextOutput} JSON response the frontend understands.
 */
function handlePromoSubmission(data) {
  var correo = (data.correo ? String(data.correo) : '').trim();
  var telefono = (data.telefono ? String(data.telefono) : '').trim();

  if (!correo) {
    return jsonOutput_({ status: 'error', message: 'El correo electrónico es requerido.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return jsonOutput_({ status: 'error', message: 'El correo electrónico no es válido.' });
  }

  // Bounds a pasted blob or a value long enough to be a payload rather than a
  // contact detail; the endpoint is public and unauthenticated
  if (correo.length > 254 || telefono.length > 40) {
    return jsonOutput_({ status: 'error', message: 'Los datos enviados no son válidos.' });
  }

  try {
    var sheet = getPromoSheet_();

    // Matches the "2026-02-27 00:33:09" text format already in column A
    var formattedDate = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm:ss'
    );

    sheet.appendRow([formattedDate, correo, telefono]);

    return jsonOutput_({ status: 'ok' });
  } catch (err) {
    // Logged to Executions so a misconfigured property is diagnosable, while
    // the visitor only sees a generic failure
    console.error('Promo signup failed: ' + err);
    return jsonOutput_({ status: 'error', message: 'No se pudo guardar el registro.' });
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
