---
name: daily-activity
description: Process and guide for executing the daily activity of resolving, scraping, and seeding Amazon affiliate product links into WorldNewzs, including the 4-hour queue rotation system.
---

# Daily Activity: Resolving, Scraping & Seeding Amazon Affiliate Products

Whenever you receive a daily batch of short/mobile Amazon affiliate links (e.g. `https://link.amazon/XXXX`), follow this exact process to resolve, verify, seed, and deploy the new products.

---

## Step 1: Scrape & Resolve Short Links (Zero Synthetic Pricing Protocol)
Use a robust Python scraper script to bypass Captcha blocks and extract accurate, authentic product data directly from Amazon India:

1. **Short URL & JavaScript Redirection Resolution**:
   - Resolve HTTP redirects (`link.amazon/XXXX`, `amzn.to/XXXX`).
   - Follow client-side JS redirects (`window.location.replace` in `amzlinks.in`).
   - Extract the true 10-character Amazon ASIN (`B0[A-Z0-9]{8}`).
2. **Expired Product Detection**: Detect non-functioning / expired Amazon pages (e.g., *"not a functioning page on our site"*, *"Looking for something? We're sorry"*, 404s, or *"Currently unavailable"*) and skip them from being seeded.
3. **Strict Scoped Price Extraction (Zero Synthetic Pricing)**:
   - **Never use unscoped `a-price-whole`** (prevents picking up ₹5,999 suits or carousel products instead of the authentic ₹384 item).
   - Extract offer price strictly from `twister-plus-buying-options-price-data`, scoped `priceToPay`, or `apex-pricetopay-value`.
   - Extract authentic MRP strictly from `basisPrice` or scoped `a-text-price`, and discount % from `savingPriceOverride`.
   - **Zero Synthetic Calculation Rule**: `random.uniform(...)` or synthesized pricing formulas are strictly forbidden. If no MRP exists, `OriginalPrice = Price`. Never use dummy fallbacks (e.g. ₹499/₹999).
4. **Data & Description Scrubbing**:
   - Clean titles by stripping `Buy `, `Order `, and marketplace suffixes (`Online at Low Prices in India - Amazon.in`, `at Amazon.in`). Decode all HTML entities.
   - Filter out warranty plans, protection cards, and placeholder text from descriptions.
5. **Image Preservation & Depixelation**:
   - Extract high-res image directly (`data-old-hires` or `"hiRes"` from HTML, restricted to `\.(?:jpg|jpeg|png|webp)`).
   - Convert thumbnail modifiers to full 1500px Ultra HD (`_SL1500_.jpg`), verifying HTTP 200 accessibility.
6. **C# Code Formatting**: Output the scraped products as valid C# `AmazonProduct` seed instances.

---

## Step 2: Comprehensive Multi-Dimensional Deduplication Protocol
Before seeding or committing, verify that every candidate product satisfies all deduplication constraints:
1. **ASIN Uniqueness**: Discard any ASIN already present in `scratch/seen_asins.json` or `AmazonProductService.cs`.
2. **Image Uniqueness**: Do not accept duplicate/identical images (`ImageUrl` or Amazon image asset ID `https://m.media-amazon.com/images/I/{IMAGE_ID}...`). Each product must feature its own distinct visual asset.
3. **Title & Description Text Uniqueness**: Do not accept duplicate title text or identical descriptions across products. Ensure each product has distinct, scrubbed naming and clear descriptive copy.
4. **Authentic Distinct Rates & Discounts**: Extract authentic live prices and true MRP discounts directly from Amazon. Never synthesize or fabricate uniform placeholder rates or random discounts.
5. **Cross-Layer Enforcement**: Deduplication is enforced during Python scraping/resolution, backend C# EF Core queries, and frontend React UI state (`useMemo` unique filters in `AmazonProducts.tsx`, `ShoppingWidget.tsx`, `ContextualDealsWidget.tsx`).

---

