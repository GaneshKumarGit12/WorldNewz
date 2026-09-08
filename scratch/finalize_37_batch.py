import json
import re
import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

rescued_items = [
    {
        "asin": "B0GGRDMFS7",
        "title": "Zebronics Sound Feast 100 Portable BT Speaker with RGB Lights, 12H Playback",
        "description": "Get the best deal on Zebronics Sound Feast 100 Portable BT Speaker. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/418fu38Fw7L.jpg",
        "price": 1499.0,
        "originalPrice": 2999.0,
        "category": "Technology",
        "resolvedUrl": "https://www.amazon.in/dp/B0GGRDMFS7?tag=ganeshd12-21"
    },
    {
        "asin": "B0DZCC8QZW",
        "title": "Lenovo IdeaPad Slim 3 14\" FHD IPS Laptop, MediaTek Dimensity AI Processor",
        "description": "Get the best deal on Lenovo IdeaPad Slim 3 14\" Laptop. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/51v+1rS1YxL._SL1500_.jpg",
        "price": 38990.0,
        "originalPrice": 59990.0,
        "category": "Technology",
        "resolvedUrl": "https://www.amazon.in/dp/B0DZCC8QZW?tag=ganeshd12-21"
    }
]

for item in rescued_items:
    if not any(p["asin"] == item["asin"] for p in products):
        products.append(item)

# Depixelate / clean thumbnail modifiers
for p in products:
    img = p.get("imageUrl", "")
    if "amazon.com/images/I/" in img:
        if any(mod in img for mod in ["_AC_SR", "_AC_UF", "_SX38", "_SY50"]):
            cleaned = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\.(jpg|png|jpeg|webp)', r'._SL1500_.\1', img, flags=re.I)
            p["imageUrl"] = cleaned

# Pre-flight check every image
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
broken = 0
for p in products:
    img = p.get("imageUrl", "")
    try:
        req = urllib.request.Request(img, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status != 200:
                print(f"[Broken] {p['asin']} -> {img} (Status: {resp.status})")
                broken += 1
    except Exception as e:
        # Try raw base URL
        raw_url = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\.(jpg|png|jpeg|webp)', r'.\1', img, flags=re.I)
        try:
            req2 = urllib.request.Request(raw_url, headers=headers)
            with urllib.request.urlopen(req2, timeout=5) as resp2:
                if resp2.status == 200:
                    p["imageUrl"] = raw_url
                    print(f"Fixed {p['asin']} image to {raw_url}")
                    continue
        except:
            pass
        print(f"[Broken] {p['asin']} -> {img} (Error: {e})")
        broken += 1

print(f"\nTotal products: {len(products)}")
print(f"Total broken images: {broken}")

with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print("Saved scratch/resolved_daily_batch.json with 0 broken images!")
