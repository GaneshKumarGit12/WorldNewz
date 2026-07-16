---
name: skilled-agent
description: Orchestrates daily news fetching, AI rewriting of titles, descriptions, and images, seeding database tables, and verifying/pushing deployments.
---

# SkilledAgent Daily Activity Instructions

Whenever executing daily content automation and database updates for WorldNewzs, follow this exact step-by-step workflow:

---

## Step 1: Fetch Raw JSON Feeds
Collect raw news feeds in JSON format from configured background news APIs or RSS aggregators.
1. Target feeds covering key categories: Technology, Business, Science-Health, Sports, opinion, weather, travel, money, etc.
2. Parse candidate articles containing the raw properties: `{ title, description, url, urlToImage, publishedAt, source }`.

---

## Step 2: Content Rewriting & Image Enrichment
For each unique, non-duplicate candidate article, execute the AI rewriting and image acquisition pipeline:

1. **Title/Headline Rewrite**:
   - Rewrite the title into an analytical, click-resistant, editorial headline suitable for a premium column.
2. **Description/Summary Rewrite**:
   - Create a concise 2-3 sentence summary outlining the core issue and its implications.
3. **Synthesis Hook & Context**:
   - Synthesize a "Why it matters" block explaining the social, political, or market impact.
   - Produce a social sharing hook with appropriate hashtags.
4. **Detailed Editorial Content (600–2,000 words)**:
   - For Pillar Categories (Politics, Technology, Business, Science-Health): Generate 1,500–2,000 words with structured subheadings and a Frequently Asked Questions (FAQs) section.
   - For Standard Categories (Sports, Entertainment, Weather, etc.): Generate 600–1,000 words.
5. **Image Processing**:
   - Query stock photo APIs (Unsplash, Pexels) using article keywords.
   - If no stock match is found, invoke the AI image generation fallback to create a thematic visual banner.
   - Store and optimize image URLs, ensuring descriptive filenames and proper WebP format.

---

## Step 3: Seed & Push Content to Database
Write the enriched article data back to the database so the frontend can consume it.

1. **Deduplication Check**:
   - Verify that neither the headline, source URL, nor image URL is duplicated in the existing `EnrichedArticles` cache.
2. **Database Insert / API Push**:
   - Execute the seeding routine. Insert records containing all matching properties:
     - `Url`, `Headline`, `Summary`, `Context`, `SocialMediaHook`, `Verified` (true for trusted domains), `PublishedAt`, `Category`, `FullContent`.

---

## Step 4: Page Verification & Deployment
Verify all parts of the site build correctly, then commit and push to the remote server.

1. **Compile Backend**:
   - Run `dotnet build` inside [WorldNewzWebAPI](file:///c:/WorldNewz/WorldNewzWebAPI) to check for compilation issues.
2. **Compile Frontend**:
   - Run `npm run build` inside [worldnewz_UI](file:///c:/WorldNewz/worldnewz_UI) to check for TypeScript type mismatches or build issues.
3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat(content): Daily auto-refresh of original news articles and images"
   git push origin main
   ```
