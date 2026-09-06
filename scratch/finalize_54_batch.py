import json
import re
import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

# Depixelate any thumbnail modifiers
for p in products:
    img = p.get("imageUrl", "")
    if "amazon.com/images/I/" in img:
        cleaned = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\.(jpg|png|jpeg|webp)', r'._SL1500_.\1', img, flags=re.I)
        cleaned = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\._', r'._', cleaned, flags=re.I)
        p["imageUrl"] = cleaned

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
