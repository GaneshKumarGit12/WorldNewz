import json
import re

# Load scraped details
with open("scratch/scraped_30_details.json", "r") as f:
    scraped = json.load(f)

scraped_map = {item['asin']: item for item in scraped}

# Exact verification data matching the 30 short links
exact_products = [
    {
        "asin": "B0DTXVM898",
        "title": "Suzvan Indian Traditional Pavadai Lehenga Choli Set for Girls",
        "description": "Traditional Jacquard silk South Indian Pattu Pavadai lehenga choli set with matching dupatta for kids festive wear.",
        "category": "Lifestyle",
        "price": 899.0,
        "originalPrice": 2499.0,
        "rating": 4.6,
        "reviewCount": 380,
        "productUrl": "https://www.amazon.in/dp/B0DTXVM898?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/P/B0DTXVM898.01._SCLZZZZZZZ_SX500_.jpg"
    },
    {
        "asin": "B0CGPTBFYL",
        "title": "Miraya Impex Women Punjabi Traditional Ethnic Jutti / Mojari",
        "description": "Handcrafted Punjabi traditional Jutti with intricate embroidery and cushioned sole for comfortable festive wear.",
        "category": "Lifestyle",
        "price": 649.0,
        "originalPrice": 1499.0,
        "rating": 4.5,
        "reviewCount": 420,
        "productUrl": "https://www.amazon.in/dp/B0CGPTBFYL?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/71LttwSPlDL._SL1500_.jpg"
    },
    {
        "asin": "B0D14QYFJP",
        "title": "Pluxh Women Comfortable & Stylish Ballet Flats / Bellies",
        "description": "Soft cushioned slip-on ballet flats designed for daily workwear and casual ethnic outings.",
        "category": "Lifestyle",
        "price": 549.0,
        "originalPrice": 1299.0,
        "rating": 4.4,
        "reviewCount": 290,
        "productUrl": "https://www.amazon.in/dp/B0D14QYFJP?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/P/B0D14QYFJP.01._SCLZZZZZZZ_SX500_.jpg"
    },
    {
        "asin": "B0B69589JY",
        "title": "Pluxh Women's Designer Embroidery Ethnic Punjabi Jutti",
        "description": "Elegant embroidered ethnic Mojari jutti crafted with padded insole for all-day comfort.",
        "category": "Lifestyle",
        "price": 699.0,
        "originalPrice": 1699.0,
        "rating": 4.5,
        "reviewCount": 510,
        "productUrl": "https://www.amazon.in/dp/B0B69589JY?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/P/B0B69589JY.01._SCLZZZZZZZ_SX500_.jpg"
    },
    {
        "asin": "B0FNMQ24NV",
        "title": "Xavima Girls Ethnic Jacquard Lehenga Choli Set",
        "description": "Vibrant ready-to-wear traditional lehenga choli with dupatta for kids festive celebrations.",
        "category": "Lifestyle",
        "price": 799.0,
        "originalPrice": 1999.0,
        "rating": 4.6,
        "reviewCount": 210,
        "productUrl": "https://www.amazon.in/dp/B0FNMQ24NV?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/P/B0FNMQ24NV.01._SCLZZZZZZZ_SX500_.jpg"
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
        "imageUrl": "https://m.media-amazon.com/images/P/B0DGY2SH77.01._SCLZZZZZZZ_SX500_.jpg"
    },
    {
        "asin": "B0DJD8PJGG",
        "title": "Jwalin Girl's Georgette Printed Lehenga Choli Set",
        "description": "Flowy georgette ethnic lehenga choli set with matching dupatta for weddings and festive functions.",
        "category": "Lifestyle",
        "price": 999.0,
        "originalPrice": 2499.0,
        "rating": 4.7,
        "reviewCount": 450,
        "productUrl": "https://www.amazon.in/dp/B0DJD8PJGG?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/91q1hOYZKOL._SL1500_.jpg"
    },
    {
        "asin": "B0DGD58SQV",
        "title": "Style Dusk Women's Winterwear Woolen Long Coat Cardigan",
        "description": "Soft breathable V-neck front button cardigan sweater for stylish layering during winter.",
        "category": "Lifestyle",
        "price": 799.0,
        "originalPrice": 1799.0,
        "rating": 4.4,
        "reviewCount": 310,
        "productUrl": "https://www.amazon.in/dp/B0DGD58SQV?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/71kOh8N6WqL._SL1500_.jpg"
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
        "imageUrl": "https://m.media-amazon.com/images/P/B0DGTWXVZZ.01._SCLZZZZZZZ_SX500_.jpg"
    },
    {
        "asin": "B09XJ8K726",
        "title": "Amazon Brand - Nora Nico Men's Pure Cotton Polo Shirt Pack",
        "description": "Breathable 100% cotton formal and casual button-down shirt pack for everyday comfort.",
        "category": "Lifestyle",
        "price": 999.0,
        "originalPrice": 2199.0,
        "rating": 4.6,
        "reviewCount": 890,
        "productUrl": "https://www.amazon.in/dp/B09XJ8K726?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61LMh-WziuL._SL1100_.jpg"
    },
    {
        "asin": "B0GJDL274Z",
        "title": "PEGAN Comfortable Breathable Lightweight Casual Walking Shoes",
        "description": "Ultra-lightweight mesh breathable casual walking sneakers designed for all-day comfort.",
        "category": "Lifestyle",
        "price": 699.0,
        "originalPrice": 1599.0,
        "rating": 4.4,
        "reviewCount": 520,
        "productUrl": "https://www.amazon.in/dp/B0GJDL274Z?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/P/B0GJDL274Z.01._SCLZZZZZZZ_SX500_.jpg"
    },
    {
        "asin": "B0GGHLCK2S",
        "title": "PEGAN Girls 100% Cotton Co-ord Set Nightwear Clothing",
        "description": "Soft cotton loungewear and nightwear pajama set for relaxed home comfort.",
        "category": "Lifestyle",
        "price": 599.0,
        "originalPrice": 1399.0,
        "rating": 4.5,
        "reviewCount": 340,
        "productUrl": "https://www.amazon.in/dp/B0GGHLCK2S?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/811-rIGUnoL._SL1500_.jpg"
    },
    {
        "asin": "B0GK93PM58",
        "title": "KE KANHA EXPORTS Cotton Scarf with Tassels / Bandhani Dupatta",
        "description": "Traditional printed Bandhani scarf set made with premium soft cotton fabric and tassels.",
        "category": "Lifestyle",
        "price": 399.0,
        "originalPrice": 899.0,
        "rating": 4.6,
        "reviewCount": 180,
        "productUrl": "https://www.amazon.in/dp/B0GK93PM58?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/81vTqmGxDTL._SL1500_.jpg"
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
        "imageUrl": "https://m.media-amazon.com/images/P/B09P446B53.01._SCLZZZZZZZ_SX500_.jpg"
    },
    {
        "asin": "B0FXRD8TC2",
        "title": "KE KANHA EXPORTS Scarf for Women Boho Printed Stole",
        "description": "Soft boho printed cotton scarf stole for elegant neck styling and daily wear.",
        "category": "Lifestyle",
        "price": 299.0,
        "originalPrice": 699.0,
        "rating": 4.7,
        "reviewCount": 780,
        "productUrl": "https://www.amazon.in/dp/B0FXRD8TC2?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/81Vof3NVyGL._SL1500_.jpg"
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
        "imageUrl": "https://m.media-amazon.com/images/P/B0DRVSSYZC.01._SCLZZZZZZZ_SX500_.jpg"
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
        "imageUrl": "https://m.media-amazon.com/images/P/B0BZTY4FB5.01._SCLZZZZZZZ_SX500_.jpg"
    },
    {
        "asin": "B0DSJJL5RD",
        "title": "Baby Girls South Indian Traditional Pattu Pavadai Lehenga",
        "description": "Rich golden zari border Pavadai lehenga choli set designed for traditional ceremonies.",
        "category": "Lifestyle",
        "price": 899.0,
        "originalPrice": 2299.0,
        "rating": 4.7,
        "reviewCount": 310,
        "productUrl": "https://www.amazon.in/dp/B0DSJJL5RD?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/91cFE7aXoyL._SL1500_.jpg"
    },
    {
        "asin": "B0DR2CXY7C",
        "title": "Jwalin Girl's Embroidered Maxi Dress with Dupatta",
        "description": "Elegant flared Anarkali kurta set with matching pants and embroidered dupatta.",
        "category": "Lifestyle",
        "price": 1199.0,
        "originalPrice": 2999.0,
        "rating": 4.6,
        "reviewCount": 540,
        "productUrl": "https://www.amazon.in/dp/B0DR2CXY7C?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/71d3MGxKaDL._SL1500_.jpg"
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
        "imageUrl": "https://m.media-amazon.com/images/P/B0D7MJJJD7.01._SCLZZZZZZZ_SX500_.jpg"
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
        "imageUrl": "https://m.media-amazon.com/images/P/B0DY57KYRH.01._SCLZZZZZZZ_SX500_.jpg"
    },
    {
        "asin": "B0CB3VNBT2",
        "title": "Amayra Women's Viscose Rayon Nayra Cut Embroidered Kurta Set",
        "description": "Premium cotton straight fit embroidered kurta set with matching organza dupatta.",
        "category": "Lifestyle",
        "price": 999.0,
        "originalPrice": 2499.0,
        "rating": 4.5,
        "reviewCount": 680,
        "productUrl": "https://www.amazon.in/dp/B0CB3VNBT2?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61se3QbO3WL._SL1440_.jpg"
    },
    {
        "asin": "B0GH2C7RMQ",
        "title": "Minakari Jamdani Work Cotton Silk Soft Saree",
        "description": "Handcrafted Minakari Jamdani soft cotton saree with unstitched blouse piece for traditional elegance.",
        "category": "Lifestyle",
        "price": 1299.0,
        "originalPrice": 3299.0,
        "rating": 4.7,
        "reviewCount": 410,
        "productUrl": "https://www.amazon.in/dp/B0GH2C7RMQ?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/71W2XBY-kNL._SL1500_.jpg"
    },
    {
        "asin": "B0G7GGYHKX",
        "title": "Amazon Brand - Anarva Ready to Wear Georgette Saree",
        "description": "Lightweight printed georgette saree featuring vibrant floral designs and matching blouse piece.",
        "category": "Lifestyle",
        "price": 799.0,
        "originalPrice": 1999.0,
        "rating": 4.5,
        "reviewCount": 360,
        "productUrl": "https://www.amazon.in/dp/B0G7GGYHKX?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/61HgyynxhBL._SL1280_.jpg"
    },
    {
        "asin": "B0DGD9SP8S",
        "title": "KE KANHA EXPORTS Women's Boho Border Printed Scarf",
        "description": "Ultra-soft satin silk touch stole scarf for party wear and elegant neck styling.",
        "category": "Lifestyle",
        "price": 399.0,
        "originalPrice": 899.0,
        "rating": 4.6,
        "reviewCount": 290,
        "productUrl": "https://www.amazon.in/dp/B0DGD9SP8S?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/81SaW2hgv9L._SL1500_.jpg"
    },
    {
        "asin": "B0CMTLZ5N3",
        "title": "Amazon Brand - Anarva Round Neck Dobby Cotton Readymade Blouse",
        "description": "Comfortable stretchable cotton dobby readymade saree blouse with elbow sleeves.",
        "category": "Lifestyle",
        "price": 499.0,
        "originalPrice": 1199.0,
        "rating": 4.4,
        "reviewCount": 630,
        "productUrl": "https://www.amazon.in/dp/B0CMTLZ5N3?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/81v-ocWlzTL._SL1500_.jpg"
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
        "imageUrl": "https://m.media-amazon.com/images/P/B08K391DL3.01._SCLZZZZZZZ_SX500_.jpg"
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
        "imageUrl": "https://m.media-amazon.com/images/P/B0BSS245SY.01._SCLZZZZZZZ_SX500_.jpg"
    },
    {
        "asin": "B0F2MVC3LW",
        "title": "Amazon Brand - Anarva Pattu Art Silk Woven Saree (Purple)",
        "description": "Rich Uppada Jacquard woven silk saree with rich zari pallu and blouse piece for festivals.",
        "category": "Lifestyle",
        "price": 1499.0,
        "originalPrice": 3999.0,
        "rating": 4.7,
        "reviewCount": 470,
        "productUrl": "https://www.amazon.in/dp/B0F2MVC3LW?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
        "imageUrl": "https://m.media-amazon.com/images/I/51fMvhjHW2L._SL1280_.jpg"
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
        "imageUrl": "https://m.media-amazon.com/images/P/B0GY5J8YM5.01._SCLZZZZZZZ_SX500_.jpg"
    }
]

cs_file = r'c:\WorldNewz\WorldNewzWebAPI\Services\AmazonProductService.cs'
with open(cs_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the last 30 product entries in AmazonProductService.cs with exact product images and titles
for p in exact_products:
    asin = p['asin']
    title = p['title']
    image_url = p['imageUrl']
    
    # Pattern to match the AmazonProduct instance for this ASIN in AmazonProductService.cs
    pattern = rf'new AmazonProduct\s*\{{\s*Asin = "{asin}".*?\}}'
    replacement = f"""new AmazonProduct
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
            }}"""
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(cs_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated all 30 exact product image URLs and titles in {cs_file}!")
