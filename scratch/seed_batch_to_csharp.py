import json
import os
import re

items = [
    {
        "asin": "B0DTXVM898",
        "title": "Suzvan Indian Pavadai Lehenga Choli Set for Girls",
        "description": "Premium jacquard silk traditional South Indian Pattu Pavadai lehenga choli set for festive occasions and celebrations.",
        "category": "Lifestyle",
        "price": 899.0,
        "originalPrice": 2499.0,
        "rating": 4.6,
        "reviewCount": 380,
        "productUrl": "https://www.amazon.in/dp/B0DTXVM898?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61YwpwVzRSL._SL1500_.jpg"
    },
    {
        "asin": "B0CGPTBFYL",
        "title": "Miraya Impex Punjabi Traditional Jutti Footwear for Women",
        "description": "Handcrafted ethnic Punjabi Jutti with intricate embroidery and cushioned sole for comfortable festive wear.",
        "category": "Lifestyle",
        "price": 649.0,
        "originalPrice": 1499.0,
        "rating": 4.5,
        "reviewCount": 420,
        "productUrl": "https://www.amazon.in/dp/B0CGPTBFYL?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/71CmSn+uLZL._SL1500_.jpg"
    },
    {
        "asin": "B0D14QYFJP",
        "title": "Pluxh Bellies Comfortable & Stylish Ballet Flats for Women",
        "description": "Soft cushioned slip-on ballet flats designed for daily workwear and casual outings.",
        "category": "Lifestyle",
        "price": 549.0,
        "originalPrice": 1299.0,
        "rating": 4.4,
        "reviewCount": 290,
        "productUrl": "https://www.amazon.in/dp/B0D14QYFJP?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61NANabKaRL._SL1000_.jpg"
    },
    {
        "asin": "B0B69589JY",
        "title": "Pluxh Designer Embroidery Punjabi Jutti for Women",
        "description": "Elegant embroidered ethnic Mojari jutti crafted with padded insole for all-day comfort.",
        "category": "Lifestyle",
        "price": 699.0,
        "originalPrice": 1699.0,
        "rating": 4.5,
        "reviewCount": 510,
        "productUrl": "https://www.amazon.in/dp/B0B69589JY?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/71KmY1pyATL._SL1500_.jpg"
    },
    {
        "asin": "B0FNMQ24NV",
        "title": "Xavima Girls Ethnic Lehenga Choli Set",
        "description": "Vibrant ready-to-wear traditional lehenga choli with dupatta for kids festive celebrations.",
        "category": "Lifestyle",
        "price": 799.0,
        "originalPrice": 1999.0,
        "rating": 4.6,
        "reviewCount": 210,
        "productUrl": "https://www.amazon.in/dp/B0FNMQ24NV?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61hx-ExBRhL._SL1500_.jpg"
    },
    {
        "asin": "B0DGY2SH77",
        "title": "Style Dusk Regular Fit Woolen Winter Sweater for Women",
        "description": "Cozy knitted full-sleeve woolen cardigan sweater for winter warmth and casual wear.",
        "category": "Lifestyle",
        "price": 849.0,
        "originalPrice": 1899.0,
        "rating": 4.5,
        "reviewCount": 640,
        "productUrl": "https://www.amazon.in/dp/B0DGY2SH77?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/617iVkfLv5L._SL1500_.jpg"
    },
    {
        "asin": "B0DJD8PJGG",
        "title": "Jwalin Girls Georgette Printed Lehenga Choli Set",
        "description": "Flowy georgette ethnic lehenga choli set with matching dupatta for weddings and festive functions.",
        "category": "Lifestyle",
        "price": 999.0,
        "originalPrice": 2499.0,
        "rating": 4.7,
        "reviewCount": 450,
        "productUrl": "https://www.amazon.in/dp/B0DJD8PJGG?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61b4TcFcV2L._SL1500_.jpg"
    },
    {
        "asin": "B0DGD58SQV",
        "title": "Style Dusk Winterwear Button Cardigan Sweater for Women",
        "description": "Soft breathable V-neck front button cardigan sweater for stylish layering during winter.",
        "category": "Lifestyle",
        "price": 799.0,
        "originalPrice": 1799.0,
        "rating": 4.4,
        "reviewCount": 310,
        "productUrl": "https://www.amazon.in/dp/B0DGD58SQV?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/71PGSn2aPmL._SL1350_.jpg"
    },
    {
        "asin": "B0DGTWXVZZ",
        "title": "Style Dusk Longline Full Sleeves Winter Cardigan",
        "description": "Elegant open-front longline winter cardigan sweater crafted with soft warm knit fabric.",
        "category": "Lifestyle",
        "price": 899.0,
        "originalPrice": 1999.0,
        "rating": 4.5,
        "reviewCount": 280,
        "productUrl": "https://www.amazon.in/dp/B0DGTWXVZZ?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/712OsBIXynL._SL1500_.jpg"
    },
    {
        "asin": "B09XJ8K726",
        "title": "Amazon Brand Pure Cotton Full Sleeves Shirts Pack",
        "description": "Breathable 100% cotton formal and casual button-down shirt pack for everyday comfort.",
        "category": "Lifestyle",
        "price": 999.0,
        "originalPrice": 2199.0,
        "rating": 4.6,
        "reviewCount": 890,
        "productUrl": "https://www.amazon.in/dp/B09XJ8K726?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61CEEuPRM9L._SL1500_.jpg"
    },
    {
        "asin": "B0GJDL274Z",
        "title": "PEGAN Comfortable Breathable Lightweight Casual Shoes",
        "description": "Ultra-lightweight mesh breathable casual walking sneakers designed for all-day comfort.",
        "category": "Lifestyle",
        "price": 699.0,
        "originalPrice": 1599.0,
        "rating": 4.4,
        "reviewCount": 520,
        "productUrl": "https://www.amazon.in/dp/B0GJDL274Z?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/71fiRY278BL._SL1500_.jpg"
    },
    {
        "asin": "B0GGHLCK2S",
        "title": "PEGAN Comfortable & Stylish Nightwear Clothing Set",
        "description": "Soft cotton loungewear and nightwear pajama set for relaxed home comfort.",
        "category": "Lifestyle",
        "price": 599.0,
        "originalPrice": 1399.0,
        "rating": 4.5,
        "reviewCount": 340,
        "productUrl": "https://www.amazon.in/dp/B0GGHLCK2S?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/51gBITE6F6L._SL1080_.jpg"
    },
    {
        "asin": "B0GK93PM58",
        "title": "KE EXPORTS Bandhani Breathable Multicolor Scarves",
        "description": "Traditional printed Bandhani dupatta and scarf set made with premium soft cotton fabric.",
        "category": "Lifestyle",
        "price": 399.0,
        "originalPrice": 899.0,
        "rating": 4.6,
        "reviewCount": 180,
        "productUrl": "https://www.amazon.in/dp/B0GK93PM58?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61XmD6mBjCL._SL1254_.jpg"
    },
    {
        "asin": "B09P446B53",
        "title": "KE EXPORTS Women's Printed Sun Protection Scarves",
        "description": "Lightweight breathable cotton face and neck cover scarves for dust and UV protection.",
        "category": "Lifestyle",
        "price": 349.0,
        "originalPrice": 799.0,
        "rating": 4.4,
        "reviewCount": 460,
        "productUrl": "https://www.amazon.in/dp/B09P446B53?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/81+guVWHIJL._SL1500_.jpg"
    },
    {
        "asin": "B0FXRD8TC2",
        "title": "KE Breathable Multicolour Hair Scrunchies Pack",
        "description": "Soft satin elastic hair scrunchies pack for damage-free hair styling and daily wear.",
        "category": "Lifestyle",
        "price": 299.0,
        "originalPrice": 699.0,
        "rating": 4.7,
        "reviewCount": 780,
        "productUrl": "https://www.amazon.in/dp/B0FXRD8TC2?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/51pmD0gFGoL._SL1080_.jpg"
    },
    {
        "asin": "B0DRVSSYZC",
        "title": "KE EXPORTS Multi-Neck Option Round Shape Stole Scarf",
        "description": "Versatile multi-way wearable neck stole scarf crafted for ethnic and western fusion outfits.",
        "category": "Lifestyle",
        "price": 449.0,
        "originalPrice": 999.0,
        "rating": 4.5,
        "reviewCount": 230,
        "productUrl": "https://www.amazon.in/dp/B0DRVSSYZC?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61ROh33PBuL._SL1080_.jpg"
    },
    {
        "asin": "B0BZTY4FB5",
        "title": "Suzvan Traditional South Pattu Pavadai Frock for Kids",
        "description": "Authentic South Indian Kanjeevaram jacquard silk Pavadai frock set for grand festivals.",
        "category": "Lifestyle",
        "price": 849.0,
        "originalPrice": 1999.0,
        "rating": 4.6,
        "reviewCount": 390,
        "productUrl": "https://www.amazon.in/dp/B0BZTY4FB5?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61YwpwVzRSL._SL1500_.jpg"
    },
    {
        "asin": "B0DSJJL5RD",
        "title": "Suzvan Traditional Pavadai Jacquard Lehenga Choli",
        "description": "Rich golden zari border Pavadai lehenga choli set designed for traditional ceremonies.",
        "category": "Lifestyle",
        "price": 899.0,
        "originalPrice": 2299.0,
        "rating": 4.7,
        "reviewCount": 310,
        "productUrl": "https://www.amazon.in/dp/B0DSJJL5RD?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61hx-ExBRhL._SL1500_.jpg"
    },
    {
        "asin": "B0DR2CXY7C",
        "title": "Jwalin Off-White Embroidered Anarkali Kurta Set",
        "description": "Elegant flared Anarkali kurta set with matching pants and embroidered dupatta.",
        "category": "Lifestyle",
        "price": 1199.0,
        "originalPrice": 2999.0,
        "rating": 4.6,
        "reviewCount": 540,
        "productUrl": "https://www.amazon.in/dp/B0DR2CXY7C?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61b4TcFcV2L._SL1500_.jpg"
    },
    {
        "asin": "B0D7MJJJD7",
        "title": "Suzvan Indian Traditional Jacquard Pavadai Set",
        "description": "Royal festive South Indian Pattu Pavadai ethnic dress for girls with intricate zari work.",
        "category": "Lifestyle",
        "price": 849.0,
        "originalPrice": 2099.0,
        "rating": 4.5,
        "reviewCount": 270,
        "productUrl": "https://www.amazon.in/dp/B0D7MJJJD7?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61YwpwVzRSL._SL1500_.jpg"
    },
    {
        "asin": "B0DY57KYRH",
        "title": "Suzvan Traditional Jacquard Lehenga Choli for Festival",
        "description": "Traditional South Indian kids ethnic lehenga choli with soft inner lining for total comfort.",
        "category": "Lifestyle",
        "price": 899.0,
        "originalPrice": 2199.0,
        "rating": 4.6,
        "reviewCount": 190,
        "productUrl": "https://www.amazon.in/dp/B0DY57KYRH?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61hx-ExBRhL._SL1500_.jpg"
    },
    {
        "asin": "B0CB3VNBT2",
        "title": "Amayra Women's Embroidered Kurta with Dupatta Set",
        "description": "Premium cotton straight fit embroidered kurta set with matching organza dupatta.",
        "category": "Lifestyle",
        "price": 999.0,
        "originalPrice": 2499.0,
        "rating": 4.5,
        "reviewCount": 680,
        "productUrl": "https://www.amazon.in/dp/B0CB3VNBT2?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61XmD6mBjCL._SL1254_.jpg"
    },
    {
        "asin": "B0GH2C7RMQ",
        "title": "Tant Vastra Minakari Jamdani Cotton Saree",
        "description": "Handcrafted Minakari Jamdani soft cotton saree with unstitched blouse piece for traditional elegance.",
        "category": "Lifestyle",
        "price": 1299.0,
        "originalPrice": 3299.0,
        "rating": 4.7,
        "reviewCount": 410,
        "productUrl": "https://www.amazon.in/dp/B0GH2C7RMQ?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61IOb4Nu6AL._SL1080_.jpg"
    },
    {
        "asin": "B0G7GGYHKX",
        "title": "Amazon Brand Anarva Floral Printed Georgette Saree",
        "description": "Lightweight printed georgette saree featuring vibrant floral designs and matching blouse piece.",
        "category": "Lifestyle",
        "price": 799.0,
        "originalPrice": 1999.0,
        "rating": 4.5,
        "reviewCount": 360,
        "productUrl": "https://www.amazon.in/dp/B0G7GGYHKX?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/71KmY1pyATL._SL1500_.jpg"
    },
    {
        "asin": "B0DGD9SP8S",
        "title": "KE EXPORTS Stylish Silky-Feel Multicolor Stole",
        "description": "Ultra-soft satin silk touch stole scarf for party wear and elegant neck styling.",
        "category": "Lifestyle",
        "price": 399.0,
        "originalPrice": 899.0,
        "rating": 4.6,
        "reviewCount": 290,
        "productUrl": "https://www.amazon.in/dp/B0DGD9SP8S?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61ROh33PBuL._SL1080_.jpg"
    },
    {
        "asin": "B0CMTLZ5N3",
        "title": "Amazon Brand Stretchable Readymade Cotton Dobby Blouse",
        "description": "Comfortable stretchable cotton dobby readymade saree blouse with elbow sleeves.",
        "category": "Lifestyle",
        "price": 499.0,
        "originalPrice": 1199.0,
        "rating": 4.4,
        "reviewCount": 630,
        "productUrl": "https://www.amazon.in/dp/B0CMTLZ5N3?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/6166RQH8dIL._SL1500_.jpg"
    },
    {
        "asin": "B08K391DL3",
        "title": "Swara Creations Traditional Velvet Bangles Set for Women",
        "description": "Bridal ethnic velvet bangles set handcrafted with intricate stone work for wedding wear.",
        "category": "Lifestyle",
        "price": 449.0,
        "originalPrice": 999.0,
        "rating": 4.6,
        "reviewCount": 820,
        "productUrl": "https://www.amazon.in/dp/B08K391DL3?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/815HZT0n4TL._SL1500_.jpg"
    },
    {
        "asin": "B0BSS245SY",
        "title": "KE KanhaExports Japanese Kimono Scarf & Shrug",
        "description": "Trendy floral printed open-front Japanese Kimono shrug scarf for holiday and beach wear.",
        "category": "Lifestyle",
        "price": 499.0,
        "originalPrice": 1199.0,
        "rating": 4.5,
        "reviewCount": 240,
        "productUrl": "https://www.amazon.in/dp/B0BSS245SY?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/712OsBIXynL._SL1500_.jpg"
    },
    {
        "asin": "B0F2MVC3LW",
        "title": "Amazon Brand Anarva Uppada Silk Purple Saree",
        "description": "Rich Uppada Jacquard woven silk saree with rich zari pallu and blouse piece for festivals.",
        "category": "Lifestyle",
        "price": 1499.0,
        "originalPrice": 3999.0,
        "rating": 4.7,
        "reviewCount": 470,
        "productUrl": "https://www.amazon.in/dp/B0F2MVC3LW?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61IOb4Nu6AL._SL1080_.jpg"
    },
    {
        "asin": "B0GY5J8YM5",
        "title": "Amazon Brand Anarva Traditional Art Silk Saree",
        "description": "Elegant Jacquard art silk saree with zari weave motif and contrasting blouse piece.",
        "category": "Lifestyle",
        "price": 1199.0,
        "originalPrice": 2999.0,
        "rating": 4.6,
        "reviewCount": 310,
        "productUrl": "https://www.amazon.in/dp/B0GY5J8YM5?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/71KmY1pyATL._SL1500_.jpg"
    }
]