## Step 3: Seed C# Database list
1. Open [AmazonProductService.cs](file:///c:/WorldNewz/WorldNewzWebAPI/Services/AmazonProductService.cs).
2. Scroll to the end of the `seedData` list in `EnsureDefaultProductsSeededAsync()`.
3. Append the formatted C# `new AmazonProduct { ... }` blocks right before the list's closing brackets `};`.
4. Ensure the tracking tag is kept clean and valid (`tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl`).

---

## Step 3: Amazon Creator API v3.2 & Expired Process
WorldNewz operates on a dual-mode Amazon architecture with automated expired product handling:

1. **Live Creator API Mode (When Credentials Configured)**:
   - **Environment Variables**: `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET`, `AMAZON_ASSOCIATE_TAG` (default: `ganeshd12-21`), `AMAZON_SCOPE` (default: `creators::api`), `AMAZON_MARKETPLACE_HOST` (default: `www.amazon.in`).
   - **Token Refresh**: Uses LWA OAuth2 `grant_type=client_credentials` with `scope=creators::api` cached in memory with a 90% TTL buffer.
   - **Background Sync**: `AmazonTokenBackgroundRefreshService` proactively refreshes tokens every 45 minutes; `AmazonProductRefreshJob` refreshes live pricing & images daily via Quartz.
2. **Expired Product Cleanup Process (`ExpiredProcess.cs`)**:
   - `ExpiredProcess.cs` continuously inspects database listings for expired signatures (`not a functioning page on our site`, 404s, `Currently unavailable`).
   - Automatically purges or marks inactive any expired products to keep the frontend catalog 100% active and healthy.
3. **Offline Fallback Catalog Mode (Default)**:
   - When credentials are not provisioned, `AmazonCreatorApiService.IsConfigured` evaluates to `false`.
   - The system automatically serves the high-performance PostgreSQL/SQLite seed catalog without failing HTTP requests or throwing auth exceptions.

---

## Step 4: Rotation Queue & SEO Verification
Verify that both components on the frontend are correctly rotating the products in a 4-hour queue:

1. **Shopping List (Home)**: [ShoppingWidget.tsx](file:///c:/WorldNewz/worldnewz_UI/src/components/ShoppingWidget.tsx) must fetch products dynamically and run `getRotatedProducts(products)` to rotate the active deck every 4 hours:
   ```typescript
   const fourHourBlock = Math.floor(Date.now() / (4 * 60 * 60 * 1000));
   const startIndex = fourHourBlock % list.length;
   ```
2. **Contextual Deals (News Articles)**: [ContextualDealsWidget.tsx](file:///c:/WorldNewz/worldnewz_UI/src/components/ContextualDealsWidget.tsx) must fetch live products, filter them by article category, and rotate them using the same 4-hour epoch block calculation.
3. **SEO Requirements**: All product cards must:
   - Use semantic `<aside>` or `<section>` tags.
   - Lazy load images with explicit container sizes/ratios to prevent Cumulative Layout Shift (CLS).
   - Use unique and descriptive button IDs: `id={`btn-buy-amazon-${deal.asin}`}`.

---

## Step 5: Verification & Deployment
1. **Compile Backend**: Run `dotnet build` inside `WorldNewzWebAPI` to verify no compilation errors exist.
2. **Compile Frontend**: Run `npm run build` inside `worldnewz_UI` to check for TypeScript type mismatches or build issues.
3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: Add daily Amazon affiliate products and update rotation seeds"
   git push origin main
   ```

---

## Step 6: Running the Automated Agent (`daily-products-agent`)
The Daily Products workflow is automated by the `daily-products-agent`. Run via CLI or chat:
- **CLI Runner**: `python scripts/run_daily_products_agent.py --links "url1 url2" --deploy`
- **File Input**: `python scripts/run_daily_products_agent.py --file links.txt --deploy`
- **Interactive**: `python scripts/run_daily_products_agent.py --interactive`
- **Agent Subagent**: `invoke_subagent` with `TypeName: "daily-products-agent"`

