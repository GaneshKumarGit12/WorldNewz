import json
import re
import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

rescued_item = {
    "asin": "B0GQBFK4W2",
    "title": "DIL SE Boyshorts Panties for Women Cotton Stretch Boyshort Underwear (Pack of 3)",
    "description": "Get the best deal on DIL SE Boyshorts Panties for Women. High quality, durable, and highly rated on Amazon.",
    "imageUrl": "https://m.media-amazon.com/images/I/71TVgR8UUfL._SL1500_.jpg",
    "price": 399.0,
    "originalPrice": 899.0,
    "category": "Lifestyle",
    "resolvedUrl": "https://www.amazon.in/dp/B0GQBFK4W2?tag=ganeshd12-21"
}

if not any(p["asin"] == rescued_item["asin"] for p in products):
    products.append(rescued_item)

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

print("Saved scratch/resolved_daily_batch.json")
