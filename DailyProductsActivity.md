# Daily Product Activity: Resolving, Storing, Seeding & Displaying Amazon Affiliate Products

Whenever you receive a daily batch of short/mobile Amazon affiliate links (e.g. `https://link.amazon/XXXX`), follow this exact process to resolve, store, verify, seed, and deploy the new products end-to-end — from raw link to a fully interactive product card on the frontend.

---

## Overview of the Pipeline

```
Raw affiliate links
   → Resolve & Scrape (Step 1)
   → Automated Creator API v3.2 Live Price & Stock Sync (Step 1.5)
   → Deduplicate & Store in URL/Product DB (Step 2)
   → Seed C# Backend & Continuous Postgres Upsert (Step 3)
   → Render on Frontend Widgets (Step 4)
   → SEO & Rotation QA (Step 5)
   → Build, Verify & Deploy (Step 6)
```

---

## Step 1.5: Automated Creator API v3.2 Live Price & Stock Sync

WorldNewzs backend runs an integrated **Amazon Creator API (v3.2)** service (`AmazonCreatorApiService.cs`) featuring:
1. **OAuth2 Token Caching**: Tokens are cached in `IMemoryCache` with a **90% TTL** buffer and `SemaphoreSlim` mutex locking to eliminate thundering herd requests.
2. **Proactive Background Renewal**: `AmazonTokenBackgroundRefreshService` renews OAuth tokens every 45 minutes in the background.
3. **Polly Throttling Circuit Breaker (429/503)**: Automatically falls back to PostgreSQL seed data on `429 Too Many Requests` or `503 Service Unavailable`, while failing loudly on auth (`401`/`403`) and `500` server errors.
4. **Continuous PostgreSQL Upserts**: Every successful API response upserts live prices, ratings, and discounts into PostgreSQL, tagging entries with `LastSyncedAt`.
5. **72-Hour Staleness Guardrail**: If seed data is older than 72 hours without a live sync, the system marks the deal as degraded rather than serving obsolete pricing.

---

## Step 1: Scrape & Resolve Short Links

Use a robust Python scraper script to bypass CAPTCHA blocks and extract accurate, high-quality product images, pricing, categories, and titles.

1. **Short URL Resolution**: Resolve redirects to obtain the true landing page URL, extracting the true 10-character Amazon ASIN (e.g. `B0XXXX`).
2. **Image Preservation**: Extract the high-res listing image directly (preferring `data-old-hires` or `"hiRes"` from the HTML, or falling back to `https://images-na.ssl-images-amazon.com/images/P/{ASIN}.01.LZZZZZZZ.jpg`).
3. **Data Scrubbing**: Clean titles and format descriptions. Strip out browse nodes/sign-in pages that are not actual products.
4. **Description Extraction**: Pull the first 2–3 bullet points from the product feature list to use as a short-form description (fallback: truncate the title to ~140 characters).
5. **C# Code Formatting**: Output the scraped products as valid C# `AmazonProduct` seed instances.

Reference script layout, saved under `scratch/resolve_daily_links.py`:

```python
import urllib.request
import urllib.parse
import re
import html as html_parser
import random
import time
import json
import os

urls = [
    # Paste new links here
]

# Randomize user agents to bypass CAPTCHA
headers_list = [
    {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'},
    {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'}
]

# ... resolve links, extract ASIN, title, image, price, originalPrice,
#     category, description bullets ...

# Before writing output, load the existing seen-ASIN registry to avoid duplicates
SEEN_ASINS_PATH = "scratch/seen_asins.json"

def load_seen_asins():
    if os.path.exists(SEEN_ASINS_PATH):
        with open(SEEN_ASINS_PATH, "r") as f:
            return set(json.load(f))
    return set()

def save_seen_asins(seen):
    with open(SEEN_ASINS_PATH, "w") as f:
        json.dump(sorted(seen), f, indent=2)

# ... skip any ASIN already in seen_asins, log skipped duplicates, then
#     append newly resolved ASINs to seen_asins before saving ...
```

