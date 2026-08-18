---
name: skilled-agent
description: Orchestrates daily news fetching, AI rewriting of titles, descriptions, and images, seeding database tables, and verifying/pushing deployments.
---

# SkilledAgent Daily Activity Instructions & Content Cadence Plan

Whenever executing daily content automation and database updates for WorldNewzs, follow this exact step-by-step workflow and content guidelines:

---

## Step 1: Fetch Raw JSON Feeds & Track Cadence
Collect raw news feeds in JSON format from configured background news APIs or RSS aggregators.
1. Target feeds covering key categories as defined in our Content Cadence plan.
2. Parse candidate articles containing the raw properties: `{ title, description, url, urlToImage, publishedAt, source }`.
3. Prioritize the **anchor categories** (Business, Tech, Money) first before scaling output in others.

---

## Step 2: Content Pillars & Category-Specific Formatting
For each unique, non-duplicate candidate article, analyze its category and apply the corresponding **Content Pillar** format:

### 1. News Verticals
* **Politics**:
  - *Daily brief*: 3–5 bullet roundup of key developments. (Cadence: 5x/week)
  - *Explainer*: "What [bill/ruling/event] actually means." (Cadence: 1x/week)
  - *Local angle*: national story + how it affects the core region.
  - *Fact-check*: verifying a claim or viral statement.
* **Technology**: (Cadence: 4–5 posts/week)
  - *Product/launch*: new releases and feature drops.
  - *How-to / explainer*: practical guides tied to trending tech.
  - *Industry analysis*: funding, layoffs, regulation, AI developments.
  - *Should you care?*: cutting through hype on trending topics.
* **Business**: (Cadence: 3–5 posts/week)
  - *Market-moving news*: earnings, mergers, leadership changes.
  - *Company deep-dive*: profile of a company in the news.
  - *Sector trend piece*: what's happening across an industry.
* **Science & Health** (YMYL - Treat with care): (Cadence: 2–3 posts/week)
  - *Research roundup*: plain-language summary of new studies.
  - *Myth-busting*: correcting common health misconceptions.
  - *Practical guide*: symptoms, prevention, seasonal health topics.
  - *Requirements*: Always generate a byline with author credentials and cite primary sources.
* **Sports**: (Cadence: daily in-season, 3x/week off-season)
  - *Game/match recaps*: same-day results and highlights.
  - *Standings/stats tracker*: updated regularly.
  - *Preview pieces*: upcoming fixtures, watch storylines.

### 2. Money, Shopping & Services
* **Money & Personal Finance** (YMYL - Treat with care): (Cadence: 2–3 posts/week)
  - *News-driven*: rate changes, tax deadlines, market shifts.
  - *Explainer*: budgeting, saving, investing basics.
  - *Comparison*: "X vs Y" for financial products.
  - *Requirements*: Always show real bylines, professional credentials, and a financial disclaimer.
* **Weather**: (Cadence: daily, templated/automated)
  - *Daily/regional forecast* (keep fresh).
  - *Severe weather alerts* (fast-turnaround).
  - *Seasonal explainer*: monsoons, winters.
* **Shopping Deals**: (Cadence: 2–3x/week)
  - *Curated deal roundups* (sales, holidays).
  - *Buying guides*: "best X under ₹Y".
  - *Requirements*: Add clear affiliate disclosures.
* **Travel**: (Cadence: 2x/week, evergreen)
  - *Destination guides* (produced in batches).
  - *Seasonal/trending picks*: "best places to visit".
  - *Practical tips*: budgeting, visas, packing.
* **Food & Dining**: (Cadence: 2x/week)
  - *Recipe/feature content* (evergreen).
  - *Restaurant/trend coverage* (locally relevant).
  - *Roundups*: "top X spots".
* **Online Services**: (Cadence: 1–2x/week)
  - *Comparison guides*: service A vs B.
  - *How-to content*: using platforms effectively.
  - *News on service changes*: pricing, policies.

### 3. Entertainment & Engagement
* **Entertainment & Celebrity News**: (Cadence: daily)
  - *Same-day coverage*: releases, events, announcements.
  - *Feature pieces*: profiles, retrospectives.
  - *Requirements*: Avoid unverified rumors; maintain factual verification.
* **Gaming News**: (Cadence: 3–4x/week)
  - *Release/update coverage*.
  - *Reviews*: hands-on, opinionated.
  - *Community trends*: esports, viral moments.
* **Cartoons & Comics**: (Cadence: 2–3x/week)
  - *Original or licensed strip content* (verify licensing).
  - *Industry news*: new releases, creator features.
* **Stock Markets**: (Cadence: daily on trading days)
  - *Daily market wrap*: index moves, top gainers/losers.
  - *Explainer*: what moved the market and why.
  - *Requirements*: Include clear financial disclaimers.
* **Interactive Polls / Badge Quiz**: (Cadence: 2–3 new items/week)
  - *New poll/quiz*: tie to trending topics.
  - *Results recap*: "how readers voted".
  - *Requirements*: Visually separate polls/quizzes from hard news in layout; treat as engagement/retention tools.

---

## Step 3: Content Editing & Image Enrichment
1. **Title/Headline Rewrite**:
   - Rewrite the title into an analytical, click-resistant, editorial headline suitable for a premium column.
2. **Description/Summary Rewrite**:
   - Create a concise 2-3 sentence summary outlining the core issue and its implications.
3. **Synthesis Hook & Context**:
   - Synthesize a "Why it matters" block explaining the social, political, or market impact.
   - Produce a social sharing hook with appropriate hashtags.
4. **Detailed Editorial Content (600–2,000 words)**:
   - For Pillar Categories (Politics, Technology, Business, Science-Health): Generate 1,500–2,000 words with structured subheadings and a Frequently Asked Questions (FAQs) section.
   - For Standard Categories: Generate 600–1,000 words.
5. **Image Processing**:
   - Query stock photo APIs (Unsplash, Pexels) using article keywords.
   - If no stock match is found, invoke the AI image generation fallback to create a thematic visual banner.
   - Store and optimize image URLs, ensuring descriptive filenames and proper WebP format.

---

## Step 4: Seed & Push Content to Database
Write the enriched article data back to the database so the frontend can consume it.

1. **Deduplication Check**:
   - Verify that neither the headline, source URL, nor image URL is duplicated in the existing `EnrichedArticles` cache.
2. **Database Insert / API Push**:
   - Execute the seeding routine. Insert records containing all matching properties:
     - `Url`, `Headline`, `Summary`, `Context`, `SocialMediaHook`, `Verified` (true for trusted domains), `PublishedAt`, `Category`, `FullContent`.

---

## Step 5: Page Verification & Deployment
Verify all parts of the site build correctly, then commit and push to the remote server.

1. **Compile Backend**:
   - Run `dotnet build` inside [WorldNewzWebAPI](file:///c:/WorldNewz/WorldNewzWebAPI) to check for compilation issues.
   - Refer to [139issue.md](file:///c:/WorldNewz/139issue.md) if Render.com reports Exit Status 139 (`inotify` user limit 128 crash). Ensure `DOTNET_USE_POLLING_FILE_WATCHER=true` is set.
2. **Compile Frontend**:
   - Run `npm run build` inside [worldnewz_UI](file:///c:/WorldNewz/worldnewz_UI) to check for TypeScript type mismatches or build issues.
3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat(content): Daily auto-refresh of original news articles and images with pillars and cadences"
   git push origin main
   ```

