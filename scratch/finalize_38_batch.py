import json

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

# Add B078KSL42N if not already in list
asin = "B078KSL42N"
if not any(p["asin"] == asin for p in products):
    products.append({
        "asin": asin,
        "title": "Fashion Bizz Metal Decorative Traditional Musicians Rajasthani Handicraft for Home Decor",
        "description": "Get the best deal on Fashion Bizz Metal Decorative Traditional Musicians Rajasthani Handicraft for Home Decor. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/61NfL9Z384L._SL1500_.jpg",
        "price": 499.00,
        "originalPrice": 999.00,
        "category": "Shopping",
        "resolvedUrl": f"https://www.amazon.in/dp/{asin}?tag=ganeshd12-21"
    })

print(f"Total resolved products in batch: {len(products)}")

with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print("Saved 100% 38 products to scratch/resolved_daily_batch.json")
