import urllib.request
import json
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

print(f"Testing {len(products)} product images...")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

broken_images = []

for idx, p in enumerate(products, 1):
    asin = p["asin"]
    img_url = p.get("imageUrl", "")
    try:
        req = urllib.request.Request(img_url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            content_type = resp.headers.get("Content-Type", "")
            if resp.status != 200 or not content_type.startswith("image"):
                print(f"❌ [{idx}] ASIN {asin}: Status {resp.status}, Content-Type: {content_type}")
                broken_images.append((p, resp.status, img_url))
    except Exception as e:
        print(f"❌ [{idx}] ASIN {asin}: Error loading {img_url}: {e}")
        broken_images.append((p, str(e), img_url))

print(f"\nTotal broken images: {len(broken_images)} out of {len(products)}")
for p, err, url in broken_images:
    print(f"  - ASIN {p['asin']} ({p['title'][:40]}): {err} -> {url}")
