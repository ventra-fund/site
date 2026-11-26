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
- Google Ads hides volume for some credit terms. Those are marked n/a and still have real demand.

---

## 1. The short version

1. **Fix the technical blockers first (section 5).**
   - There is no sitemap, no meta descriptions, no canonical tags and no structured data.
   - Every internal link goes through a temporary 307 redirect.
   - Cloudflare blocks the crawlers that teach ChatGPT, Claude and Gemini about the brand.
   - None of this is visible on the page, and all of it caps what content can do.
2. **Own MCA consolidation.** This is the fastest-growing cluster in the dataset:
   - "mca debt restructuring" +527%, "mca debt consolidation" +353%.
   - Difficulty is 0–7, and CPCs reach $194 ("business debt consolidation") and $214 ("mca consolidation").
   - No mainstream publisher ranks; specialist firms own the results.
3. **Point the Consolidations page at the words people actually search:** "MCA debt consolidation" and "business debt consolidation".
4. **Ship free calculators.**
   - Targets: MCA cost / factor-rate-to-APR, DSCR, working capital.
   - The DSCR calculator (3,600/mo) has difficulty 0.
   - Credibly, Nav and Lendio already earn links and AI citations with theirs.
5. **Build a commercial financing disclosure law hub** for the 10–11 states with MCA disclosure laws, then pair each state with a "business funding in {state}" page. The pairing gives each state page substance that Biz2Credit-style thin location pages lack.
6. **Expand industries from 5 to about 15**, led by the biggest gaps:
   - auto repair (3,600/mo, KD 16)
   - food trucks (2,400, KD 6)
   - dental (1,000, KD 6)
   - contractors (720)
   - gas stations (590, KD 0)
7. **Build a glossary for the legal and finance terms** owners search after signing:
   - UCC filing (12,100/mo) and UCC lien (5,400)
   - DSCR (22,200)
   - personal guarantee (1,900) and confession of judgment (1,300, KD 0)
   - factor rate, holdback, reconciliation, stacking
8. **Treat AI visibility as mostly an off-site job.**
   - Third-party sites earn about 75–98% of AI citations.
   - In banking, Wikipedia, Bankrate and Investopedia alone supply about half (51%), and NerdWallet adds another 9.6%.
   - Get Ventra into the "best MCA" roundups, build review profiles, and give Reddit a real named presence (section 7).
9. **Publish one original data report a year** from anonymized application data. Biz2Credit, Bluevine, Fora, Credibly, Lendio and OnDeck all do this. It is the most-cited asset type that a funder can produce itself.

---

## 2. Where the site stands today

**Pages in the repo:**

- **Products (2)** in `src/data/product-pages.ts`: merchant cash advances, consolidations.
- **Industries (5)** in `src/data/industries.ts`: restaurants, retail, construction, healthcare, trucking.
- **Articles (3)** in `src/data/articles.ts`:
  - bank statements
  - seasonal cash flow
  - factor rates / APR
- **Other pages:** FAQ, how it works, transparent pricing, partner programs, about, leadership, reviews.

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

**Language versus compliance.** The `articles.ts` header says product copy uses "financing / advance / buy rate", not "loan". Search demand is in "loan" words ("mca loan" 3,600/mo, "mca lenders" 3,600). Keep product claims compliant and still meet searchers where they are:

- Use the searched phrase in headings and the first paragraph, and correct it in the same sentence: *"An 'MCA loan' isn't technically a loan; it's a purchase of future receivables…"*
- California's SB 362 (2026) restricts misleading use of "rate" and "interest" for non-interest products, so a factor rate is never called an interest rate.

---

## 3. What the data says

### 3.1 Demand is rising, and it peaks in spring

Google Trends, US, average interest Jan–Oct 2026 against Jan–Oct 2025: "merchant cash advance" rose from 3.9 to 8.4 (+115%), up from 2.9 in 2024. Values are relative (0–100) within one Trends query.

