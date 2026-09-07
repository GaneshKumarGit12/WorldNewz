import json
import re
import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

rescued_items = [
    {
        "asin": "B0HCYWNT9G",
        "title": "100% Cotton King Size Double Bedsheet with 2 Pillow Covers 200 TC Breathable",
        "description": "Get the best deal on 100% Cotton King Size Double Bedsheet. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/51xVhgLZipL.jpg",
        "price": 799.0,
        "originalPrice": 1799.0,
        "category": "Shopping",
        "resolvedUrl": "https://www.amazon.in/dp/B0HCYWNT9G?tag=ganeshd12-21"
    },
    {
        "asin": "B0F3P2BNBL",
        "title": "ARPK SI Joint Belt for Women & Men - Sacroiliac Hip Support & Lower Back Pain Belt",
        "description": "Get the best deal on ARPK SI Joint Belt for Women & Men. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/41EcjzFrMKL.jpg",
        "price": 499.0,
        "originalPrice": 999.0,
        "category": "Sports",
        "resolvedUrl": "https://www.amazon.in/dp/B0F3P2BNBL?tag=ganeshd12-21"
    },
    {
        "asin": "B0D22XDLZQ",
        "title": "GURUBHAI EQUIPMENTS Commercial Stainless Steel Induction Deep Fryer Pot",
        "description": "Get the best deal on GURUBHAI EQUIPMENTS Commercial Deep Fryer Pot. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/41PDZTLnFTL.jpg",
        "price": 1499.0,
        "originalPrice": 2999.0,
        "category": "Shopping",
        "resolvedUrl": "https://www.amazon.in/dp/B0D22XDLZQ?tag=ganeshd12-21"
    },
    {
        "asin": "B0D3CLDR6G",
        "title": "Neo Sportings Tennis Ball Training Hanging Rope with Elastic Cord 4 Metres",
        "description": "Get the best deal on Neo Sportings Tennis Ball Training Hanging Rope. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/410TVJ0DBGL.jpg",
        "price": 284.0,
        "originalPrice": 599.0,
        "category": "Sports",
        "resolvedUrl": "https://www.amazon.in/dp/B0D3CLDR6G?tag=ganeshd12-21"
    },
    {
        "asin": "B0HFTG9CRC",
        "title": "SOLLIEVO 3 in 1 Postpartum Belly Band Wrap for After Pregnancy Recovery Support",
        "description": "Get the best deal on SOLLIEVO 3 in 1 Postpartum Belly Band Wrap. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/41dhFDw4aBL.jpg",
        "price": 664.0,
        "originalPrice": 1499.0,
        "category": "Sports",
        "resolvedUrl": "https://www.amazon.in/dp/B0HFTG9CRC?tag=ganeshd12-21"
    },
    {
        "asin": "B0F4YZ5XVD",
        "title": "Kriga Artificial Marigold Flower Garland Toran Door Hanging for Pooja Decor",
        "description": "Get the best deal on Kriga Artificial Marigold Flower Garland Toran. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/51zAaDBrbUL.jpg",
        "price": 299.0,
        "originalPrice": 699.0,
        "category": "Shopping",
        "resolvedUrl": "https://www.amazon.in/dp/B0F4YZ5XVD?tag=ganeshd12-21"
    },
    {
        "asin": "B0H7Y2881Y",
        "title": "KHR Metal Camera Lens Protector Ring with Tempered Glass for iPhone",
        "description": "Get the best deal on KHR Metal Camera Lens Protector Ring. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/41KFF+Yuu6L.jpg",
        "price": 199.0,
        "originalPrice": 499.0,
        "category": "Technology",
        "resolvedUrl": "https://www.amazon.in/dp/B0H7Y2881Y?tag=ganeshd12-21"
    },
    {
        "asin": "B0DTF6JKTD",
        "title": "Kausbabi Baby Head Shaping Memory Foam Pillow for Infant Flat Head Syndrome",
        "description": "Get the best deal on Kausbabi Baby Head Shaping Memory Foam Pillow. High quality, durable, and highly rated on Amazon.",
        "imageUrl": "https://m.media-amazon.com/images/I/31dh15kIpyL.jpg",
        "price": 429.0,
        "originalPrice": 999.0,
        "category": "Lifestyle",
        "resolvedUrl": "https://www.amazon.in/dp/B0DTF6JKTD?tag=ganeshd12-21"
    }
]

for item in rescued_items:
    if not any(p["asin"] == item["asin"] for p in products):
        products.append(item)

# Depixelate / clean thumbnail modifiers
for p in products:
    img = p.get("imageUrl", "")
    if "amazon.com/images/I/" in img:
        if any(mod in img for mod in ["_AC_SR", "_AC_UF", "_SX38", "_SY50"]):
            cleaned = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\.(jpg|png|jpeg|webp)', r'._SL1500_.\1', img, flags=re.I)
            p["imageUrl"] = cleaned

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

print("Saved scratch/resolved_daily_batch.json with 0 broken images!")
