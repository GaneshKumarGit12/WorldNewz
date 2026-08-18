import urllib.request
import urllib.parse
import http.cookiejar
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
    "https://link.amazon/B02JsAefU",
    "https://link.amazon/B08Ov9Y0x",
    "https://link.amazon/B0471GXgy",
    "https://link.amazon/B0grdGZB1",
    "https://link.amazon/B01OmQHys",
    "https://link.amazon/B09OYzvTH",
    "https://link.amazon/B06vxU8hk",
    "https://link.amazon/B09kROCXj",
    "https://link.amazon/B07QUfqlO",
    "https://link.amazon/B0eTU50ri",
    "https://link.amazon/B07wS6yxZ",
    "https://link.amazon/B071Lwwlq",
    "https://link.amazon/B03HCURN5",
    "https://link.amazon/B05ywRKch",
    "https://link.amazon/B01VeLhFT",
    "https://link.amazon/B0hAINDhT",
    "https://link.amazon/B0f1qGBeg",
    "https://link.amazon/B05YeUpAK",
    "https://link.amazon/B0fpGaC4e",
    "https://link.amazon/B0is84D35",
    "https://link.amazon/B050LeLl4",
    "https://link.amazon/B0czHqrXf",
    "https://link.amazon/B02L35bpe",
    "https://link.amazon/B01lvpsDk",
    "https://link.amazon/B08NeGdOB",
    "https://link.amazon/B054pC28K",
    "https://link.amazon/B09nQcLBY",
    "https://link.amazon/B04MTd41f",
    "https://link.amazon/B00OsDqXe",
    "https://link.amazon/B0c8ljDCe"
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
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
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
    m = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})', url, re.IGNORECASE)
    if m:
        return m.group(1).upper()
    m2 = re.search(r'asin=([A-Z0-9]{10})', url, re.IGNORECASE)
    if m2:
        return m2.group(1).upper()
    m3 = re.search(r'link\.amazon/([A-Z0-9]{9,10})', url, re.IGNORECASE)
    if m3:
        code = m3.group(1)
        if code.startswith("B0") and len(code) == 10:
            return code.upper()
    return None

def extract_details_with_cookiejar(asin, resolved_url=""):
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    
    headers = [
        ('User-Agent', random.choice(user_agents)),
        ('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'),
        ('Accept-Language', 'en-US,en;q=0.9,hi;q=0.8'),
        ('Sec-Ch-Ua', '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"'),
        ('Sec-Ch-Ua-Mobile', '?0'),
        ('Sec-Ch-Ua-Platform', '"Windows"')
    ]
    opener.addheaders = headers

    urls_to_try = [
        f"https://www.amazon.in/dp/{asin}",
        f"https://www.amazon.in/gp/product/{asin}"
    ]

    for u in urls_to_try:
        try:
            with opener.open(u, timeout=12) as resp:
                html = resp.read().decode('utf-8', errors='ignore')

                # Title extraction
                title = ""
                title_m = re.search(r'<span id="productTitle"[^>]*>\s*(.*?)\s*</span>', html, re.DOTALL)
                if title_m:
                    title = html_parser.unescape(title_m.group(1).strip())
                if not title:
                    title_m2 = re.search(r'<meta name="title" content="(.*?)"', html, re.IGNORECASE)
                    if title_m2:
                        title = html_parser.unescape(title_m2.group(1).strip())
                if not title:
                    og_title = re.search(r'<meta property="og:title" content="(.*?)"', html, re.IGNORECASE)
                    if og_title:
                        title = html_parser.unescape(og_title.group(1).strip())
                if not title:
                    title_tag = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
                    if title_tag:
                        title = html_parser.unescape(title_tag.group(1).strip())

                if title:
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

                # Price extraction
                price = 0.0
                price_m = re.search(r'<span class="a-price-whole">\s*([\d,]+)', html)
                if price_m:
                    try:
                        price = float(price_m.group(1).replace(',', ''))
                    except:
                        price = 0.0

                if title and img_url:
                    original_price = round(price * 1.35, 2) if price > 0 else 1499.0
                    if price == 0.0:
                        price = 999.0

                    t_lower = title.lower()
                    if any(k in t_lower for k in ['phone', 'mobile', 'charger', 'cable', 'headphone', 'earbuds', 'laptop', 'smartwatch', 'tv', 'electronics', 'speaker', 'led', 'pro', 'wifi']):
                        category = "Technology"
                    elif any(k in t_lower for k in ['shirt', 'pant', 'shoes', 'dress', 'bag', 'fashion', 'watch', 'wear', 't-shirt', 'wallet', 'kurta', 'suit', 'saree']):
                        category = "Lifestyle"
                    elif any(k in t_lower for k in ['kitchen', 'home', 'bottle', 'cookware', 'clean', 'mat', 'light', 'furnishing', 'storage']):
                        category = "Shopping"
                    elif any(k in t_lower for k in ['sport', 'fit', 'gym', 'cycle', 'ball', 'run', 'yoga']):
                        category = "Sports"
                    else:
                        category = "Shopping"

                    desc = f"Get the best deal on {title[:80]}. High quality, durable, and highly rated on Amazon."

                    return {
                        "asin": asin,
                        "title": title,
                        "description": desc,
                        "imageUrl": img_url,
                        "price": price,
                        "originalPrice": original_price,
                        "category": category,
                        "resolvedUrl": resolved_url or u
                    }
        except Exception as e:
            pass

    return None

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

        # Fetch exact details via cookiejar session
        details = extract_details_with_cookiejar(asin, final_url)

        if not details:
            # Retry once with mobile header
            time.sleep(1)
            details = extract_details_with_cookiejar(asin, final_url)

        if not details:
            print(f"❌ Failed to fetch exact title/image for ASIN {asin}")
            failed_links.append(u)
            continue

        resolved_products.append(details)
        seen_asins.add(asin)
        print(f"✅ [{details['category']}] {asin}: {details['title'][:55]} (₹{details['price']})")
        print(f"   Img: {details['imageUrl']}")
        time.sleep(random.uniform(0.6, 1.4))

    print("\n-------------------------------------------")
    print(f"Total Resolved: {len(resolved_products)}")
    print(f"Skipped Duplicates: {skipped_duplicates}")
    print(f"Failed Links: {len(failed_links)}")

    save_seen_asins(seen_asins)

    with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
        json.dump(resolved_products, f, indent=2)

    print("Saved scratch/resolved_daily_batch.json")

if __name__ == "__main__":
    main()
