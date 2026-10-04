# Privacy policy, terms & e-sign review

Goal: publish a Privacy Policy and Terms of Use that match what the site actually collects, confirm the e-sign flow holds up legally, and decide whether cookies need a banner. Have counsel review the drafts before they go live. There are no `/privacy` or `/terms` pages yet and nothing links to them.

## What the site collects (inventory to draft from)

Re-check this list against the code before drafting, then keep it current as features are added.

- **Apply form** (`src/lib/apply-schema.ts`): legal business name, DBA, first/last name, mobile, email, home address, business address, business start date, industry, estimated FICO score, monthly revenue, requested funding amount
- **Bank statement uploads** (`/api/apply/upload`): files stored in R2 (`DOCUMENTS`) and sent to LlamaCloud to pre-fill fields (`src/lib/server/doc-extract/llamacloud.ts`)
- **Drop-off capture** (`src/lib/apply-draft.ts`, `src/lib/server/drafts.ts`): partially filled applications are autosaved *before* submit, along with referrer and UTM source/medium/campaign. Default retention is 30 days for unsubmitted drafts and 90 days after submission, adjustable by admins
- **Contact and partner forms** (`/api/contact`, `/api/partner`): name, email, message, and partner role/interests. Emailed through Resend and not stored
- **E-sign** (`src/lib/server/signing.ts`): confirmed application fields, EIN, SSN (both encrypted), typed signature, and for each signer step their IP, browser (user agent), country and city
- **Every form**: Cloudflare Turnstile bot check, per-IP rate limiting
- **Address suggestions** (`docs/address-autocomplete-checklist.md`): what's typed in the address fields is sent to LocationIQ, through the Worker, to fetch suggestions. Add LocationIQ to the processor list

## Privacy policy

- [ ] Lists each category above and why it's collected (underwriting, contacting the applicant, fraud and bot prevention, legal records)
- [ ] Says plainly that partially completed applications are saved before submit, and for how long
- [ ] Discloses sharing with **funding partners** and credit checks (the signing attestation already authorizes "Ventra Fund and its funding partners" to pull business and personal credit)
- [ ] Names or describes service providers: Cloudflare (hosting, D1, R2, Turnstile), Resend (email), LlamaCloud (statement reading), Google Fonts, LocationIQ (address suggestions)
- [ ] Retention for each store: drafts, submissions, uploaded statements (180-day R2 lifecycle backstop), signing records and audit trail (currently no purge), contact emails
- [ ] Security summary: SSN/EIN encrypted, masked in admin, reveals logged
- [ ] How to request access, correction or deletion, and who to contact
- [ ] Check which laws apply and add what they require: GLBA (possibly, as a commercial finance provider), CCPA/CPRA if thresholds are met, state commercial financing disclosure laws (CA, NY, UT, VA, etc.)
- [ ] Decide whether a "Do not sell or share" notice is needed (only if data is shared for marketing, or ad pixels are added)

## Terms of use

- [ ] Site use terms: no guarantee of funding, applying isn't an offer, accuracy of submitted information
- [ ] Consent to be contacted by phone, text and email about the application. If texts or autodialed calls will be used, get **TCPA-compliant express written consent** as a checkbox on the apply form, not only in the terms
- [ ] Liability, governing law, dispute resolution
- [ ] Make it clear the terms and privacy policy apply to the uploaded statements and the partner/broker inquiries

## Site wiring

- [ ] Add `/privacy` and `/terms` pages and link them in `src/components/Footer.astro`
- [ ] Add a line near the Submit button on `/apply`, and near Send on contact/partner, e.g. "By submitting you agree to our Terms and Privacy Policy." Decide whether it should be a required checkbox
- [ ] Link both from the signing page (`src/pages/sign/[token].astro`) and the signing email (`src/lib/server/signing-email.ts`)
- [ ] Show a "last updated" date on each page and keep past versions

## E-sign link review

- [ ] Have counsel review the texts in `src/lib/signing-config.ts` (`ESIGN_DISCLOSURE`, `SIGNING_ATTESTATION`, `SIGNATURE_ADOPTION`). Bump `SIGNING_TERMS_VERSION` on any change
- [ ] ESIGN Act consumer disclosure: confirm it covers the right to a paper copy, how to withdraw consent, any fees, hardware/software needs, and how to update contact info. It currently says to "reply to the email", so make sure that inbox is monitored and requests are handled
- [ ] Confirm whether ESIGN consumer-consent rules apply at all (commercial applicant, but a personal guarantor/SSN is involved). Getting it right either way is cheap
- [ ] Give the signer a copy of what they signed (emailed PDF or a download link) after signing
- [ ] Decide on retention for signing records, the audit trail and encrypted SSN/EIN, and add a purge if needed (there is none today)
- [ ] Is a 14-day link acceptable (`SIGNING_LINK_TTL_DAYS`)? Is email-link possession enough identity proof, or is a second factor (SMS code, KBA) wanted for larger deals?
- [ ] Mention the signer IP/location capture in the privacy policy
- [ ] Confirm funding partners will accept this signature record, or whether they require a specific e-sign vendor

## Cookies

Current state: the only cookie is the admin sign-in session (better-auth, `src/lib/server/auth.ts`), which is strictly necessary and only set for admins. Turnstile runs on public forms and may use its own storage for bot detection. Google Fonts are downloaded at build time and self-hosted, so visitors don't request them from Google (confirm in `dist/`). No analytics, ad pixels, `localStorage` or `sessionStorage`.

- [ ] Confirm the above with the browser dev tools on `/`, `/apply`, `/sign/...` and `/admin`
- [ ] If it holds: **no cookie banner is needed** for US visitors. Add a short cookie section to the privacy policy (session cookie for admins, Turnstile for security)
- [ ] Revisit when adding analytics (GA, Meta pixel, etc.). At that point decide on a consent banner, respect Global Privacy Control, and update the policy. The unused cookie-preferences example in `src/ui/dialog/Dialog.astro` could be a starting point
- [ ] Decide whether EU/UK visitors matter. If so, GDPR/ePrivacy need more (lawful basis, consent before non-essential cookies)
