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
    "https://link.amazon/B0cVpjVSa",
    "https://link.amazon/B0iNz30in",
    "https://link.amazon/B0hzIFRHL",
    "https://link.amazon/B05RnRtgX",
    "https://link.amazon/B01L4kagg",
    "https://link.amazon/B00K8WA0f",
    "https://link.amazon/B0h0nOdta",
    "https://link.amazon/B01K9BC8j",
    "https://link.amazon/B0jettT3d",
    "https://link.amazon/B0hHGIT8w",
    "https://link.amazon/B0dWi3G7d",
    "https://link.amazon/B0hxXEINj",
    "https://link.amazon/B0dvrBLAy",
    "https://link.amazon/B0aK7DLAK",
    "https://link.amazon/B0bLp7s1f",
    "https://link.amazon/B0eqz7kDH",
    "https://link.amazon/B09logaOp",
    "https://link.amazon/B091Fqyjd",
    "https://link.amazon/B05SNyg9C",
    "https://link.amazon/B05EzroMj",
    "https://link.amazon/B01ExD2Re",
    "https://link.amazon/B0adeVOSf",
    "https://link.amazon/B09arWI1f",
    "https://link.amazon/B0f4RjvdQ",
    "https://link.amazon/B0guCa70V",
    "https://link.amazon/B05JxxWEf",
    "https://link.amazon/B0aj6ksM6",
    "https://link.amazon/B07tTxVOT",
    "https://link.amazon/B02AR88mt",
    "https://link.amazon/B061bsViT",
    "https://link.amazon/B0ctsEldC",
    "https://link.amazon/B09x1TEcO",
    "https://link.amazon/B00HMFJ4e",
    "https://link.amazon/B06gX9TrK",
    "https://link.amazon/B0iH7mzgc",
    "https://link.amazon/B00MweXwG",
    "https://link.amazon/B08VFkYcW",
    "https://link.amazon/B0hOocVAl",
    "https://link.amazon/B08mo9DOb",
    "https://link.amazon/B0fphtqD9",
    "https://link.amazon/B02F0TFp5",
    "https://link.amazon/B0hLyiOsQ",
    "https://link.amazon/B07NdmUrT",
    "https://link.amazon/B0gdBZSZd",
    "https://link.amazon/B031NkpEl",
    "https://link.amazon/B008TeQ2j",
    "https://link.amazon/B05Wd4ndw",
    "https://link.amazon/B03sRbGa5",
    "https://link.amazon/B01dX0nnq",
    "https://link.amazon/B0bzV1gKe",
    "https://link.amazon/B0bdaF7BK",
    "https://link.amazon/B0hqb3Iuc",
    "https://link.amazon/B0bP1kQjV",
    "https://link.amazon/B0erIzVeh",
    "https://link.amazon/B0hGHoJYP",
    "https://link.amazon/B0cFg8KPK",
    "https://link.amazon/B0ftNA3Uq",
    "https://link.amazon/B0dtGZuXT"
]

SEEN_ASINS_PATH = "scratch/seen_asins.json"

def load_seen_asins():
    if os.path.exists(SEEN_ASINS_PATH):
        with open(SEEN_ASINS_PATH, "r", encoding="utf-8") as f:
            return set(json.load(f))
    return set()

def save_seen_asins(seen):
    with open(SEEN_ASINS_PATH, "w", encoding="utf-8") as f:
        json.dump(sorted(list(seen)), f, indent=2)

user_agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
]

def clean_amazon_image_url(img_url):
    if not img_url:
        return ""
    u = img_url.strip()
    if "amazon.com/images/I/" in u:
        u = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\.(jpg|png|jpeg|webp)', r'._SL1500_.\1', u, flags=re.IGNORECASE)
        u = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\._', r'._', u, flags=re.IGNORECASE)
    return u

def resolve_initial_url(url):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            final_url = resp.geturl()
            html = resp.read().decode('utf-8', errors='ignore')
            return final_url, html
    except urllib.error.HTTPError as e:
        loc = e.headers.get('Location', '')
        return loc, ""
    except Exception as e:
        return url, ""

