# SEO and AI search (AEO) content plan

Researched November 2026. This plan covers which pages and posts to build so ventrafund.com ranks in Google and gets named and cited by ChatGPT, Perplexity, Google AI Overviews / AI Mode, Gemini, Claude and Copilot.

**Where the numbers come from**

- **Keyword volume, CPC and difficulty:** DataForSEO (Google Ads volumes, US, Oct 2025 – Sep 2026, 266 keywords) and Serpstat (MCA long tail).
- **Search interest and seasonality:** Google Trends, US, 5 years.
- **Who ranks:** live Google results for 8 money keywords (AI Overview citations and People Also Ask questions), plus Firecrawl and web search.
- **Competitor content:** a Nimble Web Search Agent run that read 12 competitors' sitemaps and hubs, plus the publishers that dominate three query classes.
- **How AI engines cite:** a Tavily deep-research brief (studies from Ahrefs, Semrush, BrightEdge, Seer, Profound, Otterly and others, 2025–2026).
- **This site:** live requests to ventrafund.com and a read of the repo.

**How to read the keyword tables**

- **Searches/mo** is Google Ads' rounded monthly average.
- **KD** is DataForSEO's 0–100 difficulty score (logarithmic). Under 15 is easy; 30–45 needs links.
- **CPC** is what advertisers pay per click. It is the best proxy for how much a visitor is worth.
- **12-mo trend** compares Jul–Sep 2026 with Oct–Dec 2025. It is only shown for keywords with 200+ searches; below that Google rounds too coarsely.
- Google Ads hides volume for some credit terms, such as "business loans for bad credit". Those are marked n/a and still have real demand.

---

## 1. The short version

1. **Fix the technical blockers first (section 5).**
   - There is no sitemap, no meta descriptions, no canonical tags and no structured data.
   - Every internal link goes through a temporary 307 redirect.
   - Cloudflare blocks the crawlers that teach ChatGPT, Claude and Gemini about the brand.
   - None of this is visible on the page, and all of it caps what content can do.
2. **Own MCA debt relief and consolidation.** This is the fastest-growing cluster in the dataset:
   - "mca debt restructuring" +527%, "mca debt consolidation" +353%, "business debt settlement" +217%.
   - Difficulty is 0–7, and CPCs reach $194 ("business debt consolidation") and $214 ("mca consolidation").
   - No mainstream publisher ranks; specialist relief firms own the results.
   - The existing /debt-relief page can't compete as it stands: by the repo's own note, its copy was taken from another company's site.
3. **Point existing pages at the words people actually search.**
   - "Consolidations" should target "MCA debt consolidation" and "business debt consolidation".
   - "Term Financing" should target "business term loan" (12,100/mo).
   - "Cash Credit (CC)" is mostly an Indian banking term in search; reposition it as an asset-based line of credit.
4. **Ship free calculators.**
   - Targets: MCA cost / factor-rate-to-APR, business loan, DSCR, line of credit, working capital.
   - DSCR calculator (3,600/mo) and line of credit calculator (1,600/mo) both have difficulty 0.
   - Credibly, Nav and Lendio already earn links and AI citations with theirs.
5. **Build a commercial financing disclosure law hub** for the 10–11 states with MCA disclosure laws, then pair each state with a "business funding in {state}" page. The pairing gives each state page substance that Biz2Credit-style thin location pages lack.
6. **Expand industries from 5 to about 15**, led by the biggest gaps:
   - auto repair (3,600/mo, KD 16)
   - food trucks (2,400, KD 6)
   - semi trucks (1,900, KD 18)
   - dental (1,000, KD 6)
   - contractors (720)
   - gas stations (590, KD 0)
7. **Write pages comparing Ventra with built-in processor financing** (PayPal Working Capital, Stripe Capital, Square, Shopify Capital, Toast Capital, Amazon Lending). That's almost 9,000 searches a month at difficulty 0–9, from merchants who are already shopping for revenue-based financing.
8. **Build a glossary for the legal and finance terms** owners search after signing:
   - UCC filing (12,100/mo) and UCC lien (5,400)
   - DSCR (22,200)
   - personal guarantee (1,900) and confession of judgment (1,300, KD 0)
   - factor rate, holdback, reconciliation, stacking
9. **Treat AI visibility as mostly an off-site job.**
   - Third-party sites earn about 75–98% of AI citations.
   - In banking, Wikipedia, Bankrate and Investopedia alone supply about half (51%), and NerdWallet adds another 9.6%.
   - Get Ventra into the "best MCA" and "best bad-credit loan" roundups, build review profiles, and give Reddit a real named presence (section 7).
10. **Publish one original data report a year** from anonymized application data. Biz2Credit, Bluevine, Fora, Credibly, Lendio and OnDeck all do this. It is the most-cited asset type that a lender can produce itself.

---

## 2. Where the site stands today

**Pages in the repo:**

- **Products (5)** in `src/data/product-pages.ts`: merchant cash advances, term financing, lines of credit, consolidations, cash credit.
- **Industries (5)** in `src/data/industries.ts`: restaurants, retail, construction, healthcare, trucking.
- **Articles (4)** in `src/data/articles.ts`:
  - MCA vs term loan
  - bank statements
  - seasonal cash flow
  - factor rates / APR
- **Other pages:** FAQ, how it works, transparent pricing, /debt-relief, partner programs, about, leadership, reviews.

**Checked against the live site on Nov 9–10, 2026:**

| Check | Result | Impact |
|---|---|---|
| `/sitemap.xml`, `/sitemap-index.xml` | 404 | Google and Bing discover pages only through links. |
| `robots.txt` | Cloudflare-managed. It disallows GPTBot, ClaudeBot, Google-Extended, GoogleOther, Applebot-Extended, CCBot, meta-externalagent and others. `Content-Signal: search=yes, ai-train=no`; `ai-input` is not set. | Training crawlers can't learn the brand. Blocking Google-Extended also keeps the site out of Gemini app grounding (see 5.1). |
| Edge response to GPTBot and ClaudeBot | 403, so the Cloudflare AI-bot block is also on | Same as above. |
| OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot | 307 → trailing-slash URL → 200 | Answer engines can read pages, but every internal link costs a temporary redirect (see 5.3). |
| Home `<title>` | "Ventra Fund" | No keyword on the strongest page. |
| Meta description, canonical, og:title / og:description | None (deferred in an earlier pass) | Google writes its own snippets, and duplicate URL forms can split signals. |
| JSON-LD structured data | None | No machine-readable entity, product or author data. |
| Rendering | Static prerendered HTML | Good: AI crawlers don't run JavaScript, and Astro already ships full HTML. |
| Brand search | A web search for "Ventra Fund" returns nothing about this company. "Ventra" brings up Ventra Health, Ventra Capital (AU), a UK Ventra grants tool and others. | AI engines need help telling this Ventra apart from the rest (see 7.4). |

**Language versus compliance.** The `articles.ts` header says product copy uses "financing / advance / buy rate", not "loan". Search demand is in "loan" words ("mca loan" 3,600/mo, "business term loan" 12,100). Keep product claims compliant and still meet searchers where they are:

- Use the searched phrase in headings and the first paragraph, and correct it in the same sentence: *"An 'MCA loan' isn't technically a loan; it's a purchase of future receivables…"*
- California's SB 362 (2026) restricts misleading use of "rate" and "interest" for non-interest products, so a factor rate is never called an interest rate.

---

## 3. What the data says

### 3.1 Demand is rising, and it peaks in spring

Google Trends, US, average interest Jan–Oct 2026 against Jan–Oct 2025:

| Term | 2024 | 2025 | 2026 | 2026 vs 2025 |
|---|---:|---:|---:|---:|
| small business loan | 27.7 | 36.0 | 60.0 | +67% |
| business line of credit | 17.3 | 22.0 | 31.0 | +41% |
| merchant cash advance | 2.9 | 3.9 | 8.4 | +115% |
| working capital loan | 2.6 | 3.4 | 5.2 | +53% |
| business debt relief | 0.9 | 2.2 | 3.3 | +50% |

Values are relative (0–100) across the five terms in one query.

- **Seasonality:** "small business loan" peaks in **March–May** and bottoms out in **December**. Get evergreen money pages and calculators live by **February** so they are indexed and earning links before the spring peak.
- **MCA spikes are news-driven.** "Merchant cash advance" had sharp spikes in Nov 2021 – Jan 2022 and Feb 2023. Keep a news/updates slot open for regulatory or enforcement stories.
- **Rising related searches** (Trends, last 12 months):
  - "merchant cash advance financing" +200%
  - "merchant cash advance default" +100%
  - "merchant cash advance lenders" +50%
  - "small business line of credit requirements" +120%
  - "business line of credit lenders" +50%
  - "best small business line of credit" +40%

### 3.2 Keyword clusters

#### A. MCA core: the product page and its supporting articles

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| merchant cash advance | 5,400 | 29 | $68.22 | -13% |
| mca loan | 3,600 | 33 | $126.06 | +32% |
| mca lenders | 3,600 | 16 | $126.06 | +32% |
| merchant cash advance lenders | 880 | 19 | $87.90 | +180% |
| small business cash advance | 880 | 30 | $94.77 | -68% |
| business cash advance | 720 | 19 | $96.47 | -13% |
| merchant cash advance companies | 590 | 30 | $74.83 | +151% |
| what is a merchant cash advance | 480 | 16 | $62.49 | +224% |
| merchant cash advance bad credit | 390 | 12 | $29.73 | -93% |
| mca funding | 320 | 15 | $92.61 | -1% |
| how does a merchant cash advance work | 70 | 18 | $17.65 | – |
| best merchant cash advance companies | 40 | 20 | $34.33 | – |
| merchant cash advance no credit check | 110 | 14 | $67.04 | – |

Serpstat shows a larger long tail around the same intent. Its difficulty scale differs from DataForSEO's:

