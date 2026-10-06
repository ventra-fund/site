import { z } from 'astro/zod';

// What the document provider is asked for. Two products are used, in order:
//   1. Classify (cheap, seconds): is this file a bank statement at all? Advisory only: it reads
//      just the PDF's text layer, so a watermarked photo of a statement can come back "other".
//      Every file is attached and extracted; what pre-fills is decided on the extraction.
//   2. Extract (agentic, minutes): the header-level facts the apply form can be pre-filled
//      from. Deliberately NOT the transaction list: the form wants "roughly what comes in each
//      month", which every statement prints as a deposits/credits total, and skipping the
//      line items keeps the job fast and cheap.
// The zod schema is the single source of truth: it is converted to the JSON Schema the
// provider takes, and the provider's result is validated against it before anything is read.

// --- Classifier ------------------------------------------------------------------------------

export const BANK_STATEMENT_LABEL = 'bank_statement';

// Two rules so the classifier returns a clean decision rather than always matching one rule.
export const CLASSIFY_RULES = [
  {
    type: BANK_STATEMENT_LABEL,
    description:
      'A bank or credit-union account statement for a checking, savings or money-market account. ' +
      'It shows an account holder or business name and mailing address, a (partly masked) account ' +
      'number, a statement period with dates, beginning and ending balances, and totals or a dated ' +
      'list of deposits and withdrawals. May be a scan or a phone photo of a paper statement.',
  },
  {
    type: 'other',
    description:
      'Any document that is NOT a bank account statement, for example an invoice, receipt, tax ' +
      'form, pay stub, credit-card statement, loan statement, identification card, contract, ' +
      'screenshot, logo, or an unrelated or blank image or photo.',
  },
];

// --- Extraction schema ----------------------------------------------------------------------

const MonthSchema = z.object({
  month: z
    .string()
    .describe(
      "The calendar month this statement period covers, formatted 'YYYY-MM' (e.g. '2026-03'). If the " +
        "period spans two months (e.g. 02/16–03/15) use the month of the statement's closing date. " +
        'Exactly one entry per distinct calendar month; never repeat a month.',
    ),
  periodStart: z.string().nullable().describe("Statement period start date, 'YYYY-MM-DD', if printed."),
  periodEnd: z.string().nullable().describe("Statement period end date, 'YYYY-MM-DD', if printed."),
  totalDeposits: z
    .number()
    .nullable()
    .describe(
      'Total deposits and other credits for the period, in dollars, as a positive number. Prefer the ' +
        "statement's own summary line (labelled like 'Deposits and other credits', 'Total deposits', " +
        "'Total credits', 'Money in'); only add up the individual credit transactions if no summary " +
        'total is printed. Null if neither is available.',
    ),
  depositCount: z.number().nullable().describe('Number of deposit/credit transactions in the period, if printed.'),
  endingBalance: z.number().nullable().describe('Ending/closing balance for the period, in dollars.'),
});

export const StatementExtractionSchema = z.object({
  bankName: z.string().nullable().describe('Name of the bank or credit union that issued the statement.'),
  accountType: z
    .string()
    .nullable()
    .describe("The account's product name as printed, e.g. 'Business Checking', 'Simple Business Checking', 'Savings'."),
  accountHolderName: z
    .string()
    .nullable()
    .describe(
      'The account holder the statement is addressed to, exactly as printed: the customer, never the bank. ' +
        'Usually printed in the address block near the top of the first page. If several names are printed ' +
        '(joint holders, or a business with an owner or "c/o" line) give the first/primary one only. For a ' +
        'business account this is the business name.',
    ),
  accountHolderKind: z
    .enum(['business', 'person', 'unknown'])
    .describe(
      "'business' if the account holder is a company: the name contains LLC, L.L.C., Inc, Corp, Co, Ltd, LLP, " +
        "PLLC, PC, DBA, Enterprises, Group, Holdings, Services, or the account is a business product such as " +
        "'Business Checking'. 'person' if it is an individual's name on a personal account. 'unknown' if it " +
        'cannot be told.',
    ),
  mailingAddress: z
    .string()
    .nullable()
    .describe(
      "The account holder's mailing address as printed in the address block next to their name, as ONE line " +
        "in the order street, unit, city, state, ZIP (e.g. '123 Main St Ste 4, Springfield, IL 62704'). Never " +
        "the bank's own address, a branch address, or the payment/remittance address.",
    ),
  months: z.array(MonthSchema).describe('One entry per calendar month the statement covers (usually exactly one).'),
});

export type StatementExtraction = z.infer<typeof StatementExtractionSchema>;

/** Guidance for the extraction model, on top of the per-field descriptions. */
export const EXTRACTION_SYSTEM_PROMPT =
  'You are reading a US bank statement to pre-fill a small-business funding application. Read only what is ' +
  'printed; never guess a value that is not on the document, use null instead. The account holder is the ' +
  'customer the statement is addressed to, found in the address block, not the bank whose logo is on the ' +
  'page. For the deposits total, use the statement summary section when there is one. Do not output any ' +
  'account, routing, card or Social Security numbers.';

// The value-shape a JSON Schema object presents at its top level, matching the provider's
// `data_schema` parameter so no cast is needed at the call site.
type JsonSchemaObject = { [key: string]: string | number | boolean | unknown[] | { [key: string]: unknown } | null };

/** The JSON Schema handed to the provider's Extract config (`data_schema`); built once, it never changes. */
export const EXTRACTION_JSON_SCHEMA = z.toJSONSchema(StatementExtractionSchema) as JsonSchemaObject;
