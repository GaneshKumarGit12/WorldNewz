import urllib.request
import urllib.parse
import re
import html as html_parser
import random
import time
import json
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

urls = [
    "https://link.amazon/B00gHAL89",
    "https://link.amazon/B0fUv4eN4",
    "https://link.amazon/B0gsqeMQe",
    "https://link.amazon/B0aRVyUw0",
    "https://link.amazon/B06hlUZjA",
    "https://link.amazon/B05xRcqa7",
    "https://link.amazon/B05fMPvhu",
    "https://link.amazon/B08n7htWZ",
    "https://link.amazon/B08qNgTJE",
    "https://link.amazon/B06Mcrv69",
    "https://link.amazon/B04apS5Sr",
    "https://link.amazon/B05GhSBJA",
    "https://link.amazon/B03Nak57I",
    "https://link.amazon/B01qV9Fgf",
    "https://link.amazon/B0gTJCUzo",
    "https://link.amazon/B00CyZluj",
    "https://link.amazon/B0gbVxnpR",
    "https://link.amazon/B0bLufEpz",
    "https://link.amazon/B02KDEBNZ",
    "https://link.amazon/B0e9X9tW7",
    "https://link.amazon/B033QYGZN",
    "https://link.amazon/B01bItWRC",
    "https://link.amazon/B0f6SjHWV",
    "https://link.amazon/B0dTjiU2U",
    "https://link.amazon/B0iD7IXVc",
    "https://link.amazon/B04RfVGub",
    "https://link.amazon/B0iB1rLDi",
    "https://link.amazon/B00SQBsyE",
    "https://link.amazon/B03pESnqY",
    "https://link.amazon/B05Ehvudz",
    "https://link.amazon/B06mKgxsY",
    "https://link.amazon/B0dtl1xoN",
    "https://link.amazon/B04ECevtW",
    "https://link.amazon/B04tFtDIN",
    "https://link.amazon/B06q7MdVy",
    "https://link.amazon/B0aiLjJWl",
    "https://link.amazon/B0gIA3u7H",
    "https://link.amazon/B043iB0ke",
    "https://link.amazon/B072R8ZIi",
    "https://link.amazon/B05KSSg9J",
    "https://link.amazon/B00Pkc7gh",
    "https://link.amazon/B0dlOy8U3",
    "https://link.amazon/B02HKEoFw",
    "https://link.amazon/B0iPNBxiV",
    "https://link.amazon/B06wSqGGL",
    "https://link.amazon/B09D1BPOO",
    "https://link.amazon/B0gX9jNo3",
    "https://link.amazon/B0gs2DfjA",
    "https://link.amazon/B0f47lrG1",
    "https://link.amazon/B007rbt9y"
]

SEEN_ASINS_PATH = "scratch/seen_asins.json"

def load_seen_asins():
    if os.path.exists(SEEN_ASINS_PATH):
        with open(SEEN_ASINS_PATH, "r") as f:
            return set(json.load(f))
    return set()

def save_seen_asins(seen):
    with open(SEEN_ASINS_PATH, "w") as f:
        json.dump(sorted(list(seen)), f, indent=2)

user_agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
]

def resolve_url(url):
    headers = {'User-Agent': random.choice(user_agents)}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            final_url = resp.geturl()
            html = resp.read().decode('utf-8', errors='ignore')
            return final_url, html
    except Exception as e:
        print(f"Error resolving {url}: {e}")
        return url, ""

def extract_asin(url, html=""):
    # Match standard /dp/B0XXXXXX or /gp/product/B0XXXXXX
    m = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})', url, re.IGNORECASE)
    if m:
        return m.group(1).upper()
    # Match in query params
    m2 = re.search(r'asin=([A-Z0-9]{10})', url, re.IGNORECASE)
    if m2:
        return m2.group(1).upper()
    # Match B0... or 10-char uppercase alphanumeric in short link path
    m3 = re.search(r'link\.amazon/([A-Z0-9]{9,10})', url, re.IGNORECASE)
    if m3:
        code = m3.group(1)
        if code.startswith("B0") and len(code) == 10:
            return code.upper()
    return None

