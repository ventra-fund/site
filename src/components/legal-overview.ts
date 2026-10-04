// Shapes for the legal pages: LegalPage's sections, and the at-a-glance table LegalOverview.astro
// renders. Ported.
import type { ContactKey } from '@/lib/contact/keys';

/** A paragraph that ends in a link, e.g. a provider's required credit. */
export interface LegalLinkedParagraph { text: string; link: { label: string; href: string } }
/** `contacts`: details shown after the body through the anti-scrape reveal (ContactReveal). */
export interface LegalSection { heading: string; body: (string | LegalLinkedParagraph)[]; contacts?: ContactKey[] }

// An icon component, e.g. a default import from '@lucide/astro/icons/<name>'.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Icon = (props: any) => any;
/** One row: icon, title, and a very short line on how it's used. */
export interface OverviewItem { icon: Icon; label: string; detail: string }
/** A bold heading row, an optional note beneath it, then its rows. */
export interface OverviewGroup { title: string; note?: string; items?: OverviewItem[] }
export interface Overview { groups: OverviewGroup[]; note?: string }