- **Seasonality:** small-business funding searches peak in **March–May** and bottom out in **December**. Get evergreen money pages and calculators live by **February** so they are indexed and earning links before the spring peak.
- **MCA spikes are news-driven.** "Merchant cash advance" had sharp spikes in Nov 2021 – Jan 2022 and Feb 2023. Keep a news/updates slot open for regulatory or enforcement stories.
- **Rising related searches** (Trends, last 12 months):
  - "merchant cash advance financing" +200%
  - "merchant cash advance default" +100%
  - "merchant cash advance lenders" +50%

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

#### B. MCA debt and consolidation: highest priority

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| business debt consolidation | 1,000 | 0 | $194.15 | +2% |
| mca debt consolidation | 880 | 0 | $65.63 | +353% |
| mca debt restructuring | 480 | 0 | $7.12 | +527% |
| business debt | 480 | 7 | $20.19 | +256% |
| merchant cash advance attorney | 170 | 0 | $77.88 | – |
| mca lawyer | 140 | 1 | $96.66 | – |
| reverse consolidation | 110 | 0 | $170.30 | – |
| mca consolidation | 90 | 0 | $214.20 | – |
| merchant cash advance default | 50 | 0 | $68.45 | – |
| mca default | 40 | 0 | $26.26 | – |
| reverse consolidation mca | 40 | 0 | $78.26 | – |
| merchant cash advance consolidation | 30 | 0 | $110.74 | – |
| how to get out of merchant cash advance | 20 | 0 | $88.15 | – |
| refinance merchant cash advance | 20 | 0 | $36.34 | – |

- **Who ranks** (Firecrawl web search and the Nimble run). The results are all specialist firms and law firms: Second Wind Consultants, VIP Capital, Biz2Credit's MCA hub, National Credit Partners, ABL Advisor, Debt Consultants Group, SoFi, Singer Law Group, Northwood Capital, plus a Reddit thread. Value Capital Funding (with an MCA debt calculator) also shows up. NerdWallet, Forbes, Bankrate and Investopedia don't rank here.
- **AI Overview citations:** trippscott.com, secondwindconsultants.com, mccarthylawyer.com, wilkiepuchi.com, abladvisor.com, singerlawgroup.com. These are law firms and an industry trade site, so a page that cites statutes and regulators fits what the engine is already choosing.
- **People Also Ask:** *What is MCA loan consolidation? Does debt consolidation ruin credit?*
- **Content gap.** The authoritative, non-salesy explainer is missing. Regulators have published the raw material:
  - California DFPI says a business on a fixed daily MCA payment usually has a contractual right to **reconciliation** if revenue falls.
  - The FTC acted against Yellowstone Capital for withdrawing payments after merchants had paid in full.
  - No competitor in the set turns this into a plain-English owner's guide.

#### C. Calculators

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| dscr calculator | 3,600 | 0 | $3.79 | 0% |
| how to calculate working capital | 1,900 | 14 | $8.26 | -32% |
| mca calculator | 1,300 | 0 | $4.58 | -63% |
| working capital calculator | 170 | 3 | $11.59 | – |
| merchant cash advance calculator | 70 | 0 | $3.17 | – |
| factor rate calculator | 40 | 4 | – | – |
| factor rate to apr | 10 | 1 | – | – |

- **What ranks for "mca calculator":** funder tools and NerdWallet.
- **AI Overview citations:** funderintel.com, nerdwallet.com, fundingtracker.app, credibly.com, businessdebtlawgroup.com.
- **Related searches:** "MCA APR calculator", "free cash advance calculator", "merchant loan calculator".

#### D. Glossary and legal terms (what owners look up after signing)

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
| factor rate | 170 | 4 | – | – |
| what is a factor rate | 90 | 1 | – | – |
| split funding | 30 | 0 | $18.81 | – |
| holdback percentage | 10 | – | – | – |

Most of these are informational and not about MCAs specifically. Each one is a chance to answer the MCA-specific version on a page that also ranks for the broad term:

- "ucc filing" → *a UCC-1 from your funder: what it means and how to get it terminated*
- "confession of judgment" → *which states still allow it in MCA contracts*