def extract_asin_from_any_string(s):
    if not s:
        return None
    m = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})', s, re.IGNORECASE)
    if m:
        return m.group(1).upper()
    m2 = re.search(r'asin=([A-Z0-9]{10})', s, re.IGNORECASE)
    if m2:
        return m2.group(1).upper()
    m3 = re.search(r'browser_fallback_url=.*?%2Fdp%2F([A-Z0-9]{10})', s, re.IGNORECASE)
    if m3:
        return m3.group(1).upper()
    m4 = re.search(r'%2Fdp%2F([A-Z0-9]{10})', s, re.IGNORECASE)
    if m4:
        return m4.group(1).upper()
    m5 = re.search(r'(?:link\.amazon|amzlinks\.in)/([A-Z0-9]{9,10})', s, re.IGNORECASE)
    if m5:
        code = m5.group(1)
        if code.startswith("B0") and len(code) == 10:
            return code.upper()
    return None

def fetch_details_for_asin(asin):
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
                    title = re.sub(r'\s*: Amazon\.in.*$', '', title, flags=re.IGNORECASE).strip()

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

                if img_url:
                    img_url = clean_amazon_image_url(img_url)

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
                    if any(k in t_lower for k in ['phone', 'mobile', 'charger', 'cable', 'headphone', 'earbuds', 'laptop', 'smartwatch', 'tv', 'electronics', 'speaker', 'led', 'pro', 'wifi', 'watch', 'camera', 'ups', 'router']):
                        category = "Technology"
                    elif any(k in t_lower for k in ['shirt', 'pant', 'shoes', 'dress', 'bag', 'fashion', 'watch', 'wear', 't-shirt', 'wallet', 'kurta', 'suit', 'saree', 'trolley', 'mattress', 'bed', 'sofa', 'pajama', 'nightsuit']):
                        category = "Lifestyle"
                    elif any(k in t_lower for k in ['kitchen', 'home', 'bottle', 'cookware', 'clean', 'mat', 'light', 'furnishing', 'storage', 'rakhi', 'vacuum', 'juice', 'cloth', 'glass', 'mug', 'cup', 'idol', 'frame']):
                        category = "Shopping"
                    elif any(k in t_lower for k in ['sport', 'fit', 'gym', 'cycle', 'ball', 'run', 'yoga', 'paddle', 'racket', 'band']):
                        category = "Sports"
                    else:
                        category = "Shopping"

                    desc = f"Get the best deal on {title[:80]}. High quality, durable, and highly rated on Amazon."

                    return {
                        "asin": asin,
                        "title": title[:120],
                        "description": desc,
                        "imageUrl": img_url,
                        "price": price,
                        "originalPrice": original_price,
                        "category": category,
                        "resolvedUrl": f"https://www.amazon.in/dp/{asin}?tag=ganeshd12-21"
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
        print(f"[{idx}/{len(urls)}] Processing {u}...")
        final_url, html = resolve_initial_url(u)
        asin = extract_asin_from_any_string(final_url) or extract_asin_from_any_string(html) or extract_asin_from_any_string(u)

        if not asin and "amzlinks.in" in final_url:
            amz_final, amz_html = resolve_initial_url(final_url)
            asin = extract_asin_from_any_string(amz_final) or extract_asin_from_any_string(amz_html)

        if not asin:
            print(f"  ❌ Could not resolve ASIN for {u} (Target: {final_url})")
            failed_links.append((u, "ASIN not found"))
            continue

        if asin in seen_asins:
            print(f"  ⏩ ASIN {asin} already in seen registry. Skipping duplicate.")
            skipped_duplicates += 1
            continue

        details = fetch_details_for_asin(asin)
        if not details:
            time.sleep(1.5)
            details = fetch_details_for_asin(asin)

        if not details:
            print(f"  ❌ Failed to fetch exact title/image for ASIN {asin}")
            failed_links.append((u, asin))
            continue

        resolved_products.append(details)
        seen_asins.add(asin)
        print(f"  ✅ [{details['category']}] {asin}: {details['title'][:55]} (₹{details['price']})")
        print(f"     Img: {details['imageUrl']}")
        time.sleep(random.uniform(0.6, 1.3))

    print("\n===========================================")
    print(f"Total Resolved: {len(resolved_products)}")
    print(f"Skipped Duplicates: {skipped_duplicates}")
    print(f"Failed Links: {len(failed_links)}")
    if failed_links:
        print("Failed links:", failed_links)
    print("===========================================")

    save_seen_asins(seen_asins)

    with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
        json.dump(resolved_products, f, indent=2)

    print("Saved results to scratch/resolved_daily_batch.json")

if __name__ == "__main__":
    main()