**Error handling requirements:**
- Retry each URL up to 3 times with randomized delay (`time.sleep(random.uniform(1.5, 4))`) before marking it failed.
- Log failed/blocked URLs to `scratch/failed_links.log` with timestamp and reason (CAPTCHA, 404, redirect loop, missing image).
- Never silently drop a link — every input URL must end up in either the success list or the failure log.

---

## Step 2: Store & Deduplicate URLs (Product Database)

Before seeding anything, persist every resolved product to a durable store so links are never re-processed or lost.

1. **Storage Location**:
   - Primary ASIN registry: `scratch/seen_asins.json` (Stores all 30+ daily short links, resolved ASINs, and tracking status).
   - Codebase seed repository: [AmazonProductService.cs](file:///c:/WorldNewz/WorldNewzWebAPI/Services/AmazonProductService.cs) (Stores structured C# seed objects).
2. **Product Record Schema** — every stored/seeded product must carry the following fields:

   | Field | Type | Notes |
   |---|---|---|
   | `Asin` | string(10) | Primary key / unique identifier |
   | `Title` | string | Cleaned, scrubbed title |
   | `Description` | string | 2–3 bullet-derived summary |
   | `ImageUrl` | string | High-res image URL |
   | `Price` | decimal | Current price |
   | `OriginalPrice` | decimal? | Nullable, for showing strikethrough discounts |
   | `Category` | string | Used for contextual matching to articles |
   | `AffiliateUrl` | string | Full URL with tracking tag appended |
   | `ShareUrl` | string | Short/canonical link used for share actions |
   | `DateAdded` | DateTime | For rotation/aging logic |
   | `IsActive` | bool | Soft-disable without deleting history |

3. **Deduplication Rule**: If an ASIN already exists in the registry (`scratch/seen_asins.json`), skip re-seeding it; strip duplicate ASIN instances on both backend and frontend so no duplicate product cards are ever rendered.
4. **Tracking Tag Integrity**: Ensure the tracking tag is kept clean and valid on every `AffiliateUrl` (`tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl`).

---

## Step 3: Seed C# Backend Database & Enforce Newest-First Ordering

1. Open [AmazonProductService.cs](file:///c:/WorldNewz/WorldNewzWebAPI/Services/AmazonProductService.cs).
2. Scroll to the end of the `seedData` list in `EnsureDefaultProductsSeededAsync()`.
3. Append the formatted C# `new AmazonProduct { ... }` blocks right before the list's closing brackets `};`, using the full schema from Step 2 (including `Description`, `ShareUrl`, and `IsActive = true`).
4. Skip appending any ASIN already present in the seed list (cross-check against `scratch/seen_asins.json`).
5. **Newest-First Display Requirement**:
   - `GetAffiliateProductsAsync()` in `AmazonProductService.cs` **must** query products with `.OrderByDescending(p => p.Id)`:
     ```csharp
     var products = await _context.AmazonProducts
         .OrderByDescending(p => p.Id)
         .ToListAsync();
     ```
   - This guarantees that newly added/seeded daily products always appear **FIRST** (at the top of Page 1) in both DataGrid and Card View on the `/amazon-products` page.

---

## Step 4: Frontend Widget Requirements

Every product card, in both widgets below, must expose the following elements:

1. **Title Image** — product `ImageUrl`, lazy-loaded with an explicit `width`/`height` or `aspect-ratio` container to prevent Cumulative Layout Shift (CLS).
2. **Title Text (with Copy option)** — a "copy" icon/button next to the title that copies `Title` to the clipboard via `navigator.clipboard.writeText(title)`, with a brief "Copied!" toast/tooltip confirmation.
3. **Description** — the scraped 2–3 bullet summary, truncated with an ellipsis/"read more" if it exceeds card height.
4. **Share Options** — a share button using the native Web Share API where available (`navigator.share({ title, text: description, url: shareUrl })`), falling back to a small menu (Copy Link, WhatsApp, X/Twitter, Email) on unsupported browsers.
5. **Grab Deal (CTA)** — a prominent button linking to `AffiliateUrl` (opens in a new tab, `rel="noopener noreferrer sponsored"`), visually distinct (primary color, high contrast).

### 4a. Shopping Widget (Home)
[ShoppingWidget.tsx](file:///c:/WorldNewz/worldnewz_UI/src/components/ShoppingWidget.tsx) must fetch products dynamically and run `getRotatedProducts(products)` to rotate the active deck every 4 hours:
```typescript
const fourHourBlock = Math.floor(Date.now() / (4 * 60 * 60 * 1000));
const startIndex = fourHourBlock % list.length;
```

### 4b. Contextual Deals Widget (News Articles)
[ContextualDealsWidget.tsx](file:///c:/WorldNewz/worldnewz_UI/src/components/ContextualDealsWidget.tsx) must fetch live products, filter them by article `Category`, and rotate them using the same 4-hour epoch block calculation as above.

---

## Step 5: SEO, Accessibility & Rotation QA

1. **Semantic Markup**: Wrap each widget in a `<section>` landmark with an `aria-label` (e.g. `aria-label="Related deals"`).
2. **Image SEO**: Every image needs a descriptive `alt` attribute derived from `Title` (never empty or generic "product image").
3. **Lazy Loading**: `loading="lazy"` plus explicit container sizing/aspect ratio on all product images to prevent CLS.
4. **Unique IDs**: Use unique, descriptive IDs per action button so analytics and QA can target them individually:
   - `id={`contextual-deal-btn-${deal.asin}`}` — Grab Deal
   - `id={`copy-title-btn-${deal.asin}`}` — Copy title
   - `id={`share-btn-${deal.asin}`}` — Share
5. **Rotation Verification**: Confirm both widgets show a different active set of products after crossing a 4-hour boundary, and that no ASIN appears twice in the same rotated deck.
6. **Click Analytics** (recommended): Fire a lightweight analytics event (`grab_deal_click`, `share_click`, `copy_title_click`) tagged with `asin` and `category` for conversion tracking.

---

## Step 6: Verification & Deployment

1. **Compile Backend**: Run `dotnet build` inside `WorldNewzWebAPI` to verify no compilation errors exist.
2. **Compile Frontend**: Run `npm run build` inside `worldnewz_UI` to check for TypeScript type mismatches or build issues.
3. **Manual Smoke Test**: Load the Home page and one article page locally; confirm images render, Copy/Share/Grab Deal buttons all function, and no console errors appear.
4. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: Add daily Amazon affiliate products and update rotation seeds"
   git push origin main
   ```
5. **Post-Deploy Check**: After deployment, spot-check the live site for at least 2 of the newly seeded ASINs to confirm images and affiliate links resolve correctly.

---

## Daily Checklist (Quick Reference)

- [ ] All input links resolved or logged as failed
- [ ] New ASINs checked against `seen_asins.json` for duplicates
- [ ] Product records include Title, Image, Description, Price, Category, AffiliateUrl, ShareUrl
- [ ] C# seed data appended with clean tracking tags
- [ ] Copy / Share / Grab Deal all present and functional on both widgets
- [ ] SEO attributes (`alt`, semantic `<section>`, unique IDs) verified
- [ ] 4-hour rotation confirmed on both widgets
- [ ] Backend and frontend both build cleanly
- [ ] Changes committed and pushed to `main`

---

## Step 7: Troubleshooting & Common Pitfalls

1. **PostgreSQL Database Schema Sync (`42703: column a.DateAdded does not exist`)**:
   - Whenever new C# model properties (such as `IsActive` or `DateAdded`) are introduced to `AmazonProduct.cs`, you **must** update `DatabaseExtensions.cs` to include non-breaking `ALTER TABLE` statements:
     ```csharp
     ALTER TABLE ""AmazonProducts"" ADD COLUMN IF NOT EXISTS ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE;
     ALTER TABLE ""AmazonProducts"" ADD COLUMN IF NOT EXISTS ""DateAdded"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
     ```
   - This ensures production PostgreSQL databases on Render automatically apply schema migrations on deployment without raising 500 internal server errors.

2. **Browser Storage Console Noise (`Tracking Prevention blocked access to storage`)**:
   - Modern browser tracking protection (Edge/Chrome/Safari) emits console warnings when third-party ad networks or tracking scripts attempt to read storage.
   - `worldnewz_UI/index.html` includes a global console override filtering `Tracking Prevention` and `blocked access to storage` notices across `console.warn`, `console.error`, `console.info`, and `console.log` to keep developer logs clean.

3. **Mismatched Product Image URLs & Fallbacks**:
   - Never assign generic fallback image URLs to products during batch link resolution.
   - Every product record MUST use its exact listing image URL extracted directly from Amazon listing HTML (`hiRes`, `large`, `data-old-hires` e.g., `https://m.media-amazon.com/images/I/71kaUIAYZiL._SL1500_.jpg`).
   - Cross-check product title, description, image URL, category, share options, and Grab Deal affiliate link to ensure 100% visual consistency before committing.

4. **Frontend Image Clarity & 1500px Ultra HD Resolution**:
   - Ensure `getAbsoluteImageUrl` in `AmazonProducts.tsx` cleans low-res sizing modifiers (`._AC_QL10_...`, `._SY350_...`, `._SX342_...`) and requests full 1500px HD images (`._SL1500_.jpg`) directly from `https://m.media-amazon.com/images/I/...`.
   - Avoid third-party lossy compression on Amazon CDN URLs so product cards remain crystal-clear on high-DPI screens.

5. **Target Visited Link Synchronization (`ProductUrl` & Share Options)**:
   - Trace each short link (`https://amzn.to/XXXX` or `https://link.amazon/XXXX`) to its exact destination target Amazon deal URL (`https://www.amazon.in/dp/{ASIN}?tag=ganeshd12-21...`).
   - Every product record's `ProductUrl` (used for 'Grab Deal' buttons, card links, and Share options) MUST match the exact visited deal destination URL with active affiliate tracking tag.

6. **Pinterest Pin Destination URL (`url` Parameter)**:
   - When constructing Pinterest share links (`https://www.pinterest.com/pin/create/button/?url=...&media=...&description=...`), the `url` parameter MUST be set to `encodeURIComponent(productUrl)` (the target Amazon ASIN affiliate URL `https://www.amazon.in/dp/{ASIN}?tag=ganeshd12-21...`).
   - Never use `window.location.href` or site root URLs. This ensures that after a pin is created, clicking the pin on Pinterest redirects visitors straight to the target Amazon product listing.

7. **Support for `https://link.amazon/{SHORT_CODE}` & `https://amzn.to/{SHORT_CODE}` Formats**:
   - Link resolution scripts must handle both `https://amzn.to/XXXX` and `https://link.amazon/XXXX` short link domains seamlessly.
   - Follow all HTTP redirect hops to extract the true 10-character Amazon ASIN, exact `https://m.media-amazon.com/images/I/...` product image URL, full scrubbed title, and bullet-derived description summary.
   - Always append new seed objects to `scratch/seen_asins.json` and `AmazonProductService.cs` with newest-first ordering (`.OrderByDescending(p => p.Id)`).

8. **Day-Wise 24-Hour Deal of the Day Rotation**:
   - The hero "Deal of the Day" spotlight card calculates its featured item using daily 24-hour epoch blocks (`Math.floor(Date.now() / (24 * 60 * 60 * 1000))`) cycling across top discount deals.
   - This guarantees a fresh spotlighted deal each day automatically.

9. **Deduplication Protocol**:
   - Every daily link resolution run strictly consults `scratch/seen_asins.json` and existing seed blocks in `AmazonProductService.cs` before creating new records.
   - Any previously registered ASIN is skipped automatically to avoid duplicate card renders on frontend grids and redundant Pinterest pin publications.

10. **Image HTTP 200 Pre-Flight Verification**:
   - Before committing any batch, run a pre-flight test (`scratch/test_all_product_images.py`) verifying that every extracted `imageUrl` returns `HTTP 200 OK` with `Content-Type: image/*`.
   - If an Amazon image ID was extracted from intermediate search or dynamic scripts, use a mobile CookieJar session lookup (`scratch/fetch_exact_listing_images.py`) to fetch the exact primary listing image (`hiRes` or `data-old-hires`) to prevent blank product cards on the frontend.




