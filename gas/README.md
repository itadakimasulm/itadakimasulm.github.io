# Apps Script backend — promo signups

`Code.gs` is the **entire** script for a standalone Apps Script project that
backs the "¡Regístrate para promociones!" modal on `index.html`.

It is a separate project from **Itadakimasu Careers Form**, with its own `/exec`
URL. Nothing here touches the careers deployment: the two backends fail
independently, and a bad promo deploy cannot take job applications down.

## No IDs in this repo

The spreadsheet ID is **not** committed. It is read at runtime from a Script
Property you set in the Apps Script UI:

**Project Settings → Script Properties → Add script property**

| Property | Required | Value |
| --- | --- | --- |
| `PROMO_SPREADSHEET_ID` | yes | The promo spreadsheet's ID — the part of its URL between `/d/` and `/edit` |
| `PROMO_SHEET_NAME` | no | Tab name to append to. Omit to use the first tab. |

Script Properties are per-project and are not exported with the source, so the
value never reaches this repository.

## Setup

1. **script.google.com → New project.** Name it `Itadakimasu Promo Form`.
2. Delete the stub contents of the default file and paste all of `Code.gs`.
3. Add `PROMO_SPREADSHEET_ID` under Project Settings → Script Properties.
4. Confirm the target tab's columns A–C are `Submission Date`, `Correo`,
   `Teléfono`. `appendRow` writes positionally and ignores headers.
5. **Run → `testPromoSubmission`.** Approve the authorization prompt (this is
   the step that grants the project access to the spreadsheet). It appends one
   real row — check it landed in the right columns, then delete it.
   A red run means the property, the sharing, or the tab name is wrong. Fix it
   here, before the endpoint is public.

## Deploying

**Deploy → New deployment → Web app.**

- Description: `promo v1`
- Execute as: **Me**
- Who has access: **Anyone**

This is a brand-new project, so "New deployment" is correct — it mints the
`/exec` URL this backend needs. (For the *careers* project the rule is the
opposite: always edit the existing deployment and pick "New version", or its URL
changes and the site stops reaching it.)

Copy the `/exec` URL. Paste it into `PROMO_GAS_URL` in
`assets/js/script.js` and commit — until that constant is filled in, the modal
tells visitors registration is unavailable rather than posting into the void.

## Verifying

Open the `/exec` URL in a browser. `doGet` answers:

```json
{"status":"ok","message":"Itadakimasu promo endpoint is live"}
```

Then the real path:

```bash
curl -sL -X POST \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"formType":"promo","correo":"prueba@ejemplo.com","telefono":"6681234567"}' \
  '<PROMO /exec URL>'
```

`-L` is required; Apps Script answers with a redirect. Expect `{"status":"ok"}`
and a new row.

## Updating later

Edits to `Code.gs` go live only after **Deploy → Manage deployments →** pencil on
the existing deployment **→ Version: New version → Deploy**. Saving the editor
changes nothing. Note the current version number first — rollback is selecting
it again in the same dialog.

## Known gap

There is no Turnstile check and no rate limit, and the `/exec` URL is in public
JavaScript. Anyone can append rows to the promo sheet with a `curl` loop. The
input-length bounds in `handlePromoSubmission` limit the damage per row; they do
not limit the number of rows.
