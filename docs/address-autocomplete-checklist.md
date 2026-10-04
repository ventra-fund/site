# Address suggestions on the apply form (LocationIQ)

Goal: applicants enter their home and business address in one field each, and only a full address is accepted, so a shorthand like `WTC7` can't be submitted. It isn't USPS validation: it guarantees a complete address (number, street, city, state, ZIP), not a deliverable one.

## Decisions

- **Provider: LocationIQ** autocomplete, free plan (5,000 requests a day, 2 a second, no card). Chosen on speed: about 0.1 s per request when measured on 2026-10-04. Geoapify was tried first and took 0.5 to 9 s.
- **No USPS or suite validation.** The earlier Google Places + Address Validation plan was dropped. OpenStreetMap data doesn't know suites, so the business address placeholder asks for one.
- **One field per address.** The suggestion's parts (street, city, state, ZIP) are only used to write the line `street, city, ST zip`; they aren't stored separately.
- **The key stays on the Worker.** The browser only calls `/api/address/suggest`.
- **A full address is required** (decided 2026-10-04). Either picked from the suggestions (a suite or unit may be added after), or typed out with every part.
- **Typed-in-full fallback** (`src/lib/address-shape.ts`), for addresses the provider doesn't know: new construction, rural routes, PO boxes. It checks the shape only: a street or box number, a street name, a city, a state (code or spelled out) and a ZIP, with or without commas, with the ZIP before or after the state. A statement pre-fill that has all the parts passes as it is.
- **The error names what's missing**, e.g. "That address is missing the state and ZIP code. Add them, or choose a suggested address."
- **Outage bypass.** Once lookups have been failing for 10 seconds (`ADDRESS_OUTAGE_GRACE_MS`), whatever is typed is accepted, so a provider that is down, out of quota or missing its key can't stop applications. Before that the field says "Use a suggested address."
- **Enforced in the page only.** `/api/apply` can't tell a picked address from a typed one and accepts any non-empty address.
- **Own component, not the kit's Combobox**, which submits a picked item rather than typed text. See the note in `src/components/AddressField.astro`.

## Done

- [x] `src/lib/server/locationiq.ts`: provider call, 2.5 s timeout, never throws, pauses after a refused key or a spent quota
- [x] Nearby addresses ranked first, from Cloudflare's position for the visitor (no browser prompt)
- [x] `GET /api/address/suggest?q=`: same-site only, `ADDRESS_RATE_LIMIT` (60 per minute per IP), 4 to 300 characters
- [x] `src/components/AddressField.astro` + `src/lib/address-field.ts`: ARIA combobox with a listbox, arrow keys / Enter / Escape, a screen-reader count of suggestions
- [x] Full address required: pick, suite allowance, typed-in-full fallback, 10-second outage bypass. Checked in a browser on 2026-10-04 (shorthand refused, pick accepted, suite added, typed-in-full and rural route accepted, "Same as home", outage, recovery)
- [x] Used for both addresses in `src/pages/apply.astro`; "Same as home address", statement pre-fill and draft autosave work through the same input as before
- [x] `LOCATIONIQ_API_KEY` in `.env`, `.env.example` and the env schema

## To do

- [ ] After deploying, confirm a short query (e.g. `1200 Main St`) lists nearby matches first, as it does under local preview
- [ ] Check the field in a browser: typing, picking by mouse and keyboard, "Same as home address" on and off, a statement pre-fill, dark mode, a phone
- [ ] `npx wrangler secret put LOCATIONIQ_API_KEY` for production; the `ADDRESS_RATE_LIMIT` binding (namespace `1007`) deploys with the next deploy
- [ ] **Attribution** (paused): LocationIQ's free plan requires a visible credit. Decide where it goes before launch
- [ ] Add LocationIQ to the processor list in the privacy policy (`docs/privacy-terms-checklist.md`): typed addresses are sent to it
- [ ] Decide whether the remaining Geoapify project and key should be deleted

## Known limits

- US addresses only (`countrycodes=us`).
- Coverage of new construction and rural addresses is weaker than Google's; those applicants type the address in full instead of picking.
- The typed-in-full check reads the shape, not the facts: `1 Fake St, Nowhere, TX 00000` passes.
- Without commas, a city that is also a state name reads as the state: `250 Greenwich St New York` is told only the ZIP code is missing, and passes once it is added.
- Applications sent during an outage aren't marked as unchecked in the email or the admin pages.
- Nearby matches rank first using Cloudflare's IP-based position for the visitor (`viewbox` with `importancesort=0`). A VPN or mobile carrier can put someone in the wrong city; the bias only reorders, so the right address still shows once the city is typed.
