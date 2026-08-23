import json
import re

updates = {
    'B0HB5C5ZMN': 'https://m.media-amazon.com/images/I/51OYQt1+CnL._SL1500_.jpg',
    'B0D8G58Q18': 'https://m.media-amazon.com/images/I/71R6r-3i91L._SL1500_.jpg',
    'B0H25P6QKJ': 'https://m.media-amazon.com/images/I/61UXbjAbUJL._SL1500_.jpg',
    'B0FC1YDXRS': 'https://m.media-amazon.com/images/I/71X9DeiwmlL._SL1500_.jpg'
}

# 1. Update scratch/resolved_daily_batch.json
with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

for p in products:
    asin = p.get("asin")
    if asin in updates:
        p["imageUrl"] = updates[asin]

with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print("Updated scratch/resolved_daily_batch.json!")

# 2. Update WorldNewzWebAPI/Services/AmazonProductService.cs
with open("WorldNewzWebAPI/Services/AmazonProductService.cs", "r", encoding="utf-8") as f:
    csharp_code = f.read()

for asin, new_img in updates.items():
    # Regex to find product block for this ASIN and update its ImageUrl
    pattern = rf'(Asin\s*=\s*"{asin}",[\s\S]*?ImageUrl\s*=\s*")[^"]+(")'
    csharp_code = re.sub(pattern, rf'\g<1>{new_img}\g<2>', csharp_code)

with open("WorldNewzWebAPI/Services/AmazonProductService.cs", "w", encoding="utf-8") as f:
    f.write(csharp_code)

print("Updated WorldNewzWebAPI/Services/AmazonProductService.cs!")
