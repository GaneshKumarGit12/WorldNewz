import urllib.request
import http.cookiejar
import re
import html as html_parser
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

urls = [
    ("https://link.amazon/B05k6NO3U", "B0GF2B5TGJ"),
    ("https://link.amazon/B05N7XAG2", "B0FNR4D1P6")
]

user_agents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
]

rescued = []

for short_url, default_asin in urls:
    print(f"\n--- Tracing {short_url} ---")
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    opener.addheaders = [
        ('User-Agent', user_agents[0]),
        ('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
    ]
    
    try:
        with opener.open(short_url, timeout=12) as resp:
            final_url = resp.geturl()
            html = resp.read().decode('utf-8', errors='ignore')
            
            m = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})', final_url, re.I)
            asin = m.group(1).upper() if m else default_asin
            
            # Title
            title = ""
            title_m = re.search(r'<title>(.*?)</title>', html, re.I)
            if title_m:
                title = html_parser.unescape(title_m.group(1).strip())
                title = re.sub(r'^(Amazon\.in:\s*|Buy\s*)', '', title, flags=re.I).strip()
                title = re.sub(r'\s*: Amazon\.in.*$', '', title, flags=re.I).strip()
            
            # Image
            img_url = ""
            all_imgs = re.findall(r'https://m\.media-amazon\.com/images/I/[A-Za-z0-9%_\-\+\.]+\.(?:jpg|png)', html)
            for img in all_imgs:
                if not any(x in img for x in ['PKmb-play', 'sprite', 'icon', 'logo', 'G/01', 'G/31']):
                    # Test image
                    try:
                        t_req = urllib.request.Request(img, headers={'User-Agent': user_agents[1]})
                        with urllib.request.urlopen(t_req, timeout=5) as t_resp:
                            if t_resp.status == 200:
                                img_url = img
                                break
                    except:
                        pass
            
            # Price
            price = 0.0
            price_m = re.search(r'<span class="a-price-whole">\s*([\d,]+)', html)
            if price_m:
                try:
                    price = float(price_m.group(1).replace(',', ''))
                except:
                    price = 0.0
            
            print(f"ASIN: {asin}")
            print(f"Title: {title}")
            print(f"Image: {img_url}")
            print(f"Price: {price}")
            
            if title and img_url:
                rescued.append({
                    "asin": asin,
                    "title": title[:120],
                    "description": f"Get the best deal on {title[:80]}. High quality, durable, and highly rated on Amazon.",
                    "imageUrl": img_url,
                    "price": price if price > 0 else 499.0,
                    "originalPrice": round(price * 1.35, 2) if price > 0 else 999.0,
                    "category": "Shopping" if "bag" not in title.lower() and "shoe" not in title.lower() else "Lifestyle",
                    "resolvedUrl": f"https://www.amazon.in/dp/{asin}?tag=ganeshd12-21"
                })
    except Exception as e:
        print(f"Error {short_url}: {e}")

print(f"\nRescued {len(rescued)} products!")

if rescued:
    with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
        products = json.load(f)
    
    for r in rescued:
        if not any(p["asin"] == r["asin"] for p in products):
            products.append(r)
            print(f"Added rescued ASIN {r['asin']} to batch JSON!")
    
    with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2)

    print(f"Total resolved in scratch/resolved_daily_batch.json: {len(products)}")
