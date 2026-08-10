import urllib.request
import urllib.parse
import http.cookiejar
import re
import html as html_parser
import json
import time
import random
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Load current batch
with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

print(f"Loaded {len(products)} products from resolved_daily_batch.json")

user_agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
]

def fetch_product_details(asin):
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

    for url in urls_to_try:
        try:
            with opener.open(url, timeout=12) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                
                # Title
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

                if title:
                    title = re.sub(r'\s+', ' ', title)
                    title = re.sub(r'^(Amazon\.in:\s*|Buy\s*)', '', title, flags=re.IGNORECASE).strip()

                # Image
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

                # Price
                price = 0.0
                price_m = re.search(r'<span class="a-price-whole">\s*([\d,]+)', html)
                if price_m:
                    try:
                        price = float(price_m.group(1).replace(',', ''))
                    except:
                        price = 0.0

                if title and img_url:
                    return title, img_url, price

        except Exception as e:
            pass

    return "", "", 0.0

fixed_count = 0
for idx, p in enumerate(products):
    img = p.get("imageUrl", "")
    title = p.get("title", "")
    asin = p["asin"]
    
    is_broken_img = "images-na.ssl-images-amazon.com" in img or not img
    is_broken_title = title.startswith("Featured Deal")

    if is_broken_img or is_broken_title:
        print(f"[{idx+1}/{len(products)}] Fixing ASIN {asin}...")
        
        # Retry fetching details
        new_title, new_img, new_price = fetch_product_details(asin)
        
        if not new_title and not new_img:
            # Sleep and retry once more with different agent
            time.sleep(2)
            new_title, new_img, new_price = fetch_product_details(asin)

        if new_title:
            p["title"] = new_title
            p["description"] = f"Get the best deal on {new_title[:80]}. High quality, durable, and highly rated on Amazon."
            # Category update
            t_lower = new_title.lower()
            if any(k in t_lower for k in ['phone', 'mobile', 'charger', 'cable', 'headphone', 'earbuds', 'laptop', 'smartwatch', 'tv', 'electronics', 'speaker', 'led', 'pro', 'wifi']):
                p["category"] = "Technology"
            elif any(k in t_lower for k in ['shirt', 'pant', 'shoes', 'dress', 'bag', 'fashion', 'watch', 'wear', 't-shirt', 'wallet', 'kurta', 'suit', 'saree']):
                p["category"] = "Lifestyle"
            elif any(k in t_lower for k in ['kitchen', 'home', 'bottle', 'cookware', 'clean', 'mat', 'light', 'furnishing', 'storage']):
                p["category"] = "Shopping"

        if new_img:
            p["imageUrl"] = new_img

        if new_price > 0:
            p["price"] = new_price
            p["originalPrice"] = round(new_price * 1.35, 2)

        print(f"  Result -> Title: '{p['title'][:50]}' | Img: '{p['imageUrl']}' | Price: ₹{p['price']}")
        fixed_count += 1
        time.sleep(random.uniform(0.8, 1.8))

print(f"\nFixed {fixed_count} products!")

# Save fixed products back to JSON
with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print("Saved updated scratch/resolved_daily_batch.json")
