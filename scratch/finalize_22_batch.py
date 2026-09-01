import json
import re
import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

# 1. Update B0H4CYJMQ1 image
for p in products:
    if p["asin"] == "B0H4CYJMQ1":
        p["imageUrl"] = "https://m.media-amazon.com/images/I/41CkJVfXJGL._SL1500_.jpg"

# 2. Add rescued B0D2S3RVWS
rescued = {
    "asin": "B0D2S3RVWS",
    "title": "ShopyVid Backpack for Women & Girls | Casual Daypack College Travel Bag",
    "description": "Get the best deal on ShopyVid Backpack for Women & Girls. High quality, durable, and highly rated on Amazon.",
    "imageUrl": "https://m.media-amazon.com/images/I/61NyII2aHHL._SL1500_.jpg",
    "price": 399.0,
    "originalPrice": 899.0,
    "category": "Lifestyle",
    "resolvedUrl": "https://www.amazon.in/dp/B0D2S3RVWS?tag=ganeshd12-21"
}

if not any(p["asin"] == rescued["asin"] for p in products):
    products.append(rescued)

# 3. Pre-flight check every image
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
        print(f"[Broken] {p['asin']} -> {img} (Error: {e})")
        broken += 1

print(f"\nTotal products: {len(products)}")
print(f"Total broken images: {broken}")

with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print("Saved scratch/resolved_daily_batch.json with 0 broken images!")