#### E. Industries

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| auto repair shop financing | 3,600 | 16 | $10.19 | +19% |
| food truck financing | 2,400 | 6 | $10.49 | -56% |
| dental practice financing | 1,000 | 6 | $56.18 | -36% |
| contractor financing | 720 | 20 | $86.11 | +55% |
| gas station financing | 590 | 0 | $69.68 | -82% |
| franchise financing | 260 | 7 | $20.06 | -59% |
| restaurant financing | 140 | 15 | $172.40 | – |
| hotel financing | 140 | 0 | $47.47 | – |
| gym financing | 110 | 0 | $4.20 | – |
| bar financing | 90 | 0 | – | – |
| convenience store financing | 20 | 0 | – | – |

#### F. States and state law

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| merchant cash advance new york | 70 | 3 | $25.72 | – |
| merchant cash advance texas | 30 | 9 | $72.00 | – |
| merchant cash advance florida | 30 | 0 | $77.10 | – |
| merchant cash advance california | 10 | 0 | $15.59 | – |
| texas hb 700 | 30 | 0 | – | – |
| florida commercial financing disclosure law | 20 | 0 | – | – |
| california sb 1235 | 10 | 14 | – | – |
| new york commercial finance disclosure law | 10 | 0 | – | – |

The state MCA and disclosure-law terms have little search volume. Their value is as citable pages for AI answers and as link targets for brokers, attorneys and journalists.

#### G. Partner, broker and ISO

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| mca broker | 480 | 0 | $50.20 | -62% |
| merchant cash advance leads | 260 | 0 | $30.40 | -13% |
| iso agreement | 50 | 0 | – | – |
| mca iso | 40 | 0 | $27.44 | – |
| iso merchant cash advance | 20 | 0 | $38.97 | – |

#### H. Competitor brand searches

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

#### I. Broad head terms (long-term only)

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| business funding | 4,400 | 44 | $169.59 | -6% |
| small business funding | 2,400 | 51 | $93.85 | -29% |
| business capital | 1,000 | 12 | $133.83 | -21% |
| alternative financing | 320 | 5 | $23.42 | +431% |

- Don't target "business funding" (KD 44) or "small business funding" (KD 51) head-on. Win the clusters around them first.

---

## 4. The competitive landscape

### 4.1 What the 12 competitors publish

| Site | Content hubs | Calculators | State pages | Industry pages | Original data |
|---|---|---|---|---|---|
| **Biz2Credit** | 2,874 URLs; a 40-page MCA hub, including stacking, factor rate vs interest, renegotiating after default and escaping the MCA cycle; 140 "vs" and 115 "best" pages | A calculator cluster | 125+ state and city pages | 471 industry URLs | SMB Credit Report (quarterly), SMB Earnings Report, Women-Owned Business Study |
| **Lendio** | 1,155 URLs; guides, 23 "vs", "best" posts, fundability assessment | 7-tool hub, incl. ACH / daily-repayment calculator | Customer stories by state | 100+ industry pages | Surveys and studies hub |
| **Bluevine** | 952 URLs; 41 "vs", ~199 "best", glossary | None (guides only) | 50 state pages | ~55 | BOSS Report 2024–2026, several surveys |
| **Fora Financial** | 834 URLs; 225+ working-capital posts, 33 "vs", 19 "best", MCA pillar | Funding-estimate calculator | 12+ state pages | Industries hub | Business Insights Report 2025/2026, pulse survey |
| **Credibly** | Blog with comparison posts ("how to compare offers", "how to read a financing agreement") | **Strongest stack:** MCA, working capital and payment calculators | – | ~38 | Small Business Trends Report 2024/2025 |
| **OnDeck** | 17+ product-type pages: MCA, bad credit, no credit check, trucking, restaurant, medical, contractors… | Profit margin, plus one for its own products | CA, FL, TX | Via product-type pages | BIPOC business report, trend report |
| **Nav** | Large blog with named authors; business-credit hubs | **MCA APR calculator**, among others | Blog posts | Blog posts | No standalone reports |
| **National Funding** | Product-first; /learn hub | None | 33 location pages | ~28 industries, each crossed with product types | None |
| **Kapitus** | Pillar blog (cash-flow cluster, industry challenges) | One, not for MCAs | Tags only | Blog | None |
| **Rapid Finance** | Solutions hub plus MCA blog pillar | None | None | Blog | None |
| **Fundbox** | 287 URLs; product pages, small blog, podcast | None | None | ~11 | 2022 survey |
| **Become** | 72 URLs; product-type pages plus 11 industry pages | LendingScore (profile score) | None | 11 | None |