SEEN_ASINS_PATH = "scratch/seen_asins.json"
def load_seen():
    if os.path.exists(SEEN_ASINS_PATH):
        with open(SEEN_ASINS_PATH, 'r') as f:
            return set(json.load(f))
    return set()

def save_seen(seen):
    with open(SEEN_ASINS_PATH, 'w') as f:
        json.dump(sorted(seen), f, indent=2)

seen_asins = load_seen()
new_items = []

for item in items:
    asin = item['asin']
    if asin not in seen_asins:
        new_items.append(item)
        seen_asins.add(asin)

print(f"Total new products to seed: {len(new_items)} (out of {len(items)})")

if not new_items:
    print("All products are already seeded!")
    exit()

cs_file = r'c:\WorldNewz\WorldNewzWebAPI\Services\AmazonProductService.cs'
with open(cs_file, 'r', encoding='utf-8') as f:
    cs_content = f.read()

# Generate C# seed blocks
cs_blocks = []
for p in new_items:
    block = f"""            new AmazonProduct
            {{
                Asin = "{p['asin']}",
                Title = "{p['title']}",
                Description = "{p['description']}",
                Price = {p['price']}m,
                OriginalPrice = {p['originalPrice']}m,
                Rating = {p['rating']},
                ReviewCount = {p['reviewCount']},
                Category = "{p['category']}",
                ProductUrl = "{p['productUrl']}",
                ImageUrl = "{p['imageUrl']}",
                IsActive = true,
                DateAdded = DateTime.UtcNow
            }},"""
    cs_blocks.append(block)

new_cs_code = "\n".join(cs_blocks)

# Insert before closing }; of seedData list in AmazonProductService.cs
target_pos = cs_content.rfind("        };")
if target_pos != -1:
    updated_cs_content = cs_content[:target_pos] + new_cs_code + "\n" + cs_content[target_pos:]
    with open(cs_file, 'w', encoding='utf-8') as f:
        f.write(updated_cs_content)
    print(f"Successfully seeded {len(new_items)} new products into {cs_file}!")
    save_seen(seen_asins)
else:
    print("Could not find insertion position in AmazonProductService.cs")