- "merchant advance" 6,600
- "what is a mca" 2,900 (KD 19)
- "what is mca" 2,400
- "define mca" 1,300 (KD 13)
- "mca lender" 3,600 (KD 21)
- "merchant cash advance for small businesses" 1,000
- "merchant cash advances bad credit" 590 (KD 2)
- "mca servicing" 590 (KD 5)
- "mca brokerage" 480 (KD 5)
- "what is an mca loan" 480

On Google, "merchant cash advance" shows an AI Overview, People Also Ask, Google reviews and a knowledge panel.

- **Top results** (Firecrawl web search): a lender's own page, CNBC Select's "4 Best MCA Companies", Wikipedia, NerdWallet, Greenbox Capital, Stripe, SoFi, Credibly, a Washington state government FAQ, Pipe.
- **People Also Ask:** *Is MCA legal? What does MCA stand for in banking? What is a merchant cash advance product?*

#### B. MCA debt, consolidation and relief: highest priority

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| mca debt relief | 1,000 | 0 | $82.04 | +89% |
| business debt consolidation | 1,000 | 0 | $194.15 | +2% |
| mca debt consolidation | 880 | 0 | $65.63 | +353% |
| business debt settlement | 880 | 3 | $33.19 | +217% |
| business debt negotiation | 880 | 3 | $33.19 | +217% |
| mca debt restructuring | 480 | 0 | $7.12 | +527% |
| business debt | 480 | 7 | $20.19 | +256% |
| business debt relief | 320 | 23 | $123.79 | +32% |
| merchant cash advance attorney | 170 | 0 | $77.88 | – |
| mca lawyer | 140 | 1 | $96.66 | – |
| reverse consolidation | 110 | 0 | $170.30 | – |
| small business debt relief | 110 | 15 | $70.75 | – |
| mca consolidation | 90 | 0 | $214.20 | – |
| business debt help | 90 | 17 | $15.50 | – |
| merchant cash advance default | 50 | 0 | $68.45 | – |
| mca default | 40 | 0 | $26.26 | – |
| reverse consolidation mca | 40 | 0 | $78.26 | – |
| merchant cash advance debt relief | 40 | 2 | $29.53 | – |
| merchant cash advance consolidation | 30 | 0 | $110.74 | – |
| debt consolidation loan for business | 30 | 0 | $177.87 | – |
| how to get out of merchant cash advance | 20 | 0 | $88.15 | – |
| refinance merchant cash advance | 20 | 0 | $36.34 | – |

- **Who ranks** (Firecrawl web search and the Nimble run). The results are all specialist relief firms and law firms: Second Wind Consultants, VIP Capital, Biz2Credit's MCA hub, National Credit Partners, ABL Advisor, Debt Consultants Group, SoFi, Singer Law Group, Northwood Capital, plus a Reddit thread. Value Capital Funding (with an MCA debt calculator) and Business Debt Adjusters ("20 compared") also show up. NerdWallet, Forbes, Bankrate and Investopedia don't rank here.
- **AI Overview citations:** trippscott.com, secondwindconsultants.com, mccarthylawyer.com, wilkiepuchi.com, abladvisor.com, singerlawgroup.com. These are law firms and an industry trade site, so a page that cites statutes and regulators fits what the engine is already choosing.
- **People Also Ask:** *What is MCA loan consolidation? Is it good to use a debt relief company? Does debt consolidation ruin credit?*
- **Content gap.** The authoritative, non-salesy explainer is missing. Regulators have published the raw material:
  - California DFPI says a business on a fixed daily MCA payment usually has a contractual right to **reconciliation** if revenue falls.
  - The FTC acted against Yellowstone Capital for withdrawing payments after merchants had paid in full.
  - No competitor in the set turns this into a plain-English owner's guide.

#### C. Lines of credit

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| business line of credit | 14,800 | 42 | $213.99 | -24% |
| revolving line of credit | 1,900 | 24 | $20.10 | +5% |
| line of credit calculator | 1,600 | 0 | $6.03 | -46% |
| how to get a business line of credit | 880 | 34 | $46.19 | +24% |
| unsecured business line of credit | 720 | 27 | $213.45 | -33% |
| best business line of credit | 720 | 34 | $158.76 | -41% |
| business line of credit bad credit | 590 | 28 | $114.89 | 0% |
| working capital line of credit | 480 | 0 | $131.89 | +195% |
| business line of credit requirements | 480 | 39 | $73.11 | -49% |
| business line of credit vs loan | 320 | 0 | $57.38 | 0% |
| business credit card vs line of credit | 260 | 0 | $89.07 | +85% |
| asset based line of credit | 110 | 19 | $15.11 | – |

At $214 per click, "business line of credit" is the most valuable head term in the set.

- **AI Overview citations:** SoFi, American Express, Chase, PNC, Brex, Wells Fargo, LendingTree. These are banks, so Ventra's angle is the owner banks turn down: 6+ months in business, a 580 score.
- **People Also Ask:** *Is it hard to get a business line of credit?*

#### D. Term and working capital financing

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| business term loan | 12,100 | 27 | $219.94 | -74% |
| how to get a business loan | 9,900 | 43 | $19.25 | 0% |
| business loan for llc | 5,400 | 34 | $57.69 | +7% |
| business loan for new business | 5,400 | 43 | $33.87 | -33% |
| business loan interest rates | 3,600 | 44 | $19.78 | -42% |
| fast business loans | 2,900 | 45 | $277.59 | -58% |
| working capital loan | 1,900 | 34 | $189.77 | +6% |
| unsecured business loan | 1,900 | 1 | $176.65 | -73% |
| business loan requirements | 1,900 | 25 | $22.82 | -39% |
| business loan no credit check | 1,900 | 9 | $64.74 | -43% |
| short term business loan | 1,600 | 22 | $220.57 | -44% |
| same day business loans | 1,300 | 8 | $205.45 | -46% |
| business loan without collateral | 1,000 | 12 | $56.52 | +279% |
| average business loan interest rate | 880 | 42 | $14.54 | -23% |
| no personal guarantee business loan | 880 | 0 | $67.17 | -22% |
| how to qualify for a business loan | 590 | 21 | $13.85 | +61% |
| payroll loan | 590 | 4 | $72.37 | -42% |
| easiest business loan to get | 320 | 26 | $79.79 | +24% |
| cash flow loan | 320 | 10 | $35.35 | +5% |
| emergency business loan | 260 | 25 | $168.57 | +106% |
| working capital financing | 170 | 4 | $148.96 | – |

Three of these fit Ventra's offer directly:

- "no personal guarantee business loan" (880, KD 0)
- "business loan without collateral" (1,000, +279%)
- "unsecured business loan" (1,900, KD 1)

The home page already promises no personal guarantee and no prepayment fees. Give each claim its own page, but only where the contract terms back it up.

#### E. Other products searchers compare against

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| equipment financing | 4,400 | 28 | $67.96 | -13% |
| asset based lending | 5,400 | 33 | $25.71 | +14% |
| invoice factoring | 2,400 | 24 | $132.80 | +22% |
| accounts receivable financing | 1,300 | 0 | $153.72 | +13% |
| revenue based financing | 1,300 | 12 | $147.51 | -36% |
| purchase order financing | 480 | 0 | $88.07 | +32% |
| inventory financing | 390 | 0 | $81.85 | +6% |
| cash credit | 720 | 0 | $12.70 | +40% |

"Cash credit" is mostly Indian-banking intent. The product described in `funding-products.ts` (a revolving facility secured by inventory or receivables) matches what US searchers call an **asset-based line of credit**, **inventory financing** or **accounts receivable financing**. Retitle or alias the page to those terms.

#### F. Calculators

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| loan payment calculator | 110,000 | 46 | $3.16 | -12% |
| business loan calculator | 14,800 | 34 | $8.55 | -23% |
| dscr calculator | 3,600 | 0 | $3.79 | 0% |
| how to calculate working capital | 1,900 | 14 | $8.26 | -32% |
| line of credit calculator | 1,600 | 0 | $6.03 | -46% |
| mca calculator | 1,300 | 0 | $4.58 | -63% |
| working capital calculator | 170 | 3 | $11.59 | – |
| merchant cash advance calculator | 70 | 0 | $3.17 | – |
| factor rate calculator | 40 | 4 | – | – |
| factor rate to apr | 10 | 1 | – | – |

- **What ranks for "mca calculator":** funder tools and NerdWallet.
- **AI Overview citations:** funderintel.com, nerdwallet.com, fundingtracker.app, credibly.com, businessdebtlawgroup.com.
- **Related searches:** "MCA APR calculator", "free cash advance calculator", "merchant loan calculator".

#### G. Glossary and legal terms (what owners look up after signing)

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| debt service coverage ratio | 22,200 | 31 | $14.01 | 0% |
| ucc filing | 12,100 | 23 | $6.27 | +6% |
| working capital | 12,100 | 23 | $122.28 | -11% |
| what is working capital | 8,100 | 42 | $30.02 | -11% |
| ucc lien | 5,400 | 28 | $6.58 | 0% |
| net working capital | 4,400 | 5 | – | -2% |
| cash conversion cycle | 3,600 | 24 | $17.58 | -28% |
| prepayment penalty | 2,400 | 21 | $31.70 | -18% |
| cash flow forecast | 2,400 | 18 | $24.04 | +83% |
| personal guarantee | 1,900 | 18 | $4.24 | -8% |
| confession of judgment | 1,300 | 0 | $0.06 | -17% |
| working capital ratio | 1,000 | 12 | $9.76 | -30% |
| what is a personal guarantee | 880 | 28 | $7.67 | +16% |
| cash flow management | 880 | 37 | $30.69 | +14% |
| ach loan | 260 | 0 | $16.38 | -13% |
| factor rate | 170 | 4 | – | – |
| what is a factor rate | 90 | 1 | – | – |
| split funding | 30 | 0 | $18.81 | – |
| holdback percentage | 10 | – | – | – |

Most of these are informational and not about MCAs specifically. Each one is a chance to answer the MCA-specific version on a page that also ranks for the broad term:

