import json
import re

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

def clean_amazon_img_url(url):
    if not url or not url.strip():
        return url
    u = url.strip()
    if "amazon.com/images/I/" in u:
        # Strip sizing modifiers and replace with ._SL1500_.jpg / png
        u = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\.(jpg|png|jpeg|webp)', r'._SL1500_.\1', u, flags=re.IGNORECASE)
        u = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\._', r'._', u, flags=re.IGNORECASE)
    return u

cleaned_count = 0
for p in products:
    old_img = p.get("imageUrl", "")
    new_img = clean_amazon_img_url(old_img)
    if old_img != new_img:
        p["imageUrl"] = new_img
        cleaned_count += 1
        print(f"ASIN {p['asin']}: {old_img} -> {new_img}")

with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print(f"\nCleaned {cleaned_count} image URLs in scratch/resolved_daily_batch.json!")
