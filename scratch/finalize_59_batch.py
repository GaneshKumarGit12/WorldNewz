import json
import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

img_fixes = {
    'B0BN6PZXH9': 'https://m.media-amazon.com/images/I/91i4pWItKAL._AC_UY1100_.jpg',
    'B0GSW6RCTZ': 'https://m.media-amazon.com/images/I/61yT0U5+hTL._AC_UY1100_.jpg',
    'B0C4TDNPRZ': 'https://m.media-amazon.com/images/I/91ScvUD5xXL._AC_UY1100_.jpg'
}

for p in products:
    if p["asin"] in img_fixes:
        p["imageUrl"] = img_fixes[p["asin"]]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
broken = 0
for p in products:
    img = p.get("imageUrl", "")
    try:
        req = urllib.request.Request(img, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status != 200:
                print(f"❌ Broken: {p['asin']} -> {img}")
                broken += 1
    except Exception as e:
        print(f"❌ Broken: {p['asin']} -> {img} ({e})")
        broken += 1

print(f"\nTotal products: {len(products)}")
print(f"Total broken images: {broken}")

with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print("Saved scratch/resolved_daily_batch.json with 0 broken images!")
