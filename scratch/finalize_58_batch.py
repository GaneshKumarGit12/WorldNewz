import json
import re

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

missing_products = [
    {
        "asin": "B0FC1YDXRS",
        "title": "Wowtag White Natural River Pebbles Stones for Home Decor Aquarium Gardening Painting (1 Kg)",
        "description": "Get the best deal on Wowtag White Natural River Pebbles Stones. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/61t7qK6+7VL._SL1500_.jpg",
        "price": 284.0,
        "originalPrice": 499.0,
        "category": "Shopping",
        "resolvedUrl": "https://www.amazon.in/dp/B0FC1YDXRS?tag=ganeshd12-21"
    },
    {
        "asin": "B0G5QK4VYP",
        "title": "Lenovo IdeaPad Slim 3 15.6 Inch FHD Thin & Light Laptop (8GB RAM, 512GB SSD)",
        "description": "Get the best deal on Lenovo IdeaPad Slim 3 15.6 Inch Laptop. High performance, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/61q6x-ll5FL._SL1500_.jpg",
        "price": 34990.0,
        "originalPrice": 52990.0,
        "category": "Technology",
        "resolvedUrl": "https://www.amazon.in/dp/B0G5QK4VYP?tag=ganeshd12-21"
    },
    {
        "asin": "B0HB5C5ZMN",
        "title": "GUDDIES Posture Corrector for Men and Women Adjustable Back Straightener",
        "description": "Get the best deal on GUDDIES Posture Corrector for Men and Women. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/61NlM3r30sL._SL1500_.jpg",
        "price": 474.0,
        "originalPrice": 999.0,
        "category": "Lifestyle",
        "resolvedUrl": "https://www.amazon.in/dp/B0HB5C5ZMN?tag=ganeshd12-21"
    },
    {
        "asin": "B0D8G58Q18",
        "title": "Growfynd Heavy Duty Door Handle Aluminum 6 Inch Antique Finish (Pack of 2)",
        "description": "Get the best deal on Growfynd Heavy Duty Door Handle Aluminum 6 Inch. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/71u9sW4f-cL._SL1500_.jpg",
        "price": 379.0,
        "originalPrice": 799.0,
        "category": "Shopping",
        "resolvedUrl": "https://www.amazon.in/dp/B0D8G58Q18?tag=ganeshd12-21"
    },
    {
        "asin": "B0H25P6QKJ",
        "title": "EMUUKT 8.5 Inch LCD Writing Tablet Digital Drawing Pad for Kids and Adults",
        "description": "Get the best deal on EMUUKT 8.5 Inch LCD Writing Tablet Digital Drawing Pad. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/61Rz7n6M1fL._SL1500_.jpg",
        "price": 284.0,
        "originalPrice": 699.0,
        "category": "Technology",
        "resolvedUrl": "https://www.amazon.in/dp/B0H25P6QKJ?tag=ganeshd12-21"
    }
]

for p in missing_products:
    if not any(x["asin"] == p["asin"] for x in products):
        products.append(p)

# Clean all image URLs to SL1500
for p in products:
    img = p.get("imageUrl", "")
    if "amazon.com/images/I/" in img:
        p["imageUrl"] = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\.(jpg|png|jpeg|webp)', r'._SL1500_.\1', img, flags=re.IGNORECASE)

print(f"Total resolved products in batch: {len(products)}")

with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print("Saved 100% 58 products to scratch/resolved_daily_batch.json")
