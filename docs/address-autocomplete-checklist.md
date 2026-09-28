# Address autocomplete & suite validation (Google)

Goal: applicants enter their home and business addresses on one line with type-ahead suggestions, and can't submit a multi-tenant building (e.g. `265 Canal St`) without a suite, floor or unit. If Google is unavailable or over quota, the form still works and the address is flagged for manual review.

## Decisions

- **Provider:** Google Maps Platform for everything, meaning Places API (New) for suggestions and Address Validation API for the USPS unit check. It needs a billing account (card on file), but stays at $0 at our expected volume.
- **One-line input.** The applicant only sees one text field per address. The structured parts (street, unit, city, state, ZIP), the place ID and the validation result are saved behind the scenes.
- **Suite detection** uses USPS delivery-point data returned by Address Validation (`uspsData.dpvConfirmation`). A value of `D` means the building is valid but the unit is missing.
- **Graceful degradation.** Suggestions and validation are optional extras. Any Google failure lets the applicant through with `verified = false`.
- **All Google calls go through the Worker.** The API key never reaches the browser.

## Pricing reference (list prices, checked 2026-09-27)

| Step | SKU | Free / month | After free |
|---|---|---|---|
| Suggestions while typing, when the session ends in a pick | Autocomplete Session Usage | Unlimited | $0 |
| Applicant picks a suggestion | Place Details Essentials | 10,000 | $5.00 per 1,000 |
| Suite / deliverability check | Address Validation Pro | 5,000 | $17.00 per 1,000 |
| Typing that never ends in a pick | Autocomplete Requests | 10,000 | $2.83 per 1,000 |

- About $0.022 per validated address once past the free amounts. Each application has two addresses, but "Same as home" and identical addresses reuse one result.
- Estimated $0 a month up to about 2,000 applications (both addresses validated), about $24 at 5,000 and about $160 at 10,000.
- **Not yet confirmed:** whether `uspsData` / CASS bills as Address Validation **Enterprise** ($25 per 1,000, 1,000 free). See the first task under Server.

## Setup (manual, in Google Cloud Console)

- [ ] Create a GCP project and a billing account
- [ ] Enable **Places API (New)** and **Address Validation API**
- [ ] Create an API key restricted to those two APIs. Leave out HTTP-referrer restrictions, since calls come from the Worker, not the browser
- [ ] Set **per-API daily quota caps** (the hard spend stop; budget alerts only send email):
  - [ ] Places Autocomplete: ~1,000 a day
  - [ ] Place Details: ~300 a day
  - [ ] Address Validation: ~150 a day, sized to stay inside the 5,000 a month free amount
- [ ] Add a billing budget alert at $10 / $25
- [ ] Add `GOOGLE_MAPS_API_KEY` to `.dev.vars` locally and set it with `wrangler secret put GOOGLE_MAPS_API_KEY` for production

## Server (Worker)

- [ ] **Confirm SKU behavior before building.** Check whether Address Validation Pro returns `uspsData.dpvConfirmation`, or whether that (or `enableUspsCass`) bills as Enterprise. Record the answer in the pricing table above.
- [ ] `src/lib/server/google-places.ts`: small fetch wrapper with about a 1.5 s timeout, returning either a typed result or a `degraded` result, and never throwing to the caller
- [ ] `GET /api/address/suggest?q=&session=`: Places Autocomplete (New)
  - [ ] `includedRegionCodes: ["us"]`, address-type results only, `sessionToken` passed through
  - [ ] Requires `q` of at least 3 characters and a length cap; returns `{ suggestions: [{ placeId, text }], degraded }`
- [ ] `GET /api/address/details?placeId=&session=`: Place Details with a **field mask of `formattedAddress,addressComponents` only**. Any Pro field bills the whole call at $17 per 1,000
- [ ] `POST /api/address/validate`: Address Validation with `addressLines: [oneLine]`, `regionCode: "US"`
  - [ ] Maps the result to `{ status: 'verified' | 'missing_unit' | 'bad_unit' | 'not_found' | 'unverified', formatted, components, cmra, vacant }`
  - [ ] `dpvConfirmation`: `Y` → verified, `D` → missing_unit, `S` → bad_unit, `N` / none → not_found
  - [ ] Caches results by a hash of the normalized address (Cache API or KV, about 30 days). Repeat checks, "Same as home" and the server re-check on submit then cost nothing
- [ ] Rate-limit all three endpoints with a new `ADDRESS_RATE_LIMIT` binding in `wrangler.jsonc`, following the existing `FORM_RATE_LIMIT` pattern in `src/lib/server/rate-limit.ts`
- [ ] **Cutoff:** on a Google 429 or quota error, set a flag until the next UTC midnight and skip Google while it's set, returning `degraded: true`
- [ ] Don't log API keys or full request URLs that contain them

## Client (`src/pages/apply.astro`)

- [ ] Address combobox component (`src/components/AddressField.astro`) wrapping the existing `Input`, with `role="combobox"`, a listbox, arrow keys / Enter / Escape, and an `aria-live` count of results
- [ ] Waits about 250 ms after typing stops and needs at least 3 characters. Starts a new session token when the field is focused and ends it when a suggestion is picked
- [ ] On pick: call details, fill the one-line value, then place the cursor after the street part so the applicant can type "Ste 200"
- [ ] Placeholder: "Street address, including suite/unit"
- [ ] Validate when the field loses focus (and on submit if not yet validated):
  - [ ] `missing_unit` → inline error: "This building has multiple suites. Add your suite, floor or unit." Blocks submit
  - [ ] `bad_unit` / `not_found` → soft warning, does not block submit
  - [ ] Escape hatch: a "My business doesn't have a suite number" link lets the applicant past `missing_unit` and flags the application for review
- [ ] Any edit after validating resets the status to unvalidated
- [ ] If the response is `degraded`, hide the dropdown silently. The field works as plain text and submit is not blocked
- [ ] Keep existing behavior working:
  - [ ] "Same as home address" copies the value **and** its validation result to the business address
  - [ ] Business address autofilled from the bank statement gets validated like a typed one
  - [ ] Draft autosave (`src/lib/apply-draft.ts`) saves the value and validation status
- [ ] Attribution: the Google logo or "Powered by Google" in the suggestion list, as Places terms require without a map

## Data & admin

- [ ] `src/lib/apply-schema.ts`: optional `homeAddressMeta` / `businessAddressMeta` (placeId, components, status, override flag)
- [ ] `/api/apply` re-checks each address status on the server using the validate cache, so a `missing_unit` sent from the browser without an override is rejected with a 400
- [ ] Include the validation status in the application email and drafts (`src/lib/server/drafts.ts`). Add a D1 column if we query it, otherwise store it in the draft JSON
- [ ] Admin views: badges for **Unverified**, **No suite (applicant override)** and **Virtual mailbox (CMRA)** on submissions and drop-offs

## Testing

- [ ] `265 Canal St, New York, NY` without a suite → `missing_unit`. Same address with a real suite → `verified`
- [ ] Single-family home → `verified` without a unit
- [ ] Made-up address → `not_found`, soft warning only
- [ ] Bad key or forced 429 → dropdown hidden, submit still works, address saved as unverified, cutoff flag set
- [ ] Keyboard-only and screen-reader pass on the combobox
- [ ] Check in the Cloud Console billing report that a completed pick shows as *Session Usage* rather than individual *Autocomplete Requests*

## Known limits

- USPS has no unit data for buildings with central mailrooms, so those pass as `verified` without a suite.
- US addresses only; `regionCode` is fixed to `US`.