- "ucc filing" → *a UCC-1 from your funder: what it means and how to get it terminated*
- "confession of judgment" → *which states still allow it in MCA contracts*

#### H. Industries

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| auto repair shop financing | 3,600 | 16 | $10.19 | +19% |
| food truck financing | 2,400 | 6 | $10.49 | -56% |
| semi truck financing | 1,900 | 18 | $16.88 | -23% |
| dental practice financing | 1,000 | 6 | $56.18 | -36% |
| contractor financing | 720 | 20 | $86.11 | +55% |
| gas station financing | 590 | 0 | $69.68 | -82% |
| trucking business loans | 390 | 10 | $65.81 | +4% |
| restaurant business loans | 320 | 15 | $82.42 | +6% |
| construction business loans | 320 | 0 | $63.02 | -46% |
| medical practice loans | 320 | 27 | $74.65 | -22% |
| franchise financing | 260 | 7 | $20.06 | -59% |
| auto dealer floor plan financing | 210 | 4 | $19.29 | -23% |
| restaurant financing | 140 | 15 | $172.40 | – |
| salon business loans | 140 | 1 | $26.08 | – |
| hotel financing | 140 | 0 | $47.47 | – |
| retail business loans | 110 | 10 | – | – |
| amazon seller loans | 110 | 1 | $44.37 | – |
| pharmacy loans | 110 | 0 | $20.31 | – |
| gym financing | 110 | 0 | $4.20 | – |
| ecommerce business loans | 90 | 0 | $54.20 | – |
| bar financing | 90 | 0 | – | – |
| plumbing business loans | 90 | 0 | – | – |
| veterinary practice loans | 70 | 1 | $382.95 | – |
| daycare business loans | 50 | 0 | $66.95 | – |
| landscaping business loans | 30 | 0 | $53.01 | – |
| owner operator loans | 30 | 0 | $51.30 | – |
| convenience store financing | 20 | 0 | – | – |

#### I. States and state law

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| business loans florida | 480 | 4 | $96.18 | -71% |
| business loans texas | 390 | 15 | $48.18 | -46% |
| business loans california | 320 | 31 | $121.19 | -46% |
| business loans new york | 170 | 34 | $48.86 | – |
| business loans georgia | 170 | 5 | $41.61 | – |
| business loans new jersey | 110 | 0 | $82.60 | – |
| business loans illinois | 90 | 0 | $52.84 | – |
| merchant cash advance new york | 70 | 3 | $25.72 | – |
| merchant cash advance texas | 30 | 9 | $72.00 | – |
| merchant cash advance florida | 30 | 0 | $77.10 | – |
| merchant cash advance california | 10 | 0 | $15.59 | – |
| texas hb 700 | 30 | 0 | – | – |
| florida commercial financing disclosure law | 20 | 0 | – | – |
| california sb 1235 | 10 | 14 | – | – |
| new york commercial finance disclosure law | 10 | 0 | – | – |

State business-loan terms carry **HIGH** paid competition (Florida, Texas, California, Georgia, New Jersey), but organic difficulty is low (KD 0–15, California 31). The disclosure-law terms have little search volume. Their value is as citable pages for AI answers and as link targets for brokers, attorneys and journalists.

#### J. Partner, broker and ISO

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| business loan broker | 720 | 0 | $27.63 | +29% |
| mca broker | 480 | 0 | $50.20 | -62% |
| merchant cash advance leads | 260 | 0 | $30.40 | -13% |
| how to become a business loan broker | 90 | 0 | $12.42 | – |
| iso agreement | 50 | 0 | – | – |
| mca iso | 40 | 0 | $27.44 | – |
| iso merchant cash advance | 20 | 0 | $38.97 | – |
| loan referral program | 20 | 0 | – | – |
| loan broker commission | 10 | 64 | $7.01 | – |
| business loan broker commission | 10 | 0 | – | – |

#### K. Built-in processor financing (MCA-like products merchants already know)

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| paypal working capital | 2,900 | 9 | $72.79 | -54% |
| stripe capital | 2,400 | 7 | $30.62 | +7% |
| square capital | 1,300 | 3 | $29.60 | -13% |
| shopify capital | 880 | 2 | $54.58 | -17% |
| toast capital | 720 | 0 | $16.05 | +42% |
| amazon lending | 720 | 0 | $20.61 | +14% |

PayPal Working Capital, Stripe Capital, Square Loans, Shopify Capital and Toast Capital are all repaid from sales, so they work much like an MCA. A merchant searching for them is already looking at revenue-based financing.

Pages to write:

- "How PayPal Working Capital works, and what to do when it isn't enough"
- "Toast Capital alternatives for restaurants"
- "Shopify Capital vs. a merchant cash advance"

Keep the comparisons factual and dated. They are fine to publish under nominative fair use as long as the facts are right and you don't imply affiliation.

#### L. Competitor brand searches

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| national funding reviews | 1,600 | 0 | $56.76 | +4% |
| lendio reviews | 1,300 | 5 | $152.13 | -20% |
| fora financial reviews | 590 | 7 | $31.47 | -12% |
| rapid finance reviews | 390 | 5 | $40.13 | +118% |
| kapitus reviews | 390 | 0 | $45.32 | -29% |
| credibly reviews | 320 | 9 | $58.06 | -5% |
| fundbox alternatives | 50 | 0 | $188.35 | – |
| bluevine vs ondeck | 20 | – | $51.74 | – |
| ondeck alternatives | 10 | – | – | – |
| kabbage alternatives | 10 | 12 | – | – |

There is real volume behind competitor "reviews" searches (National Funding 1,600, Lendio 1,300), but writing reviews of competitors reads as self-serving, and AI engines discount it.

- Better: one fair **"How Ventra Fund compares"** page with a factual table: requirements, amounts, speed, how you pay it back, whether there's a personal guarantee.
- Also make sure "Ventra Fund reviews" has something to find: Trustpilot, Google Business Profile, BBB.

#### M. Broad head terms (long-term only)

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| small business loans | 165,000 | 65 | $69.42 | +389% |
| sba loan | 135,000 | 34 | $30.78 | +7% |
| small business grants | 40,500 | 0 | $10.18 | +15% |
| sba loan requirements | 9,900 | 23 | $20.01 | +131% |
| business funding | 4,400 | 44 | $169.59 | -6% |
| startup business loans | 4,400 | 38 | $20.85 | -33% |
| best small business loans | 2,900 | 38 | $124.72 | 0% |
| small business funding | 2,400 | 51 | $93.85 | -29% |
| best business loans | 1,900 | 38 | $122.65 | -53% |
| online business loans | 3,600 | 49 | $161.41 | -92% |
| commercial loan | 4,400 | 0 | $31.58 | -6% |
| business capital | 1,000 | 12 | $133.83 | -21% |
| alternative financing | 320 | 5 | $23.42 | +431% |
| alternative business lending | 320 | 8 | $82.27 | -75% |

- "small business loans" (165,000, KD 65) and "sba loan" are dominated by the SBA, banks and NerdWallet.
- Don't target them head-on. Win the cluster around them, and link SBA content where it explains when SBA beats an MCA.
- "small business grants" (40,500, KD 0) is off-strategy: grant seekers don't convert to financing.

---

## 4. The competitive landscape

### 4.1 What the 12 competitors publish

| Site | Content hubs | Calculators | State pages | Industry pages | Original data |
|---|---|---|---|---|---|
| **Biz2Credit** | 2,874 URLs; a 40-page MCA hub, including stacking, factor rate vs interest, renegotiating after default and escaping the MCA cycle; a business-loan consolidation hub; 140 "vs" and 115 "best" pages | Business loan calculator + cluster | 125+ state and city pages | 471 industry URLs | SMB Credit Report (quarterly), SMB Earnings Report, Women-Owned Business Study |
| **Lendio** | 1,155 URLs; guides, 23 "vs", "best" posts, fundability assessment | 7-tool hub, incl. ACH / daily-repayment calculator | Customer stories by state | 100+ industry pages | Surveys and studies hub |
| **Bluevine** | 952 URLs; 41 "vs", ~199 "best", glossary | None (guides only) | 50 "best bank for small business in {state}" pages | ~55 | BOSS Report 2024–2026, several surveys |
| **Fora Financial** | 834 URLs; 225+ working-capital posts, 33 "vs", 19 "best", MCA pillar | Funding-estimate calculator | 12+ state pages | Industries hub | Business Insights Report 2025/2026, pulse survey |
| **Credibly** | Blog with comparison posts ("how to compare offers", "how to read a financing agreement") | **Best lender stack:** MCA, working capital, equipment, long-term, payment calculators | – | ~38 | Small Business Trends Report 2024/2025 |
| **OnDeck** | 17+ `/loantype-*` pages: MCA, bad credit, no credit check, trucking, restaurant, medical, contractors… | Business loan, profit margin | CA, FL, TX | Via loantype pages | BIPOC business report, trend report |
| **Nav** | Large blog with named authors; business-credit hubs | **MCA APR, invoice-financing APR, term-loan APR calculators** | Blog posts | Blog posts | No standalone reports |
| **National Funding** | Product-first; /learn hub | None | 33 location pages | ~28 industries, each crossed with product types | None |
| **Kapitus** | Pillar blog (cash-flow cluster, industry challenges) | Equipment financing | Tags only | Blog | None |
| **Rapid Finance** | Solutions hub plus MCA blog pillar | None | None | Blog | None |
| **Fundbox** | 287 URLs; product pages, small blog, podcast | None | None | ~11 | 2022 survey |
| **Become** | 72 URLs; loan-type pages plus 11 industry pages | LendingScore (profile score) | None | 11 | None |

What the table shows:

- **Location and industry pages are table stakes.** Every big player has them, but most are thin templates. The way to beat them is real substance on each page (section 8.4).
- **The MCA-cost calculator layer is contested** (Credibly, Nav), but a calculator that shows factor rate, total payback, daily/weekly payment and estimated APR, with the state-disclosure context beside it, doesn't exist yet.
- **Almost no direct lender covers MCA consolidation seriously.** Only Biz2Credit and OnDeck have on-page content; Fora has one post. That leaves the gap from 3.2B open.