What the table shows:

- **Location and industry pages are table stakes.** Every big player has them, but most are thin templates. The way to beat them is real substance on each page (section 8.4).
- **The MCA-cost calculator layer is contested** (Credibly, Nav), but a calculator that shows factor rate, total payback, daily/weekly payment and estimated APR, with the state-disclosure context beside it, doesn't exist yet.
- **Almost no direct funder covers MCA consolidation seriously.** Only Biz2Credit and OnDeck have on-page content; Fora has one post. That leaves the gap from 3.2B open.

### 4.2 Who wins the "best X" queries AI engines love

| Query class | Who ranks | How to get in |
|---|---|---|
| "best merchant cash advance companies" | NerdWallet (picks include Forward Financing, Uplyft, Giggle Finance, Fundomate, Fora). Niche affiliates: ModernWallet, FundingCompass, LendingTree's dated MCA page, CNBC Select (4 picks). Funder listicles: Byzfunder, Quickie, Clarify Capital, Elite Funders. | Pitch the niche affiliates directly. Go through NerdWallet's partner/affiliate route. NerdWallet scores 6 categories: cost, transparency, underwriting flexibility, credit, application experience, customer service. It has a 4-star minimum. |

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
| `FinancialProduct` | `/capital/*` | Amount range, term, `feesAndCommissionsSpecification`, requirements. Pull from `funding-products.ts` so it can't drift from the copy. |
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

### Tier 1: next 30 days (retarget existing pages, plus the consolidation cluster and calculators)

| # | Page | Target keywords | Notes and AEO angle |
|---|---|---|---|
| 1 | **Retarget `/capital/consolidations`** → "MCA Debt Consolidation" (consider slug `mca-debt-consolidation` with a 301 redirect from the old URL) | mca debt consolidation (880/0, +353%), business debt consolidation (1,000/0), mca consolidation (90, $214 CPC), merchant cash advance consolidation | Before/after payment table: 3 stacked positions vs one. Explain how consolidation differs from **reverse consolidation**. Eligibility. Honest "when consolidation doesn't help" section; the ranking competitor's headline is literally *"MCA Debt Consolidation Rarely Works"*. |
| 2 | **New article: "Reverse consolidation, explained"** | reverse consolidation (110/0, **$170 CPC**), reverse consolidation mca (40) | Worked numbers; risks; how it differs from a buyout. |
| 3 | **New article: "Can't make your MCA payment? Your options, in order"** | how to get out of merchant cash advance, merchant cash advance default (Trends rising +100%), mca default, stop mca payments | Steps in order: ask for reconciliation (cite DFPI) → negotiate → consolidate / refinance → settle → legal. What a funder can do (UCC lien, confession of judgment where legal, UCC 9-406 notices). Don't stack. |
| 4 | **MCA cost calculator** `/resources/calculators/mca-calculator` | mca calculator (1,300/0), merchant cash advance calculator, factor rate calculator, factor rate to apr, "MCA APR calculator" (related) | Inputs: advance, factor rate, term or holdback %, payment frequency. Outputs: total payback, cost of capital, daily/weekly payment, **estimated APR**. Static worked example plus a link to the existing factor-rate article. |
| 5 | **DSCR calculator + "What is DSCR" explainer** | dscr calculator (3,600/0), debt service coverage ratio (22,200/31) | The same page can rank for both. Show what DSCR lenders want and what an MCA funder looks at instead (deposits). |
| 6 | **Expand `/capital/merchant-cash-advances`** | merchant cash advance (5,400/29), mca loan (3,600/33), mca lenders (3,600/16), merchant cash advance lenders (880/19), what is a merchant cash advance (480, +224%) | Add the one-sentence definition at the top. Add a "how a holdback works" table with numbers, "Is an MCA legal? Is it a loan?" sections (PAA), and links to the calculator and the state law hub. |

### Tier 2: 30–90 days (topic hubs that compound)

