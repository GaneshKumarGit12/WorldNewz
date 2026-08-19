import urllib.request
import re
import html as html_parser
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

asin = "B078KSL42N"
headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1'
}

url = f"https://www.amazon.in/dp/{asin}"
try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=12) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        title_m = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
        title = title_m.group(1).replace('Amazon.in', '').replace('Buy', '').strip() if title_m else ""
        title = re.sub(r'\s*: Amazon\.in.*$', '', title, flags=re.IGNORECASE).strip()
        
        img_m = re.search(r'https://m\.media-amazon\.com/images/I/[A-Za-z0-9%_\-\+\.]+\.(?:jpg|png)', html)
        img = img_m.group(0) if img_m else ""

        price_m = re.search(r'<span class="a-price-whole">\s*([\d,]+)', html)
        price = float(price_m.group(1).replace(',', '')) if price_m else 999.0

        if "amazon.com/images/I/" in img:
            img = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\.(jpg|png|jpeg|webp)', r'._SL1500_.\1', img, flags=re.IGNORECASE)

        print(f"ASIN {asin}: Title='{title}' | Price={price} | Img='{img}'")

        if title and img:
            with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
                products = json.load(f)
            
            p = {
                "asin": asin,
                "title": title[:120],
                "description": f"Get the best deal on {title[:80]}. High quality, durable, and highly rated on Amazon.",
                "imageUrl": img,
                "price": price,
                "originalPrice": round(price * 1.35, 2),
                "category": "Lifestyle" if any(k in title.lower() for k in ['shirt', 'kurta', 'dress', 'shoe', 'bag', 'wear']) else "Shopping",
                "resolvedUrl": f"https://www.amazon.in/dp/{asin}?tag=ganeshd12-21"
            }
            products.append(p)
            with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
                json.dump(products, f, indent=2)
            print("Successfully added rescued product to scratch/resolved_daily_batch.json!")
except Exception as e:
    print(f"Error: {e}")
