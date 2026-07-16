---
name: daily-activity
description: Process and guide for executing the daily activity of resolving, scraping, and seeding Amazon affiliate product links into WorldNewzs, including the 4-hour queue rotation system.
---

# Daily Activity: Resolving, Scraping & Seeding Amazon Affiliate Products

Whenever you receive a daily batch of short/mobile Amazon affiliate links (e.g. `https://link.amazon/XXXX`), follow this exact process to resolve, verify, seed, and deploy the new products.

---

## Step 1: Scrape & Resolve Short Links
Use a robust Python scraper script to bypass Captcha blocks and extract accurate, high-quality, actual product images, pricing, categories, and titles.

1. **Short URL Resolution**: Resolve redirects to obtain the true landing page URL, extracting the true 10-character Amazon ASIN (e.g. `B0XXXX`).
2. **Image Preservation**: Extract the high-res listing image directly (preferring `data-old-hires` or `"hiRes"` from the HTML, or falling back to `https://images-na.ssl-images-amazon.com/images/P/{ASIN}.01.LZZZZZZZ.jpg`).
3. **Data Scrubbing**: Clean titles and format descriptions. Strip out browse nodes/sign-in pages that are not actual products.
4. **C# Code Formatting**: Output the scraped products as valid C# `AmazonProduct` seed instances.

Here is the reference script layout to save under `scratch/resolve_daily_links.py`:

```python
import urllib.request
import urllib.parse
import re
import html as html_parser
import random
import time

urls = [
    # Paste new links here
]

# Randomize user agents to bypass CAPTCHA
headers_list = [
    {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'},
    {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'}
]

# ... resolve links, extract ASIN, title, image, price, originalPrice, category ...
```

---

## Step 2: Seed C# Database list
1. Open [AmazonProductService.cs](file:///c:/WorldNewz/WorldNewzWebAPI/Services/AmazonProductService.cs).
2. Scroll to the end of the `seedData` list in `EnsureDefaultProductsSeededAsync()`.
3. Append the formatted C# `new AmazonProduct { ... }` blocks right before the list's closing brackets `};`.
4. Ensure the tracking tag is kept clean and valid (`tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl`).

---

## Step 3: Rotation Queue & SEO Verification
Verify that both components on the frontend are correctly rotating the products in a 4-hour queue:

1. **Shopping List (Home)**: [ShoppingWidget.tsx](file:///c:/WorldNewz/worldnewz_UI/src/components/ShoppingWidget.tsx) must fetch products dynamically and run `getRotatedProducts(products)` to rotate the active deck every 4 hours:
   ```typescript
   const fourHourBlock = Math.floor(Date.now() / (4 * 60 * 60 * 1000));
   const startIndex = fourHourBlock % list.length;
   ```
2. **Contextual Deals (News Articles)**: [ContextualDealsWidget.tsx](file:///c:/WorldNewz/worldnewz_UI/src/components/ContextualDealsWidget.tsx) must fetch live products, filter them by article category, and rotate them using the same 4-hour epoch block calculation.
3. **SEO Requirements**: All product cards must:
   - Use semantic tags (e.g. `<section>` landmarks).
   - Lazy load images with explicit container sizes/ratios to prevent Cumulative Layout Shift (CLS).
   - Use unique and descriptive button IDs: `id={`contextual-deal-btn-${deal.asin}`}`.

---

## Step 4: Verification & Deployment
1. **Compile Backend**: Run `dotnet build` inside `WorldNewzWebAPI` to verify no compilation errors exist.
2. **Compile Frontend**: Run `npm run build` inside `worldnewz_UI` to check for TypeScript type mismatches or build issues.
3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: Add daily Amazon affiliate products and update rotation seeds"
   git push origin main
   ```
