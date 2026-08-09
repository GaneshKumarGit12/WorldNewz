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
    "https://link.amazon/B062RSUcz",
    "https://link.amazon/B0hE35VFx",
    "https://link.amazon/B02ZcmXWv",
    "https://link.amazon/B02rgm99L",
    "https://link.amazon/B0iRgjFZQ",
    "https://link.amazon/B0f68c1St",
    "https://link.amazon/B09X8GneN",
    "https://link.amazon/B02QverLS",
    "https://link.amazon/B0iL16wgY",
    "https://link.amazon/B0huyepQ9",
    "https://link.amazon/B0iNqUbF2",
    "https://link.amazon/B0726row3",
    "https://link.amazon/B0dSR0niX",
    "https://link.amazon/B02ILmeiM",
    "https://link.amazon/B098B0Shn",
    "https://link.amazon/B01oIJqfB",
    "https://link.amazon/B0bLyvHoy",
    "https://link.amazon/B08XCFAph",
    "https://link.amazon/B08ASRYna",
    "https://link.amazon/B0c1wGVmg",
    "https://link.amazon/B09KprXDh",
    "https://link.amazon/B0a08qrY2",
    "https://link.amazon/B0copUZLe",
    "https://link.amazon/B0dtf5atC",
    "https://link.amazon/B0imKXHpY",
    "https://link.amazon/B05Rerdpb",
    "https://link.amazon/B09kmhh4R",
    "https://link.amazon/B0cXODx9J",
    "https://link.amazon/B09F6bClr",
    "https://link.amazon/B0ix5Xe9F",
    "https://link.amazon/B06vyBwgI",
    "https://link.amazon/B04oNSwmK",
    "https://link.amazon/B0evYg7f5",
    "https://link.amazon/B0iO0v6IV",
    "https://link.amazon/B01aIrSQW",
    "https://link.amazon/B0348mvgn",
    "https://link.amazon/B01xC90XX",
    "https://link.amazon/B0d5bqvBf",
    "https://link.amazon/B0aO1kijw",
    "https://link.amazon/B0hiDTREk",
    "https://link.amazon/B06l3OmPW",
    "https://link.amazon/B03mkWj2v",
    "https://link.amazon/B05zHJoX9",
    "https://link.amazon/B07VPhkpr",
    "https://link.amazon/B06NjgMxp",
    "https://link.amazon/B08tkZCO3",
    "https://link.amazon/B0eVhcDCS",
    "https://link.amazon/B02eA8xrx",
    "https://link.amazon/B0gvWzFVd",
    "https://link.amazon/B02vLNaVl",
    "https://link.amazon/B0gg4yQQh",
    "https://link.amazon/B0duEiyZy",
    "https://link.amazon/B01QEZMuf",
    "https://link.amazon/B0c5Lw2kK",
    "https://link.amazon/B0j48Zzj7",
    "https://link.amazon/B048CzS19",
    "https://link.amazon/B08zdmeey",
    "https://link.amazon/B0gM78VL4",
    "https://link.amazon/B0gM78VL4",
    "https://link.amazon/B08uUcKgL",
    "https://link.amazon/B00Vv8GwR",
    "https://link.amazon/B0ditbeSM",
    "https://link.amazon/B09cBVZqw",
    "https://link.amazon/B0dR8MSd0",
    "https://link.amazon/B0i6qnro4",
    "https://link.amazon/B0gGwXbgd",
    "https://link.amazon/B06yE2Oqc",
    "https://link.amazon/B0gIevM1m",
    "https://link.amazon/B06YGk0Wy",
    "https://link.amazon/B02dKVrrg",
    "https://link.amazon/B07XwTMB5",
    "https://link.amazon/B07hLyLkj"
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

    with open("scratch/resolved_daily_batch.json", "w") as f:
        json.dump(resolved_products, f, indent=2)

if __name__ == "__main__":
    main()
