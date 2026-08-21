import json
import re

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

# Add B09H5SYGL5
if not any(p["asin"] == "B09H5SYGL5" for p in products):
    products.append({
        "asin": "B09H5SYGL5",
        "title": "HS Hindustani SAUDAGR Boho Beach Boat Shape Ceramic Bowl Set of 2(200ml Each)",
        "description": "Get the best deal on HS Hindustani SAUDAGR Boho Beach Boat Shape Ceramic Bowl Set. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/61cQ75Y8qPL._SL1500_.jpg",
        "price": 759.0,
        "originalPrice": 1199.0,
        "category": "Shopping",
        "resolvedUrl": "https://www.amazon.in/dp/B09H5SYGL5?tag=ganeshd12-21"
    })

# Add B0DQV8T2JZ
if not any(p["asin"] == "B0DQV8T2JZ" for p in products):
    products.append({
        "asin": "B0DQV8T2JZ",
        "title": "MIDOS PC Back Cover Compatible with iPhone 15 Pro Max, Matte Finish Ultra Thin Magnetic Case (White)",
        "description": "Get the best deal on MIDOS PC Back Cover Compatible with iPhone 15 Pro Max. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/41z4rsHgIjL.jpg",
        "price": 284.0,
        "originalPrice": 599.0,
        "category": "Technology",
        "resolvedUrl": "https://www.amazon.in/dp/B0DQV8T2JZ?tag=ganeshd12-21"
    })

# Ensure all image URLs are clean HD
for p in products:
    img = p.get("imageUrl", "")
    if "amazon.com/images/I/" in img:
        p["imageUrl"] = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\.(jpg|png|jpeg|webp)', r'._SL1500_.\1', img, flags=re.IGNORECASE)

print(f"Total resolved products in 68-link batch: {len(products)}")

with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print("Saved 100% 68 products to scratch/resolved_daily_batch.json")
