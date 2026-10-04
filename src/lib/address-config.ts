// Shared by the apply page's address fields and /api/address/suggest.

/** Shortest text worth asking the provider about; below it nothing is suggested. */
export const ADDRESS_QUERY_MIN = 4;
/** Matches the address inputs' maxlength. */
export const ADDRESS_QUERY_MAX = 300;
/** Most suggestions shown under a field. */
export const ADDRESS_SUGGESTION_LIMIT = 5;
/** How long the page waits after the last keystroke before asking. */
export const ADDRESS_DEBOUNCE_MS = 250;

/** One suggested address: the line that goes in the field, and its parts for the record. */
export interface AddressSuggestion {
  /** One line, as it is put in the field: "265 Canal Street, New York, NY 10013". */
  text: string;
  /** House number and street: "265 Canal Street". */
  street: string;
  city: string;
  /** Two-letter state code. */
  state: string;
  zip: string;
}

export interface AddressSuggestResponse {
  suggestions: AddressSuggestion[];
  /** The provider couldn't be asked (no key, quota, outage): the field carries on as plain text. */
  degraded?: boolean;
}