### 4.2 Who wins the "best X" queries AI engines love

| Query class | Who ranks | How to get in |
|---|---|---|
| "best merchant cash advance companies" | NerdWallet (picks include Forward Financing, Uplyft, Giggle Finance, Fundomate, Fora). Niche affiliates: ModernWallet, FundingCompass, LendingTree's dated MCA page, CNBC Select (4 picks). Funder listicles: Byzfunder, Quickie, Clarify Capital, Elite Funders. | Pitch the niche affiliates directly. Go through NerdWallet's partner/affiliate route. NerdWallet scores 6 categories: cost, transparency, underwriting flexibility, credit, application experience, customer service. It has a 4-star minimum. |
| "best business loans for bad credit" | NerdWallet (2 URLs), Bankrate, Forbes Advisor (25 lenders × 21 metrics), Finder, CNBC Select (OnDeck, National Funding; Biz2Credit and Bluevine as paid placements), WSJ Buy Side | Mostly affiliate and CPA relationships. Forbes Advisor placements run through affiliate networks. |
| "MCA debt relief" | Specialist relief firms' own content and listicles. MCA Settlement Reviews is the only independent comparison site. | Rank with your own content. Mainstream media is absent, which is why this is priority #2. |

---

## 5. Technical fixes (do these first)

### 5.1 Decide the AI crawler policy (Cloudflare dashboard, not the repo)

Cloudflare's managed robots.txt and its AI-bot block are on for the zone. Search and answer crawlers get through: OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot. Training and grounding crawlers are refused.

| Crawler | What it controls | Now | Recommendation |
|---|---|---|---|
| OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot | Showing up in ChatGPT search, Claude search, Perplexity, Google (incl. AI Overviews and AI Mode), Bing / Copilot | Allowed | Keep |
| **Google-Extended** | Gemini training **and grounding in the Gemini app** and Vertex AI. It does not affect Search or AI Overviews. | Disallowed | **Allow.** Gemini cites about 10 pages per answer, more than any other engine. |
| **GPTBot**, **ClaudeBot** | Model training: whether ChatGPT and Claude "know" Ventra Fund without searching | Disallowed + 403 | **Allow.** A brand nobody has heard of gains more from being known than it loses by having its marketing copy learned. |
| Bytespider, CCBot, Diffbot, scrapers | Third-party datasets | Disallowed | Your call; little upside |

- Also consider adding `ai-input=yes` to the Content-Signal line; today it is unset.
- **Where to change it:** in the zone's AI Crawl Control / Bots settings, turn off "Block AI bots" for the crawlers you want and edit the managed robots.txt.
- Cloudflare prepends its managed block to any `public/robots.txt` you add, so you can still ship your own `Sitemap:` line.

### 5.2 Sitemap and robots.txt in the repo

- Add `@astrojs/sitemap`. `site` is already set to `https://ventrafund.com` in `astro.config.mjs`.
- Exclude `/admin/**`, `/sign/**`, `/api/**`, `/partner/login`, `/search` and `/404`.
- Add `public/robots.txt` with `Sitemap: https://ventrafund.com/sitemap-index.xml` and disallow rules for `/admin/`, `/api/`, `/sign/`.
- Submit the sitemap in **Google Search Console** and **Bing Webmaster Tools**. Bing feeds Copilot, and its AI Performance report shows Copilot citations for free.
- Turn on Cloudflare **Crawler Hints / IndexNow** so Bing learns about updates the moment they ship.

### 5.3 Remove the 307 redirect behind every internal link

- **The problem:** internal links such as `/capital/merchant-cash-advances` and `/who-we-fund/restaurants` 307 to the trailing-slash URL. A temporary redirect on every internal link wastes crawl budget, and it leaves search engines unsure which URL is canonical.
- **Option A (least churn):** set `build: { format: "file" }` in `astro.config.mjs`. Pages become `capital/merchant-cash-advances.html`, and Workers static assets serve them at the no-slash URL that the nav already uses.
- **Option B:** set `trailingSlash: "always"` and update every internal link.
- **Either way:** emit a `<link rel="canonical">` in the chosen form, then check with `curl -I` on a Preview that internal links return 200 directly.

### 5.4 Head tags (`src/layouts/Layout.astro`, `PageShell.astro`)

- **Description:** add a `description` prop (≤155 characters, written per page) and render `meta name="description"`, `og:title`, `og:description`, `og:url` and `canonical`.
- **Home title:** change it to something like *"Ventra Fund | Working Capital & Merchant Cash Advances for Small Business"*.
- **Product titles:** they currently read "Merchant Cash Advances | Ventra Fund". Lead with the searched phrase and a benefit, e.g. *"Merchant Cash Advance: Funding in 24 Hours, Credit from 450 | Ventra Fund"*.

### 5.5 Structured data (JSON-LD)

Do this for consistent, machine-readable facts, not for a ranking boost. Ahrefs' controlled test (May 2026, 1,885 pages) found schema moved AI citations by roughly ±2–5%, which is within noise.

| Schema | Where | Notes |
|---|---|---|
| `Organization` (or `FinancialService`) | Every page | Name "Ventra Fund", legal name, URL, logo, contact, `sameAs` to real profiles (LinkedIn, Crunchbase, Trustpilot, BBB, Google Business Profile) as they come online. This is the main tool for telling the brand apart from other "Ventra"s. |
| `WebSite` | Home | Name, URL, site search action for `/search`. |
| `BreadcrumbList` | All nested pages | Mirrors the nav hierarchy. |
| `FinancialProduct` / `LoanOrCredit` | `/capital/*` | Amount range, term, `feesAndCommissionsSpecification`, requirements. Pull from `funding-products.ts` so it can't drift from the copy. |
| `Article` + `Person` (author and reviewer) | `/resources/*` | `datePublished`, `dateModified`, author `sameAs`. In one study, named-expert pages were cited 72% of the time vs 25% for unattributed pages. |
| `FAQPage` | FAQ, product and article FAQ blocks | Google retired FAQ rich results in May 2026 but still reads the markup. It's cheap, so keep it. |
| `Review` / `AggregateRating` | **Not yet** | Only when the reviews are real and verifiable. Marking up placeholder testimonials breaks Google's review-snippet policy and the FTC's 2024 fake-review rule. |

### 5.6 Smaller items

- **Article model:** add `updated`, `author` and `reviewedBy` fields to `Article` in `src/data/articles.ts`, and render a visible "Last updated" date. In the studies, freshness is the strongest on-page predictor of AI citation: pages updated within 30 days earned 3.2× more citations, and `dateModified` correlated r = 0.68 with being cited.
- **`llms.txt`:** optional, and the evidence says it's near-useless. In an 83-site log study, OpenAI fetched robots.txt 3,990 times and llms.txt 7 times, and Google says it won't read the file. Publish one only if it takes 10 minutes.
- **Calculators** must keep the explanation and a worked example in the static HTML, because AI crawlers don't run JavaScript. The site's CSP bans inline scripts, so calculator logic ships as bundled module scripts, the way Astro already handles them.

---

## 6. Pages to build, in priority order

Each entry gives the target keywords (volume / KD) and its AEO angle. URL suggestions follow the existing route structure.

### Tier 1: next 30 days (retarget existing pages, plus the debt cluster and calculators)

| # | Page | Target keywords | Notes and AEO angle |
|---|---|---|---|
| 1 | **Rewrite `/debt-relief`** as original copy: "Business & MCA Debt Relief" | mca debt relief (1,000/0), business debt settlement (880/3), business debt negotiation (880/3), mca debt restructuring (480/0, +527%) | The current copy is borrowed (the repo comment says it came from oceandebtrelief.com with the brand swapped), and search engines and AI engines credit the original site. Write it fresh. Explain plainly: who does the work (disclose the partner relationship), fees, timeline, effect on credit, when relief is the *wrong* choice. Answer-first opening, options comparison table, citations to DFPI/FTC. |
| 2 | **Retarget `/capital/consolidations`** → "MCA Debt Consolidation" (consider slug `mca-debt-consolidation` with a 301 redirect from the old URL) | mca debt consolidation (880/0, +353%), business debt consolidation (1,000/0), mca consolidation (90, $214 CPC), merchant cash advance consolidation | Before/after payment table: 3 stacked positions vs one. Explain how consolidation differs from **reverse consolidation**. Eligibility. Honest "when consolidation doesn't help" section; the ranking competitor's headline is literally *"MCA Debt Consolidation Rarely Works"*. |
| 3 | **New article: "Reverse consolidation, explained"** | reverse consolidation (110/0, **$170 CPC**), reverse consolidation mca (40) | Worked numbers; risks; how it differs from a buyout. |
| 4 | **New article: "Can't make your MCA payment? Your options, in order"** | how to get out of merchant cash advance, merchant cash advance default (Trends rising +100%), mca default, stop mca payments | Steps in order: ask for reconciliation (cite DFPI) → negotiate → consolidate / refinance → settle → legal. What a funder can do (UCC lien, confession of judgment where legal, UCC 9-406 notices). Don't stack. |
| 5 | **MCA cost calculator** `/resources/calculators/mca-calculator` | mca calculator (1,300/0), merchant cash advance calculator, factor rate calculator, factor rate to apr, "MCA APR calculator" (related) | Inputs: advance, factor rate, term or holdback %, payment frequency. Outputs: total payback, cost of capital, daily/weekly payment, **estimated APR**. Static worked example plus a link to the existing factor-rate article. |
| 6 | **Business loan calculator** | business loan calculator (14,800/34) | Fixed-payment amortization for term financing; compare with an MCA side by side. |
| 7 | **DSCR calculator + "What is DSCR" explainer** | dscr calculator (3,600/0), debt service coverage ratio (22,200/31) | The same page can rank for both. Show what DSCR lenders want and what an MCA funder looks at instead (deposits). |
| 8 | **Line of credit calculator** | line of credit calculator (1,600/0) | Draw/repay schedule; cost on usage only. |
| 9 | **Retarget `/capital/term-financing`** | business term loan (12,100/27), short term business loan (1,600/22), unsecured business loan (1,900/1) | H1/title use "business term loan"; FAQ answers "what are typical terms". |
| 10 | **Retarget `/capital/lines-of-credit`** | business line of credit (14,800/42), how to get a business line of credit (880/34), business line of credit requirements (480, Trends +120%), business line of credit bad credit (590/28) | Requirements table (580 score, $8k/mo, 6 months) above the fold; PAA answers. |
| 11 | **Retarget `/capital/cash-credit`** → "Asset-Based Line of Credit" | asset based lending (5,400/33), accounts receivable financing (1,300/0), inventory financing (390/0), asset based line of credit | Keep "cash credit" as a secondary mention. |
| 12 | **Expand `/capital/merchant-cash-advances`** | merchant cash advance (5,400/29), mca loan (3,600/33), mca lenders (3,600/16), merchant cash advance lenders (880/19), what is a merchant cash advance (480, +224%) | Add the one-sentence definition at the top. Add a "how a holdback works" table with numbers, "Is an MCA legal? Is it a loan?" sections (PAA), and links to the calculator and the state law hub. |

