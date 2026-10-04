// Shapes and wording for the e-signature flow that follows an approval (src/pages/sign/[token].astro
// in the browser, src/pages/api/sign/[token].ts and src/lib/server/signing.ts on the server). Read by
// both, so the texts the signer agrees to are exactly the ones hashed into the signature record.
// Keep this module dependency-free: it is shipped to the browser.

/** How long a signing link works after it is sent. */
export const SIGNING_LINK_TTL_DAYS = 14;

/** A signing token: 32 random bytes, base64url without padding. */
export const SIGN_TOKEN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Bump whenever any text below changes, so every signature record says which wording it
 * agreed to. The version and the texts are part of the signed document hash.
 */
export const SIGNING_TERMS_VERSION = '2026-10-04.2';

/** Shown before anything else; the signer must accept it to go on (the ESIGN Act consumer disclosure). */
export const ESIGN_DISCLOSURE = [
  'By continuing, you agree to receive this document and any related notices electronically, and to sign it electronically.',
  'Your electronic signature has the same legal effect as a handwritten one. You can ask for a paper copy, or withdraw this consent before signing, by replying to the email that brought you here.',
  'To take part you need a device with an up-to-date web browser and access to the email address this link was sent to.',
];

/** The statement the signature is placed under. */
export const SIGNING_ATTESTATION =
  'I certify that the information above is true and complete, that I am authorized to sign on behalf of the business named above, ' +
  'that the financing will be used solely for business purposes, ' +
  'and I authorize Ventra Fund and its funding partners to verify that information, including through a soft credit inquiry on the business and on me personally, ' +
  'in connection with this application. A soft inquiry does not affect my credit score. I do not authorize a hard credit inquiry.';

/** Ticked beside the typed signature: adopting it as a legally binding signature. */
export const SIGNATURE_ADOPTION =
  'I agree that the signature above is my electronic signature and has the same legal force and effect as my handwritten signature ' +
  'under the federal E-SIGN Act (15 U.S.C. § 7001 et seq.) and applicable state law.';

/** The cursive face a typed signature is shown in (a Google font, see astro.config.mjs). */
export const SIGNATURE_FONT = 'Dancing Script';
export const SIGNATURE_FONT_VAR = '--font-signature';

/** EIN as typed: nine digits, the dash optional. */
export const EIN_PATTERN = '\\d{2}-?\\d{7}';
/** SSN as typed: nine digits, the dashes optional. */
export const SSN_PATTERN = '\\d{3}-?\\d{2}-?\\d{4}';

/** Wire shape of a POST to /api/sign/[token]. */
export type SignAction = 'consent' | 'sign';
