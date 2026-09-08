# Apps Script backend

The live source lives in the Apps Script project behind the site's `/exec`
endpoint, not in this repo. `promo.gs` is the promo-signup module kept here so
the routing is reviewable in git; it is pasted into that project by hand.

## No IDs in this repo

Spreadsheet IDs are **not** committed. They are read at runtime from Script
Properties, which you set in the Apps Script UI:

**Project Settings → Script Properties → Add script property**

| Property | Required | Value |
| --- | --- | --- |
| `PROMO_SPREADSHEET_ID` | yes | The promo spreadsheet's ID — the part of its URL between `/d/` and `/edit` |
| `PROMO_SHEET_NAME` | no | Tab name to append to. Omit to use the first tab. |

Script Properties are per-project and are not exported with the source, so the
value never reaches this repository.

## Installing `promo.gs`

1. Open the Apps Script project (Extensions → Apps Script from the bound sheet,
   or script.google.com).
2. **File → New → Script file**, name it `promo`. Paste the whole of
   `promo.gs` into it.
   It defines no `doPost` and no `doGet`, so it cannot collide with the entry
   points the careers form already uses.
3. Set `PROMO_SPREADSHEET_ID` as above.
4. Confirm columns A–C of the target tab are `Submission Date`, `Correo`,
   `Teléfono`. `appendRow` writes positionally and ignores headers.
5. **Run → `testPromoSubmission`** and approve the authorization prompt. It
   appends one real row; check it landed in the right columns, then delete it.
   A red run means the property, the sharing, or the tab name is wrong — fix it
   here, before any visitor can hit it.

## Wiring the route

In the existing script file, find where `doPost` parses the request body into a
variable (`JSON.parse(e.postData.contents)`). Immediately after that line, add:

```javascript
if (data.formType === 'promo') {
  return handlePromoSubmission(data);
}
```

Substitute whatever the parsed variable is actually called. Everything below
that line — the careers path — is untouched. Careers submissions send no
`formType`, so they fall through exactly as before.

## Deploying

**Deploy → Manage deployments →** pencil on the *existing* deployment **→
Version: New version → Deploy**.

Editing the existing deployment keeps the `/exec` URL. Choosing "New deployment"
mints a *different* URL that the site does not call, which looks exactly like
the code not working. Confirm **Execute as: Me** and **Who has access: Anyone**
survive the redeploy.

Note the previous version number first — rolling back is selecting it again in
the same dialog.

## Verifying

```bash
curl -sL -X POST \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"formType":"promo","correo":"prueba@ejemplo.com","telefono":"6681234567"}' \
  'https://script.google.com/macros/s/.../exec'
```

`-L` is required; Apps Script answers with a redirect. Expect `{"status":"ok"}`
and a new row. Then submit the careers form once to confirm it still works —
that is the regression that matters.

## Known gap

The promo branch has no Turnstile check and no rate limit, and the `/exec` URL
is in public JavaScript. Anyone can append rows to the promo sheet with a single
`curl` loop.