### Tier 2: 30–90 days (topic hubs that compound)

| # | Page / hub | Target keywords | Notes |
|---|---|---|---|
| 13 | **State disclosure law hub** `/resources/commercial-financing-disclosure-laws` + one page per state | texas hb 700, california sb 1235, florida commercial financing disclosure law, new york commercial finance disclosure law + "{state} merchant cash advance law" long tail | Cover NY, CA, UT, VA, FL, GA, CT, KS, MO, TX, LA, with VT due July 2027. For each: what must be disclosed, thresholds ($500K in CA/FL/GA/KS/VA; NY up to $2.5M), registration (UT and VA; TX by Dec 31, 2026), the regulator, effective date, link to the statute. Use Venable's March 2026 summary as the anchor source. Add a "what your offer from us will show" box. Reviewed by counsel. This is the most citable asset Ventra can own. |
| 14 | **State funding pages** `/business-funding/{state}`, starting with FL, TX, CA, NY, GA, NJ, IL, VA | business loans florida (480/4), texas (390/15), california (320/31), new york (170/34), georgia (170/5), new jersey (110/0), illinois (90/0) | Each page has to carry substance a template can't fake: that state's disclosure rules, the industries Ventra funds there, real (anonymized) deal examples, state SBA/CDFI resources. Expand only where there is something real to say (see 8.4). |
| 15 | **Industry expansion** `/who-we-fund/{industry}` | auto repair (3,600/16), food truck (2,400/6), semi truck / owner-operator (1,900/18), dental (1,000/6), contractors (720/20), gas stations & c-stores (590/0), salons (140), hotels (140), gyms (110), pharmacies (110), veterinary (70, **$383 CPC**), e-commerce / Amazon sellers (90 + 110), franchise (260/7) | Split "healthcare" into dental, medical practice (320/27) and veterinary. Retitle construction as "Construction & Contractor Financing". Each page needs that industry's cash-flow pattern, typical use of funds, a sample offer and an industry FAQ. Link industries to products the way National Funding does (/who-we-fund/trucking + the MCA product). |
| 16 | **Glossary hub** `/resources/glossary` + full pages for the big terms | ucc filing (12,100/23), ucc lien (5,400/28), personal guarantee (1,900/18), what is a personal guarantee (880), confession of judgment (1,300/0), prepayment penalty (2,400/21), net working capital (4,400/5), cash conversion cycle (3,600/24), working capital ratio (1,000/12), factor rate, holdback, split funding, ACH financing (260/0), stacking, reconciliation, buy rate | Short definition first (the snippet / AI-extract target), then the MCA-specific angle. Each entry links to the product or calculator it relates to. |
| 17 | **Built-in processor financing comparisons** | paypal working capital (2,900/9), stripe capital (2,400/7), square capital (1,300/3), shopify capital (880/2), toast capital (720/0), amazon lending (720/0) | One page per provider: how it works (holdback, fees, eligibility, cited to the provider's own docs), when to use it, when an independent MCA/line beats it, and a comparison table. Toast and Square pages link into restaurants and retail. |
| 18 | **"vs" articles** | business line of credit vs loan (320/0), business credit card vs line of credit (260/0), merchant cash advance vs business loan, factor rate vs interest rate, secured vs unsecured business loan, MCA vs revenue-based financing (head term 1,300/12), MCA vs invoice factoring (head term 2,400/24), SBA loan vs MCA | Comparisons get cited heavily (ChatGPT cites comparison content 95% of the time in HubSpot's test; "X vs Y" queries trigger AI Overviews 95% of the time). Each needs a consistent comparison table: cost, speed, credit minimum, collateral, how you pay it back. |
| 19 | **"No personal guarantee" / "no collateral" page** | no personal guarantee business loan (880/0), business loan without collateral (1,000/12, +279%), unsecured business loan (1,900/1) | Only if every product it names really comes without a personal guarantee. Otherwise say exactly which products do. |
| 20 | **Qualifying and requirements guide** | how to get a business loan (9,900/43), business loan requirements (1,900/25), how to qualify for a business loan (590/21), easiest business loan to get (320/26), business loan for llc (5,400/34), what credit score do you need for a business loan | Requirements table across all 5 products (already in `funding-products.ts`), plus the PAA-style questions as H2s. |
| 21 | **Fast-funding guide** | fast business loans (2,900/45), same day business loans (1,300/8), emergency business loan (260/25, +106%), payroll loan (590/4) | What "same day" really means (approval vs. funds in the account); the documents that speed it up (bank statements, which the apply form already parses). |
| 22 | **"How Ventra Fund compares"** | competitor "reviews" searches (section 3.2 L) | One factual table vs. 5–6 named competitors. Refresh quarterly. |

### Tier 3: 90 days and on (authority and distribution)

| # | Page / asset | Why |
|---|---|---|
| 23 | **Annual "State of Small Business Funding" report** from anonymized application and funding data: approval rates by industry and state, median advance, time to fund, deposits-to-advance ratios, share of applicants carrying stacked positions | Original statistics are the most-cited content an individual company can produce (the Princeton/IIT GEO study measured a +31% visibility lift from adding statistics). Journalists and roundup writers need a source. Publish the method; gate nothing. |
| 24 | **Broker and ISO resources** `/partners/brokers/guide` | business loan broker (720/0), mca broker (480/0), merchant cash advance leads (260/0), how to become a business loan broker (90/0), iso agreement (50) |
| 25 | **Owner stories** by industry and state (real, permissioned) | Experience signal for Google's YMYL quality guidelines; quotable for AI answers; feeds industry and state pages. |
| 26 | **YouTube explainers** (2–4 min): factor rate explained, how a holdback works, reconciliation rights, consolidation math | YouTube is the #1 cited domain in Google AI Overviews and big in Perplexity. Captions and transcripts are what get read. Embed each video on its matching page. |

### Blog post backlog: question-led, answer in the first two sentences

Taken from People Also Ask, Google Trends rising queries and the zero-volume questions people actually ask. Most of these are low-volume on their own, but they are exactly the prompts people type into ChatGPT.

**MCA basics**

- Is a merchant cash advance legal?
- Is an MCA a loan?
- What does MCA stand for in banking?
- How much does a merchant cash advance really cost? (worked examples at factor 1.15 / 1.30 / 1.45)
- Does a merchant cash advance affect your credit score?
- Can you pay off a merchant cash advance early, and do you save anything?
- What is a good factor rate in 2026?
- What is a holdback percentage, and can you change it?

**Debt and default**

- What happens if you default on a merchant cash advance?
- Can an MCA company sue you, and what is a confession of judgment?
- What is MCA stacking, and why do funders care about your other positions?
- Second-position MCAs: how they work and what they cost
- MCA renewals: when to take one and when to walk away
- How to read an MCA contract: the 10 clauses that matter
- How to compare two funding offers side by side (total payback, payment, term, APR)

**Applying**

- How many bank statements do you need for business funding? (refresh the existing article)
- What lenders look at in your bank statements (refresh the existing article)
- Why was my business loan denied, and what to fix before reapplying
- Business funding with a 500 credit score: what's realistic
- How fast can you get business funding? A day-by-day timeline

**Planning**

- Seasonal business? Plan funding before the slow months (refresh the existing article; tie it to Trends seasonality)
- Business line of credit requirements in 2026 (Trends +120%)
- Cash flow forecast template for small businesses (2,400/18, with a downloadable template)

---

## 7. Off-site: where AI answers actually come from

### 7.1 What the studies say

- **Own-site share is small.**
  - Toronto/Similarweb, 143K answers, 2026: in consumer markets, third-party sites get 75% of citations, competitors 13.8%, the brand's own site 11.1%. In a niche B2B market, own-site share was 2.6%.
  - Airefs puts the average brand's own-site share at 1.4% of ChatGPT and 1.8% of AI Overview citations.
- **Banking specifically** (5WPR, 31,500 prompts):
  - Wikipedia 19.3%, Bankrate 17.8%, Investopedia 14.2%, NerdWallet 9.6%
  - all bank-owned domains together: 6.8%
- **Listicles dominate.** Otterly found 66.6% of AI-cited pages were listicles. In finance, more than half of citations to listicles and comparison pages go to publishers that disclose affiliate earnings.
- **Each engine draws on different sources:**

| Engine | What it leans on | What it means for Ventra |
|---|---|---|
| Google AI Overviews | YouTube, Reddit, Wikipedia; blog posts cited 42% of the time. Only 37% of cited URLs rank in the top 10. | Rank-11-to-30 pages can still be cited. Video and Reddit matter. |
| ChatGPT | Wikipedia, news; tolerant of formats (comparison content cited 95% of the time); about 2 citations per answer | Comparison pages, plus being in the roundups ChatGPT reads |
| Perplexity | Reddit (46.7% of top-10 source share), YouTube | Reddit presence |
| Gemini | Reddit (22.6%), review and comparison sites; about 10 citations per answer | **Needs Google-Extended allowed** (5.1) |
| Claude | Brand and product domains are 64% of citations; Reddit zero. But it won't cite a brand's self-description without third-party backing. | The engine that rewards Ventra's own site most, once outside validation exists |
| Copilot | 48.5% of citations go to rankings and comparison pages; grounded in Bing | Bing Webmaster Tools; comparison pages |

- **Clicks are falling; being cited pays.**
  - AI Overviews cut organic CTR on affected queries by 58–61% (Ahrefs, Seer).
  - **Brands cited inside the AI Overview get 35% more organic clicks** than uncited brands on the same queries (Seer).
  - BrightEdge found AI Overviews on 67% of educational finance queries and 62% of credit/debt queries.

### 7.2 Get into the roundups (highest leverage)

1. **Write a one-page product fact sheet** structured around NerdWallet's six evaluation categories (cost, transparency, underwriting flexibility, credit, application experience, customer service). Include exact, quotable numbers from `funding-products.ts`: amounts, factor rates from 1.15, time to fund, minimums. Publishers reuse structured inputs.
2. **Niche MCA roundups first:** ModernWallet, FundingCompass, Byzfunder, Quickie, Clarify Capital, LendingTree's MCA page, Finder. They are reachable and they feed AI answers on "best MCA".
3. **Then the big affiliate publishers:** NerdWallet, Bankrate, Forbes Advisor, CNBC Select. These run through affiliate networks on CPA deals, so budget for it.
4. **MCA debt relief comparisons:** MCA Settlement Reviews, Business Debt Adjusters' "20 compared". Only if Ventra (or its partner) actually does the work.

### 7.3 Reviews, community and press

- **Reviews:** Trustpilot, Google Business Profile and BBB, plus Crunchbase and LinkedIn for entity data. Ask funded customers for reviews by default. These profiles become the `sameAs` links in the Organization schema. (The footer social links stay `#` until the real profiles exist.)
- **Reddit:** one named, disclosed Ventra team member answering in r/smallbusiness, r/Entrepreneur, r/sweatystartup, r/Truckers and r/restaurateur. No links unless asked. Answer the default / reconciliation / stacking questions honestly. Perplexity and AI Overviews weight Reddit heavily.
- **Press:** pitch trade outlets (deBanked, ABL Advisor) and local business journals with the data report (#23) and state-law updates.
- **Partners:** brokers and referral partners (accountants, bookkeepers) linking to calculators and guides is a natural, relevant link source.

### 7.4 Make the brand unambiguous

"Ventra" is a crowded name. Use the full name "Ventra Fund" every time, never "Ventra" alone.

- Keep one consistent description everywhere, e.g. *"Ventra Fund is a US small-business funding company offering merchant cash advances, term financing, lines of credit and MCA consolidation."* Use it in the Organization schema, on About, and on LinkedIn, Crunchbase, Trustpilot and Google Business Profile.
- AI engines cross-check facts across sources. Inconsistent numbers or claims get dropped or mixed up with other companies.

---

## 8. Content standards (finance is a high-scrutiny topic)

### 8.1 People

- **Named author plus a named reviewer** (underwriting, risk or counsel) on every article and money page, with a short bio and credentials. They must be real, verifiable people.
- In one study, 76% of AI-cited content had attributed authors. Google's quality-rater guidelines hold finance pages to "very high" standards, and rate purely AI-generated pages without human review as **Lowest**.

### 8.2 Structure every page for extraction

- The direct answer goes in the **first 1–3 sentences**. About 44–55% of cited passages come from the first 30% of the page.
- Use question-style H2s and H3s (7–15 H2s on long guides).
- Use at least one **table** (ChatGPT is 2.3× more likely to cite content with tables), with consistent columns: cost, speed, credit minimum, collateral, how you pay it back.
- Add **statistics, quotations from named people and outbound citations** to primary sources: statutes, DFPI, FTC, CFPB, SBA. In the GEO study these lifted visibility 30–40% overall, and **about 100–115% for pages ranked around #5**, which is where a challenger sits.

### 8.3 Freshness

- Visible "Last updated" date and `dateModified` on every page.
- Refresh money pages and calculators quarterly, and the state-law hub whenever a law changes.
- Put the year in a title only if the page really gets refreshed every year.

### 8.4 Programmatic pages (states, industries)

- Google's scaled-content-abuse policy targets template pages that only swap the name. Each state or industry page needs facts that exist only for that state or industry: the law, the cash-flow pattern, real anonymized deal data, a local FAQ.
- Ship 8 strong pages before 50 thin ones.

### 8.5 Compliance (YMYL)

- Never call a factor rate an "interest rate" (California SB 362).
- Show APR where state law requires it.
- Hedge "no credit check", "no personal guarantee" and "same day" claims exactly as the contracts allow.
- Disclose any partner relationship on debt-relief pages.

### 8.6 No copied copy

The /debt-relief page is the immediate case. Duplicated text gets credited to the original site in both search and AI answers.

---

## 9. Measuring it

- **Google Search Console** (queries, CTR, indexing) and **Bing Webmaster Tools** (including the AI Performance report for Copilot citations, launched Feb 2026). Both are free; set them up before anything ships.
- **Analytics:** segment referrals from `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com` and `claude.ai`. The apply-draft sessions already record referrer and UTM, so AI-referred applications can be counted.
- **AI visibility tracker** (pick one):

| Tool | Entry price |
|---|---|
| Otterly | $29/mo |
| Peec AI | $95/mo |
| Semrush AI Visibility | $99/domain/mo |
| Ahrefs Brand Radar | $199+/mo |

Track citations (link), mentions (name) and sentiment separately. 61.7% of citations never name the brand, and 76.9% of mentions carry no link.

- **Prompts to track** from day one:
  - best merchant cash advance companies
  - best business line of credit for bad credit
  - how do I get out of a merchant cash advance
  - MCA debt consolidation companies
  - what is reverse consolidation
  - is a merchant cash advance a loan
  - how much does a merchant cash advance cost
  - merchant cash advance calculator
  - business funding for restaurants / trucking / auto repair shops
  - Texas merchant cash advance law
  - California commercial financing disclosure
  - alternatives to Shopify Capital / PayPal Working Capital / Toast Capital
  - Ventra Fund reviews
  - is Ventra Fund legit
- **Rank tracking:** the money keywords from Tier 1 and the cluster tables in section 3.2, monthly.

---

## 10. Sources

**Keyword and SERP data** (pulled Nov 9–10, 2026): DataForSEO Google Ads search volume and keyword difficulty (US, en); Serpstat related keywords (g_us); Google Trends via Firecrawl (US, 5-year and 12-month); DataForSEO Google organic SERPs for 8 keywords; Firecrawl and web search results.

**AI search behavior**
- Own-site vs third-party citations (Toronto/Similarweb): https://aisearch.similarweb.com/blog/own-site-vs-third-party-citations
- Airefs citation sources: https://getairefs.com/blog/ai-search-citation-sources-statistics
- 5WPR Banking AI Visibility Index 2026: https://www.5wpr.com/ai-visibility-index/banking-ai-visibility-index-2026
- The Financial Brand on bank AI visibility: https://thefinancialbrand.com/news/bank-marketing/ai-visibility-banks-cards-198295
- Ahrefs, most-cited domains in AI assistants: https://ahrefs.com/blog/top-10-most-cited-domains-ai-assistants
- Ahrefs, AI Overview citations vs top 10: https://ahrefs.com/blog/ai-overview-citations-top-10
- Profound, platform citation patterns: https://www.tryprofound.com/blog/ai-platform-citation-patterns
- HubSpot, content formats that earn citations: https://blog.hubspot.com/marketing/content-format-types-that-earn-citations
- Otterly, content types cited by AI: https://otterly.ai/blog/content-types-cited-by-ai-study
- Otterly, Claude citation study: https://otterly.ai/blog/claude-ai-citation-study
- Surfer, Gemini citations: https://surfer.ai/blog/most-cited-domains-gemini
- Archipel, Copilot citations: https://www.archipelmarketing.com/en/observatory/engines/copilot
- Semrush, ghost citations: https://www.semrush.com/blog/the-ghost-citations-study
- Comparison tables and AI search: https://betteraisearch.com/tactics/comparison-tables-ai-search
- Author bios and AI search: https://betteraisearch.com/tactics/author-bio-ai-search
- Dates and statistics: https://betteraisearch.com/tactics/dates-statistics-ai-search
- CXL, AI Overview citation sources: https://cxl.com/blog/google-ai-overview-citation-sources
- GEO paper (Princeton/IIT Delhi) summary: https://www.elementera.com/blog/generative-engine-optimization-what-geo-aeo-ai-search-paper-shows-your-business
- Schema test discussion: https://www.easternstandard.com/blog/structured-content-for-ai-search
- FAQ rich results removed: https://www.elementera.com/blog/google-has-removed-faq-rich-results
- llms.txt server-log study: https://www.ezy.ai/research/do-ai-bots-read-llms-txt
- JavaScript rendering and AI crawlers: https://blckalpaca.at/en/knowledge-base/seo-geo/technical-seo/javascript-rendering-and-ai-crawlers-the-visibility-divide
- OpenAI crawlers: https://platform.openai.com/docs/bots
- Google common crawlers (Google-Extended): https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
- Ahrefs, AI Overviews reduce clicks: https://ahrefs.com/blog/ai-overviews-reduce-clicks-update
- Seer Interactive, AIO impact on CTR: https://www.seerinteractive.com/insights/aio-impact-on-google-ctr-september-2025-update
- Google Search Quality Rater Guidelines: https://services.google.com/fh/files/misc/hsw-sqrg.pdf

**Competitors and roundups**
- Competitor sitemaps: nationalfunding.com, credibly.com, kapitus.com, forafinancial.com, rapidfinance.com, lendio.com, bluevine.com, ondeck.com, fundbox.com, biz2credit.com, nav.com, become.co
- NerdWallet best MCA companies: https://www.nerdwallet.com/business/loans/best/merchant-cash-advance-companies
- NerdWallet best business loans (methodology): https://www.nerdwallet.com/business/loans/best
- CNBC Select best MCAs: https://www.cnbc.com/select/best-merchant-cash-advances/
- CNBC Select bad-credit business loans: https://www.cnbc.com/select/best-business-loans-for-bad-credit/
- Bankrate bad-credit business loans: https://www.bankrate.com/loans/small-business/bad-credit-business-loans/
- Forbes Advisor bad-credit business loans: https://www.forbes.com/advisor/business-loans/best-business-loans-for-bad-credit/
- Finder bad-credit business loans: https://finder.com/business-loans/best-bad-credit-business-loans
- LendingTree MCAs: https://www.lendingtree.com/business/merchant-cash-advance
- ModernWallet MCA roundup: https://themodernwallet.com/roundup/best-merchant-cash-advance-companies
- FundingCompass MCA providers: https://fundingcompass.guide/compare/best-merchant-cash-advance-providers
- Nav calculators: https://www.nav.com/business-loan-calculators/
- Lendio calculators: https://www.lendio.com/business-calculators
- Credibly calculators: https://credibly.com/incredibly/finance-calculators/
- Biz2Credit MCA hub: https://www.biz2credit.com/merchant-cash-advance
- Second Wind Consultants, MCA consolidation: https://secondwindconsultants.com/resource/dont-consolidate-mca-debt-eliminate-it/
- MCA Settlement Reviews: https://mcasettlementreviews.com/
- Business Debt Adjusters, 20 compared: https://businessdebtadjusters.com/best-mca-settlement-companies-2026

**Regulation**
- Venable, state commercial financing disclosure laws (Mar 2026): https://www.venable.com/insights/publications/2026/03/state-commercial-financing-disclosure-laws
- California DFPI MCA advisory: https://dfpi.ca.gov/alert/advisory-to-small-businesses-with-merchant-cash-advance-contracts/
- FTC on unauthorized withdrawals: https://www.consumer.ftc.gov/blog/2020/08/small-businesses-targeted-unauthorized-withdrawals
- CFPB 1071 and MCAs: https://crediblelaw.com/cfpb-1071-rule-merchant-cash-advance-exclusion/

---

## Appendix: all 266 researched keywords

US, Google Ads average monthly searches (Oct 2025 – Sep 2026), DataForSEO keyword difficulty, CPC. "n/a" means Google Ads returned no volume: either too small or a restricted credit category.

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| small business loan | 165,000 | 65 | $69.42 | +389% |
| small business loans | 165,000 | 65 | $69.42 | +389% |
| sba loan | 135,000 | 34 | $30.78 | +7% |
| loan payment calculator | 110,000 | 46 | $3.16 | -12% |
| small business grants | 40,500 | 0 | $10.18 | +15% |
| debt service coverage ratio | 22,200 | 31 | $14.01 | 0% |
| business line of credit | 14,800 | 42 | $213.99 | -24% |
| business loan calculator | 14,800 | 34 | $8.55 | -23% |
| ucc filing | 12,100 | 23 | $6.27 | +6% |
| working capital | 12,100 | 23 | $122.28 | -11% |
| business term loan | 12,100 | 27 | $219.94 | -74% |
| how to get a business loan | 9,900 | 43 | $19.25 | 0% |
| sba loan requirements | 9,900 | 23 | $20.01 | +131% |
| what is working capital | 8,100 | 42 | $30.02 | -11% |
| merchant cash advance | 5,400 | 29 | $68.22 | -13% |
| ucc lien | 5,400 | 28 | $6.58 | 0% |
| asset based lending | 5,400 | 33 | $25.71 | +14% |
| business loan for new business | 5,400 | 43 | $33.87 | -33% |
| business loan for llc | 5,400 | 34 | $57.69 | +7% |
| startup business loans | 4,400 | 38 | $20.85 | -33% |
| equipment financing | 4,400 | 28 | $67.96 | -13% |
| business funding | 4,400 | 44 | $169.59 | -6% |
| net working capital | 4,400 | 5 | – | -2% |
| commercial loan | 4,400 | 0 | $31.58 | -6% |
| mca loan | 3,600 | 33 | $126.06 | +32% |
| online business loans | 3,600 | 49 | $161.41 | -92% |
| dscr calculator | 3,600 | 0 | $3.79 | 0% |
| business credit score | 3,600 | 47 | $25.90 | -34% |
| how to build business credit | 3,600 | 17 | $25.71 | 0% |
| auto repair shop financing | 3,600 | 16 | $10.19 | +19% |
| business loan interest rates | 3,600 | 44 | $19.78 | -42% |
| mca lenders | 3,600 | 16 | $126.06 | +32% |
| veteran business loans | 3,600 | 10 | $14.38 | 0% |
| cash conversion cycle | 3,600 | 24 | $17.58 | -28% |
| fast business loans | 2,900 | 45 | $277.59 | -58% |
| best small business loans | 2,900 | 38 | $124.72 | 0% |
| paypal working capital | 2,900 | 9 | $72.79 | -54% |
| invoice factoring | 2,400 | 24 | $132.80 | +22% |
| small business funding | 2,400 | 51 | $93.85 | -29% |
| food truck financing | 2,400 | 6 | $10.49 | -56% |
| cash flow forecast | 2,400 | 18 | $24.04 | +83% |
| prepayment penalty | 2,400 | 21 | $31.70 | -18% |
| stripe capital | 2,400 | 7 | $30.62 | +7% |
| revolving line of credit | 1,900 | 24 | $20.10 | +5% |
| working capital loan | 1,900 | 34 | $189.77 | +6% |
| how to calculate working capital | 1,900 | 14 | $8.26 | -32% |
| business loan requirements | 1,900 | 25 | $22.82 | -39% |
| business loan no credit check | 1,900 | 9 | $64.74 | -43% |
| unsecured business loan | 1,900 | 1 | $176.65 | -73% |
| semi truck financing | 1,900 | 18 | $16.88 | -23% |
| personal guarantee | 1,900 | 18 | $4.24 | -8% |
| best business loans | 1,900 | 38 | $122.65 | -53% |
| short term business loan | 1,600 | 22 | $220.57 | -44% |
| business loans for women | 1,600 | 19 | $49.57 | -19% |
| line of credit calculator | 1,600 | 0 | $6.03 | -46% |
| national funding reviews | 1,600 | 0 | $56.76 | +4% |
| mca calculator | 1,300 | 0 | $4.58 | -63% |
| confession of judgment | 1,300 | 0 | $0.06 | -17% |
| same day business loans | 1,300 | 8 | $205.45 | -46% |
| revenue based financing | 1,300 | 12 | $147.51 | -36% |
| business acquisition loan | 1,300 | 0 | $42.45 | -33% |
| lendio reviews | 1,300 | 5 | $152.13 | -20% |
| accounts receivable financing | 1,300 | 0 | $153.72 | +13% |
| square capital | 1,300 | 3 | $29.60 | -13% |
| mca debt relief | 1,000 | 0 | $82.04 | +89% |
| business debt consolidation | 1,000 | 0 | $194.15 | +2% |
| dental practice financing | 1,000 | 6 | $56.18 | -36% |
| business loan without collateral | 1,000 | 12 | $56.52 | +279% |
| working capital ratio | 1,000 | 12 | $9.76 | -30% |
| business capital | 1,000 | 12 | $133.83 | -21% |
| mca debt consolidation | 880 | 0 | $65.63 | +353% |
| business debt settlement | 880 | 3 | $33.19 | +217% |
| how to get a business line of credit | 880 | 34 | $46.19 | +24% |
| small business cash advance | 880 | 30 | $94.77 | -68% |
| no personal guarantee business loan | 880 | 0 | $67.17 | -22% |
| average business loan interest rate | 880 | 42 | $14.54 | -23% |
| merchant cash advance lenders | 880 | 19 | $87.90 | +180% |
| business debt negotiation | 880 | 3 | $33.19 | +217% |
| cash flow management | 880 | 37 | $30.69 | +14% |
| what is a personal guarantee | 880 | 28 | $7.67 | +16% |
| shopify capital | 880 | 2 | $54.58 | -17% |
| unsecured business line of credit | 720 | 27 | $213.45 | -33% |
| contractor financing | 720 | 20 | $86.11 | +55% |
| business cash advance | 720 | 19 | $96.47 | -13% |
| business loan broker | 720 | 0 | $27.63 | +29% |
| cash credit | 720 | 0 | $12.70 | +40% |
| best business line of credit | 720 | 34 | $158.76 | -41% |
| amazon lending | 720 | 0 | $20.61 | +14% |
| toast capital | 720 | 0 | $16.05 | +42% |
| merchant cash advance companies | 590 | 30 | $74.83 | +151% |
| business line of credit bad credit | 590 | 28 | $114.89 | 0% |
| payroll loan | 590 | 4 | $72.37 | -42% |
| gas station financing | 590 | 0 | $69.68 | -82% |
| fora financial reviews | 590 | 7 | $31.47 | -12% |
| how to qualify for a business loan | 590 | 21 | $13.85 | +61% |
| private business loans | 590 | 33 | $61.73 | +3% |
| what is a merchant cash advance | 480 | 16 | $62.49 | +224% |
| business line of credit requirements | 480 | 39 | $73.11 | -49% |
| mca broker | 480 | 0 | $50.20 | -62% |
| business loans florida | 480 | 4 | $96.18 | -71% |
| mca debt restructuring | 480 | 0 | $7.12 | +527% |
| purchase order financing | 480 | 0 | $88.07 | +32% |
| working capital line of credit | 480 | 0 | $131.89 | +195% |
| business debt | 480 | 7 | $20.19 | +256% |
| merchant cash advance bad credit | 390 | 12 | $29.73 | -93% |
| trucking business loans | 390 | 10 | $65.81 | +4% |
| inventory financing | 390 | 0 | $81.85 | +6% |
| business loans texas | 390 | 15 | $48.18 | -46% |
| minority business loans | 390 | 16 | $31.66 | +4% |
| rapid finance reviews | 390 | 5 | $40.13 | +118% |
| kapitus reviews | 390 | 0 | $45.32 | -29% |
| commercial financing | 390 | 0 | $33.80 | -8% |
| mca funding | 320 | 15 | $92.61 | -1% |
| business debt relief | 320 | 23 | $123.79 | +32% |
| business line of credit vs loan | 320 | 0 | $57.38 | 0% |
| alternative business lending | 320 | 8 | $82.27 | -75% |
| restaurant business loans | 320 | 15 | $82.42 | +6% |
| construction business loans | 320 | 0 | $63.02 | -46% |
| medical practice loans | 320 | 27 | $74.65 | -22% |
| cash flow loan | 320 | 10 | $35.35 | +5% |
| how much business loan can i get | 320 | 40 | $11.86 | -6% |
| business loans california | 320 | 31 | $121.19 | -46% |
| credibly reviews | 320 | 9 | $58.06 | -5% |
| easiest business loan to get | 320 | 26 | $79.79 | +24% |
| alternative financing | 320 | 5 | $23.42 | +431% |
| merchant cash advance leads | 260 | 0 | $30.40 | -13% |
| emergency business loan | 260 | 25 | $168.57 | +106% |
| ach loan | 260 | 0 | $16.38 | -13% |
| franchise financing | 260 | 7 | $20.06 | -59% |
| business credit card vs line of credit | 260 | 0 | $89.07 | +85% |
| auto dealer floor plan financing | 210 | 4 | $19.29 | -23% |
| factor rate | 170 | 4 | – | – |
| working capital financing | 170 | 4 | $148.96 | – |
| working capital calculator | 170 | 3 | $11.59 | – |
| business loans new york | 170 | 34 | $48.86 | – |
| business loans georgia | 170 | 5 | $41.61 | – |
| how long does it take to get a business loan | 170 | 10 | $17.93 | – |
| merchant cash advance attorney | 170 | 0 | $77.88 | – |
| how to improve cash flow | 170 | 10 | $8.89 | – |
| restaurant financing | 140 | 15 | $172.40 | – |
| salon business loans | 140 | 1 | $26.08 | – |
| hotel financing | 140 | 0 | $47.47 | – |
| mca lawyer | 140 | 1 | $96.66 | – |
| merchant cash advance no credit check | 110 | 14 | $67.04 | – |
| reverse consolidation | 110 | 0 | $170.30 | – |
| small business debt relief | 110 | 15 | $70.75 | – |
| retail business loans | 110 | 10 | – | – |
| payroll financing | 110 | 16 | $204.30 | – |
| business loans new jersey | 110 | 0 | $82.60 | – |
| bridge loan for business | 110 | 4 | $88.89 | – |
| amazon seller loans | 110 | 1 | $44.37 | – |
| pharmacy loans | 110 | 0 | $20.31 | – |
| gym financing | 110 | 0 | $4.20 | – |
| asset based line of credit | 110 | 19 | $15.11 | – |
| what is a factor rate | 90 | 1 | – | – |
| mca consolidation | 90 | 0 | $214.20 | – |
| business loans illinois | 90 | 0 | $52.84 | – |
| ecommerce business loans | 90 | 0 | $54.20 | – |
| bar financing | 90 | 0 | – | – |
| plumbing business loans | 90 | 0 | – | – |
| business debt help | 90 | 17 | $15.50 | – |
| how to become a business loan broker | 90 | 0 | $12.42 | – |
| business loans for self employed | 90 | 9 | $40.02 | – |
| how does a merchant cash advance work | 70 | 18 | $17.65 | – |
| merchant cash advance calculator | 70 | 0 | $3.17 | – |
| merchant cash advance lawsuit | 70 | 0 | – | – |
| merchant cash advance new york | 70 | 3 | $25.72 | – |
| veterinary practice loans | 70 | 1 | $382.95 | – |
| how to get a business loan with no revenue | 70 | 5 | $22.60 | – |
| merchant cash advance default | 50 | 0 | $68.45 | – |
| daycare business loans | 50 | 0 | $66.95 | – |
| iso agreement | 50 | 0 | – | – |
| fundbox alternatives | 50 | 0 | $188.35 | – |
| what credit score do you need for a business loan | 50 | 0 | $8.13 | – |
| best merchant cash advance companies | 40 | 20 | $34.33 | – |
| factor rate calculator | 40 | 4 | – | – |
| merchant cash advance debt relief | 40 | 2 | $29.53 | – |
| reverse consolidation mca | 40 | 0 | $78.26 | – |
| liquor store financing | 40 | 0 | – | – |
| mca default | 40 | 0 | $26.26 | – |
| mca iso | 40 | 0 | $27.44 | – |
| same day merchant cash advance | 30 | 0 | $60.33 | – |
| merchant cash advance consolidation | 30 | 0 | $110.74 | – |
| business loan with 500 credit score | 30 | 6 | $55.51 | – |
| merchant cash advance florida | 30 | 0 | $77.10 | – |
| merchant cash advance texas | 30 | 9 | $72.00 | – |
| owner operator loans | 30 | 0 | $51.30 | – |
| landscaping business loans | 30 | 0 | $53.01 | – |
| split funding | 30 | 0 | $18.81 | – |
| merchant cash advance reviews | 30 | 0 | – | – |
| texas hb 700 | 30 | 0 | – | – |
| factor rate vs interest rate | 30 | 0 | – | – |
| secured vs unsecured business loan | 30 | 13 | $37.78 | – |
| debt consolidation loan for business | 30 | 0 | $177.87 | – |
| how to get out of merchant cash advance | 20 | 0 | $88.15 | – |
| merchant cash advance settlement | 20 | – | $112.04 | – |
| seasonal business loans | 20 | 0 | $151.27 | – |
| iso merchant cash advance | 20 | 0 | $38.97 | – |
| chiropractic practice financing | 20 | – | – | – |
| convenience store financing | 20 | 0 | – | – |
| florida commercial financing disclosure law | 20 | 0 | – | – |
| loan referral program | 20 | 0 | – | – |
| bluevine vs ondeck | 20 | – | $51.74 | – |
| how fast can i get a business loan | 20 | – | $99.57 | – |
| merchant services cash advance | 20 | 30 | $12.63 | – |
| small business debt | 20 | 13 | $6.36 | – |
| refinance merchant cash advance | 20 | 0 | $36.34 | – |
| factor rate to apr | 10 | 1 | – | – |
| merchant cash advance apr | 10 | – | – | – |
| merchant cash advance pros and cons | 10 | 8 | – | – |
| merchant cash advance vs business loan | 10 | – | – | – |
| merchant cash advance for restaurants | 10 | 0 | – | – |
| merchant cash advance regulations | 10 | 6 | – | – |
| business loan bank statements | 10 | 1 | $88.06 | – |
| loan broker commission | 10 | 64 | $7.01 | – |
| merchant cash advance california | 10 | 0 | $15.59 | – |
| holdback percentage | 10 | – | – | – |
| second position merchant cash advance | 10 | – | – | – |
| mca renewal | 10 | – | – | – |
| electrician business loans | 10 | – | – | – |
| new york commercial finance disclosure law | 10 | 0 | – | – |
| california sb 1235 | 10 | 14 | – | – |
| merchant cash advance bankruptcy | 10 | – | $23.22 | – |
| business loan broker commission | 10 | 0 | – | – |
| ondeck alternatives | 10 | – | – | – |
| kabbage alternatives | 10 | 12 | – | – |
| is a merchant cash advance a loan | 10 | 19 | – | – |
| what happens if you default on a merchant cash advance | 10 | 0 | – | – |
| how to calculate factor rate | 10 | 31 | – | – |
| 1099 business loan | 10 | – | $37.97 | – |
| business loan documents needed | 10 | 8 | – | – |
| total cost of capital | 10 | – | – | – |
| merchant cash advance stacking | n/a | – | – | – |
| business loans for bad credit | n/a | 8 | – | – |
| bad credit business loans | n/a | 8 | – | – |
| how to become an mca broker | n/a | – | – | – |
| fuel advance for truckers | n/a | – | – | – |
| loans for hvac business | n/a | – | – | – |
| daily payment business loan | n/a | – | – | – |
| direct merchant cash advance lenders | n/a | – | – | – |
| roofing business loans | n/a | – | – | – |
| california commercial financing disclosure | n/a | – | – | – |
| virginia merchant cash advance law | n/a | – | – | – |
| georgia commercial financing disclosure | n/a | – | – | – |
| utah commercial financing registration | n/a | – | – | – |
| how to negotiate merchant cash advance | n/a | – | – | – |
| can a merchant cash advance sue you | n/a | – | – | – |
| chapter 11 merchant cash advance | n/a | – | – | – |
| stop mca payments | n/a | – | – | – |
| referral fee for business loans | n/a | – | – | – |
| can i get a business loan with bad credit | n/a | 47 | – | – |
| what do lenders look for in business loans | n/a | – | – | – |
| how many bank statements for business loan | n/a | – | – | – |
| does a merchant cash advance affect credit | n/a | – | – | – |
| is a merchant cash advance a good idea | n/a | – | – | – |
| how much does a merchant cash advance cost | n/a | – | – | – |
| can you pay off a merchant cash advance early | n/a | – | – | – |
| what is a good factor rate | n/a | – | – | – |
| business loans for startups with no money | n/a | – | – | – |
| tax refund advance business | n/a | – | – | – |
| how to read a loan offer | n/a | – | – | – |
| apr vs factor rate | n/a | – | – | – |
| best business loans for bad credit | n/a | 48 | – | – |
| business loan approval odds | n/a | – | – | – |
| why was my business loan denied | n/a | – | – | – |
| sba loan to refinance mca | n/a | – | – | – |