| # | Page / hub | Target keywords | Notes |
|---|---|---|---|
| 7 | **State disclosure law hub** `/resources/commercial-financing-disclosure-laws` + one page per state | texas hb 700, california sb 1235, florida commercial financing disclosure law, new york commercial finance disclosure law + "{state} merchant cash advance law" long tail | Cover NY, CA, UT, VA, FL, GA, CT, KS, MO, TX, LA, with VT due July 2027. For each: what must be disclosed, thresholds ($500K in CA/FL/GA/KS/VA; NY up to $2.5M), registration (UT and VA; TX by Dec 31, 2026), the regulator, effective date, link to the statute. Use Venable's March 2026 summary as the anchor source. Add a "what your offer from us will show" box. Reviewed by counsel. This is the most citable asset Ventra can own. |
| 8 | **State MCA pages** `/business-funding/{state}`, starting with NY, TX, FL and CA | merchant cash advance new york (70/3), texas (30/9), florida (30/0), california (10/0) | Each page has to carry substance a template can't fake: that state's disclosure rules, the industries Ventra funds there and real (anonymized) deal examples. Expand only where there is something real to say (see 8.4). |
| 9 | **Industry expansion** `/who-we-fund/{industry}` | auto repair (3,600/16), food truck (2,400/6), dental (1,000/6), contractors (720/20), gas stations & c-stores (590/0), franchise (260/7), hotels (140), gyms (110) | Split "healthcare" into dental and the rest of healthcare. Retitle construction as "Construction & Contractor Financing". Each page needs that industry's cash-flow pattern, typical use of funds, a sample offer and an industry FAQ. Link industries to products the way National Funding does (/who-we-fund/trucking + the MCA product). |
| 10 | **Glossary hub** `/resources/glossary` + full pages for the big terms | ucc filing (12,100/23), ucc lien (5,400/28), personal guarantee (1,900/18), what is a personal guarantee (880), confession of judgment (1,300/0), prepayment penalty (2,400/21), net working capital (4,400/5), cash conversion cycle (3,600/24), working capital ratio (1,000/12), factor rate, holdback, split funding, stacking, reconciliation, buy rate | Short definition first (the snippet / AI-extract target), then the MCA-specific angle. Each entry links to the product or calculator it relates to. |
| 11 | **Comparison articles** | factor rate vs interest rate (30/0), apr vs factor rate | Comparisons get cited heavily (ChatGPT cites comparison content 95% of the time in HubSpot's test; "X vs Y" queries trigger AI Overviews 95% of the time). Each needs a comparison table with worked numbers. |
| 12 | **Fast-funding guide** | same day merchant cash advance (30/0) | What "same day" really means (approval vs. funds in the account); the documents that speed it up (bank statements, which the apply form already parses). |
| 13 | **"How Ventra Fund compares"** | competitor "reviews" searches (section 3.2 H) | One factual table vs. 5–6 named competitors. Refresh quarterly. |

### Tier 3: 90 days and on (authority and distribution)

| # | Page / asset | Why |
|---|---|---|
| 14 | **Annual "State of Small Business Funding" report** from anonymized application and funding data: approval rates by industry and state, median advance, time to fund, deposits-to-advance ratios, share of applicants carrying stacked positions | Original statistics are the most-cited content an individual company can produce (the Princeton/IIT GEO study measured a +31% visibility lift from adding statistics). Journalists and roundup writers need a source. Publish the method; gate nothing. |
| 15 | **Broker and ISO resources** `/partners/brokers/guide` | mca broker (480/0), merchant cash advance leads (260/0), iso agreement (50) |
| 16 | **Owner stories** by industry and state (real, permissioned) | Experience signal for Google's YMYL quality guidelines; quotable for AI answers; feeds industry and state pages. |
| 17 | **YouTube explainers** (2–4 min): factor rate explained, how a holdback works, reconciliation rights, consolidation math | YouTube is the #1 cited domain in Google AI Overviews and big in Perplexity. Captions and transcripts are what get read. Embed each video on its matching page. |

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
- Why was my funding declined, and what to fix before reapplying
- Business funding with a 500 credit score: what's realistic
- How fast can you get business funding? A day-by-day timeline

**Planning**

- Seasonal business? Plan funding before the slow months (refresh the existing article; tie it to Trends seasonality)
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

### 7.3 Reviews, community and press

- **Reviews:** Trustpilot, Google Business Profile and BBB, plus Crunchbase and LinkedIn for entity data. Ask funded customers for reviews by default. These profiles become the `sameAs` links in the Organization schema. (The footer social links stay `#` until the real profiles exist.)
- **Reddit:** one named, disclosed Ventra team member answering in r/smallbusiness, r/Entrepreneur, r/sweatystartup, r/Truckers and r/restaurateur. No links unless asked. Answer the default / reconciliation / stacking questions honestly. Perplexity and AI Overviews weight Reddit heavily.
- **Press:** pitch trade outlets (deBanked, ABL Advisor) and local business journals with the data report (#14) and state-law updates.
- **Partners:** brokers and referral partners (accountants, bookkeepers) linking to calculators and guides is a natural, relevant link source.

### 7.4 Make the brand unambiguous

"Ventra" is a crowded name. Use the full name "Ventra Fund" every time, never "Ventra" alone.

- Keep one consistent description everywhere, e.g. *"Ventra Fund is a US small-business funding company offering merchant cash advances and MCA consolidation."* Use it in the Organization schema, on About, and on LinkedIn, Crunchbase, Trustpilot and Google Business Profile.
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
- Add **statistics, quotations from named people and outbound citations** to primary sources: statutes, DFPI, FTC, CFPB. In the GEO study these lifted visibility 30–40% overall, and **about 100–115% for pages ranked around #5**, which is where a challenger sits.

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

### 8.6 No copied copy

Duplicated text gets credited to the original site in both search and AI answers.

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
  - how do I get out of a merchant cash advance
  - MCA debt consolidation companies
  - what is reverse consolidation
  - is a merchant cash advance a loan
  - how much does a merchant cash advance cost
  - merchant cash advance calculator
  - business funding for restaurants / trucking / auto repair shops
  - Texas merchant cash advance law
  - California commercial financing disclosure
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
- NerdWallet roundup methodology: https://www.nerdwallet.com/business/loans/best
- CNBC Select best MCAs: https://www.cnbc.com/select/best-merchant-cash-advances/
- LendingTree MCAs: https://www.lendingtree.com/business/merchant-cash-advance
- ModernWallet MCA roundup: https://themodernwallet.com/roundup/best-merchant-cash-advance-companies
- FundingCompass MCA providers: https://fundingcompass.guide/compare/best-merchant-cash-advance-providers
- Nav calculators: https://www.nav.com/business-loan-calculators/
- Lendio calculators: https://www.lendio.com/business-calculators
- Credibly calculators: https://credibly.com/incredibly/finance-calculators/
- Biz2Credit MCA hub: https://www.biz2credit.com/merchant-cash-advance
- Second Wind Consultants, MCA consolidation: https://secondwindconsultants.com/resource/dont-consolidate-mca-debt-eliminate-it/

**Regulation**
- Venable, state commercial financing disclosure laws (Mar 2026): https://www.venable.com/insights/publications/2026/03/state-commercial-financing-disclosure-laws
- California DFPI MCA advisory: https://dfpi.ca.gov/alert/advisory-to-small-businesses-with-merchant-cash-advance-contracts/
- FTC on unauthorized withdrawals: https://www.consumer.ftc.gov/blog/2020/08/small-businesses-targeted-unauthorized-withdrawals
- CFPB 1071 and MCAs: https://crediblelaw.com/cfpb-1071-rule-merchant-cash-advance-exclusion/

---

## Appendix: MCA keywords (132 of the 266 researched)

US, Google Ads average monthly searches (Oct 2025 – Sep 2026), DataForSEO keyword difficulty, CPC. "n/a" means Google Ads returned no volume: either too small or a restricted credit category.

| Keyword | Searches/mo | KD | CPC | 12-mo trend |
|---|---:|---:|---:|---:|
| debt service coverage ratio | 22,200 | 31 | $14.01 | 0% |
| ucc filing | 12,100 | 23 | $6.27 | +6% |
| working capital | 12,100 | 23 | $122.28 | -11% |
| what is working capital | 8,100 | 42 | $30.02 | -11% |
| merchant cash advance | 5,400 | 29 | $68.22 | -13% |
| ucc lien | 5,400 | 28 | $6.58 | 0% |
| business funding | 4,400 | 44 | $169.59 | -6% |
| net working capital | 4,400 | 5 | – | -2% |
| mca loan | 3,600 | 33 | $126.06 | +32% |
| dscr calculator | 3,600 | 0 | $3.79 | 0% |
| business credit score | 3,600 | 47 | $25.90 | -34% |
| how to build business credit | 3,600 | 17 | $25.71 | 0% |
| auto repair shop financing | 3,600 | 16 | $10.19 | +19% |
| mca lenders | 3,600 | 16 | $126.06 | +32% |
| cash conversion cycle | 3,600 | 24 | $17.58 | -28% |
| small business funding | 2,400 | 51 | $93.85 | -29% |
| food truck financing | 2,400 | 6 | $10.49 | -56% |
| cash flow forecast | 2,400 | 18 | $24.04 | +83% |
| prepayment penalty | 2,400 | 21 | $31.70 | -18% |
| how to calculate working capital | 1,900 | 14 | $8.26 | -32% |
| personal guarantee | 1,900 | 18 | $4.24 | -8% |
| national funding reviews | 1,600 | 0 | $56.76 | +4% |
| mca calculator | 1,300 | 0 | $4.58 | -63% |
| confession of judgment | 1,300 | 0 | $0.06 | -17% |
| lendio reviews | 1,300 | 5 | $152.13 | -20% |
| business debt consolidation | 1,000 | 0 | $194.15 | +2% |
| dental practice financing | 1,000 | 6 | $56.18 | -36% |
| working capital ratio | 1,000 | 12 | $9.76 | -30% |
| business capital | 1,000 | 12 | $133.83 | -21% |
| mca debt consolidation | 880 | 0 | $65.63 | +353% |
| small business cash advance | 880 | 30 | $94.77 | -68% |
| merchant cash advance lenders | 880 | 19 | $87.90 | +180% |
| cash flow management | 880 | 37 | $30.69 | +14% |
| what is a personal guarantee | 880 | 28 | $7.67 | +16% |
| contractor financing | 720 | 20 | $86.11 | +55% |
| business cash advance | 720 | 19 | $96.47 | -13% |
| merchant cash advance companies | 590 | 30 | $74.83 | +151% |
| gas station financing | 590 | 0 | $69.68 | -82% |
| fora financial reviews | 590 | 7 | $31.47 | -12% |
| what is a merchant cash advance | 480 | 16 | $62.49 | +224% |
| mca broker | 480 | 0 | $50.20 | -62% |
| mca debt restructuring | 480 | 0 | $7.12 | +527% |
| business debt | 480 | 7 | $20.19 | +256% |
| merchant cash advance bad credit | 390 | 12 | $29.73 | -93% |
| rapid finance reviews | 390 | 5 | $40.13 | +118% |
| kapitus reviews | 390 | 0 | $45.32 | -29% |
| commercial financing | 390 | 0 | $33.80 | -8% |
| mca funding | 320 | 15 | $92.61 | -1% |
| credibly reviews | 320 | 9 | $58.06 | -5% |
| alternative financing | 320 | 5 | $23.42 | +431% |
| merchant cash advance leads | 260 | 0 | $30.40 | -13% |
| franchise financing | 260 | 7 | $20.06 | -59% |
| factor rate | 170 | 4 | – | – |
| working capital financing | 170 | 4 | $148.96 | – |
| working capital calculator | 170 | 3 | $11.59 | – |
| merchant cash advance attorney | 170 | 0 | $77.88 | – |
| how to improve cash flow | 170 | 10 | $8.89 | – |
| restaurant financing | 140 | 15 | $172.40 | – |
| hotel financing | 140 | 0 | $47.47 | – |
| mca lawyer | 140 | 1 | $96.66 | – |
| merchant cash advance no credit check | 110 | 14 | $67.04 | – |
| reverse consolidation | 110 | 0 | $170.30 | – |
| payroll financing | 110 | 16 | $204.30 | – |
| gym financing | 110 | 0 | $4.20 | – |
| what is a factor rate | 90 | 1 | – | – |
| mca consolidation | 90 | 0 | $214.20 | – |
| bar financing | 90 | 0 | – | – |
| how does a merchant cash advance work | 70 | 18 | $17.65 | – |
| merchant cash advance calculator | 70 | 0 | $3.17 | – |
| merchant cash advance lawsuit | 70 | 0 | – | – |
| merchant cash advance new york | 70 | 3 | $25.72 | – |
| merchant cash advance default | 50 | 0 | $68.45 | – |
| iso agreement | 50 | 0 | – | – |
| fundbox alternatives | 50 | 0 | $188.35 | – |
| best merchant cash advance companies | 40 | 20 | $34.33 | – |
| factor rate calculator | 40 | 4 | – | – |
| reverse consolidation mca | 40 | 0 | $78.26 | – |
| liquor store financing | 40 | 0 | – | – |
| mca default | 40 | 0 | $26.26 | – |
| mca iso | 40 | 0 | $27.44 | – |
| same day merchant cash advance | 30 | 0 | $60.33 | – |
| merchant cash advance consolidation | 30 | 0 | $110.74 | – |
| merchant cash advance florida | 30 | 0 | $77.10 | – |
| merchant cash advance texas | 30 | 9 | $72.00 | – |
| split funding | 30 | 0 | $18.81 | – |
| merchant cash advance reviews | 30 | 0 | – | – |
| texas hb 700 | 30 | 0 | – | – |
| factor rate vs interest rate | 30 | 0 | – | – |
| how to get out of merchant cash advance | 20 | 0 | $88.15 | – |
| iso merchant cash advance | 20 | 0 | $38.97 | – |
| chiropractic practice financing | 20 | – | – | – |
| convenience store financing | 20 | 0 | – | – |
| florida commercial financing disclosure law | 20 | 0 | – | – |
| bluevine vs ondeck | 20 | – | $51.74 | – |
| merchant services cash advance | 20 | 30 | $12.63 | – |
| small business debt | 20 | 13 | $6.36 | – |
| refinance merchant cash advance | 20 | 0 | $36.34 | – |
| factor rate to apr | 10 | 1 | – | – |
| merchant cash advance apr | 10 | – | – | – |
| merchant cash advance pros and cons | 10 | 8 | – | – |
| merchant cash advance for restaurants | 10 | 0 | – | – |
| merchant cash advance regulations | 10 | 6 | – | – |
| merchant cash advance california | 10 | 0 | $15.59 | – |
| holdback percentage | 10 | – | – | – |
| second position merchant cash advance | 10 | – | – | – |
| mca renewal | 10 | – | – | – |
| new york commercial finance disclosure law | 10 | 0 | – | – |
| california sb 1235 | 10 | 14 | – | – |
| merchant cash advance bankruptcy | 10 | – | $23.22 | – |
| ondeck alternatives | 10 | – | – | – |
| kabbage alternatives | 10 | 12 | – | – |
| is a merchant cash advance a loan | 10 | 19 | – | – |
| what happens if you default on a merchant cash advance | 10 | 0 | – | – |
| how to calculate factor rate | 10 | 31 | – | – |
| total cost of capital | 10 | – | – | – |
| merchant cash advance stacking | n/a | – | – | – |
| how to become an mca broker | n/a | – | – | – |
| direct merchant cash advance lenders | n/a | – | – | – |
| california commercial financing disclosure | n/a | – | – | – |
| virginia merchant cash advance law | n/a | – | – | – |
| georgia commercial financing disclosure | n/a | – | – | – |
| utah commercial financing registration | n/a | – | – | – |
| how to negotiate merchant cash advance | n/a | – | – | – |
| can a merchant cash advance sue you | n/a | – | – | – |
| chapter 11 merchant cash advance | n/a | – | – | – |
| stop mca payments | n/a | – | – | – |
| does a merchant cash advance affect credit | n/a | – | – | – |
| is a merchant cash advance a good idea | n/a | – | – | – |
| how much does a merchant cash advance cost | n/a | – | – | – |
| can you pay off a merchant cash advance early | n/a | – | – | – |
| what is a good factor rate | n/a | – | – | – |
| apr vs factor rate | n/a | – | – | – |