def extract_details(html, asin, final_url):
    title = ""
    # Extract title
    title_m = re.search(r'<span id="productTitle"[^>]*>\s*(.*?)\s*</span>', html, re.DOTALL)
    if title_m:
        title = html_parser.unescape(title_m.group(1).strip())
    if not title:
        og_title = re.search(r'<meta property="og:title" content="(.*?)"', html, re.IGNORECASE)
        if og_title:
            title = html_parser.unescape(og_title.group(1).strip())
    if not title:
        title = f"Featured Deal (ASIN {asin})"

    # Clean title
    title = re.sub(r'\s+', ' ', title)
    title = re.sub(r'^(Amazon\.in:\s*|Buy\s*)', '', title, flags=re.IGNORECASE).strip()

    # Image extraction
    img_url = ""
    hires_m = re.search(r'data-old-hires="(https://m\.media-amazon\.com/images/I/[^"]+)"', html)
    if hires_m:
        img_url = hires_m.group(1)
    if not img_url:
        dynamic_m = re.search(r'"hiRes":"(https://m\.media-amazon\.com/images/I/[^"]+)"', html)
        if dynamic_m:
            img_url = dynamic_m.group(1)
    if not img_url:
        img_m = re.search(r'https://m\.media-amazon\.com/images/I/[A-Za-z0-9%_\-\+\.]+\.(?:jpg|png)', html)
        if img_m:
            img_url = img_m.group(0)
    if not img_url:
        img_url = f"https://images-na.ssl-images-amazon.com/images/P/{asin}.01.LZZZZZZZ.jpg"

    # Price extraction
    price = 0.0
    price_m = re.search(r'<span class="a-price-whole">\s*([\d,]+)', html)
    if price_m:
        try:
            price = float(price_m.group(1).replace(',', ''))
        except:
            price = 999.0
    if price == 0.0:
        price = 1499.0

    original_price = round(price * 1.35, 2)

    # Category determination
    title_lower = title.lower()
    if any(k in title_lower for k in ['phone', 'mobile', 'charger', 'cable', 'headphone', 'earbuds', 'laptop', 'smartwatch', 'tv', 'electronics', 'speaker', 'led', 'pro', 'wifi']):
        category = "Technology"
    elif any(k in title_lower for k in ['shirt', 'pant', 'shoes', 'dress', 'bag', 'fashion', 'watch', 'wear', 't-shirt', 'wallet']):
        category = "Lifestyle"
    elif any(k in title_lower for k in ['kitchen', 'home', 'bottle', 'cookware', 'clean', 'mat', 'light', 'furnishing', 'storage']):
        category = "Shopping"
    elif any(k in title_lower for k in ['sport', 'fit', 'gym', 'cycle', 'ball', 'run', 'yoga']):
        category = "Sports"
    else:
        category = "Shopping"

    # Short description
    desc = f"Get the best deal on {title[:80]}. High quality, durable, and highly rated on Amazon."

    return {
        "asin": asin,
        "title": title,
        "description": desc,
        "imageUrl": img_url,
        "price": price,
        "originalPrice": original_price,
        "category": category,
        "resolvedUrl": final_url
    }

def main():
    seen_asins = load_seen_asins()
    resolved_products = []
    skipped_duplicates = 0
    failed_links = []

    print(f"Starting resolution of {len(urls)} Amazon links...")

    for idx, u in enumerate(urls, 1):
        print(f"[{idx}/{len(urls)}] Resolving {u}...")
        final_url, html = resolve_url(u)
        asin = extract_asin(final_url, html)

        if not asin:
            # Fallback extract from short link string if it looks like B0...
            parts = u.rstrip('/').split('/')
            last_part = parts[-1]
            if len(last_part) == 9 and last_part.startswith("B0"):
                asin = last_part.upper()

        if not asin:
            print(f"❌ Failed to extract ASIN for {u}")
            failed_links.append(u)
            continue

        if asin in seen_asins:
            print(f"⏩ ASIN {asin} already in seen registry. Skipping.")
            skipped_duplicates += 1
            continue

        details = extract_details(html, asin, final_url)
        resolved_products.append(details)
        seen_asins.add(asin)
        print(f"✅ [{details['category']}] {asin}: {details['title'][:60]} (₹{details['price']})")
        time.sleep(random.uniform(0.5, 1.2))

    print("\n-------------------------------------------")
    print(f"Total Resolved: {len(resolved_products)}")
    print(f"Skipped Duplicates: {skipped_duplicates}")
    print(f"Failed Links: {len(failed_links)}")

    save_seen_asins(seen_asins)

    with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
        json.dump(resolved_products, f, indent=2)

if __name__ == "__main__":
    main()
