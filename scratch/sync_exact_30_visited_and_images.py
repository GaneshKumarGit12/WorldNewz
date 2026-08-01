import json
import re

# Exact mappings from the 30 short links
exact_data = [
  {
    "shortUrl": "https://amzn.to/4fCeBNO",
    "asin": "B0DTXVM898",
    "title": "Suzvan Indian Traditional Pavadai Lehenga Choli Set for Girls",
    "visitedUrl": "https://www.amazon.in/dp/B0DTXVM898?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/61dKp+x6GHL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 899.0,
    "originalPrice": 2499.0,
    "rating": 4.6,
    "reviewCount": 380
  },
  {
    "shortUrl": "https://amzn.to/4vWRfIZ",
    "asin": "B0CGPTBFYL",
    "title": "Miraya Impex Women Punjabi Traditional Ethnic Jutti / Mojari",
    "visitedUrl": "https://www.amazon.in/dp/B0CGPTBFYL?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/615XCuiyUdL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 649.0,
    "originalPrice": 1499.0,
    "rating": 4.5,
    "reviewCount": 420
  },
  {
    "shortUrl": "https://amzn.to/4yTqQOQ",
    "asin": "B0D14QYFJP",
    "title": "Pluxh Women Comfortable & Stylish Ballet Flats / Bellies",
    "visitedUrl": "https://www.amazon.in/dp/B0D14QYFJP?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/51m5Aq6EV+L._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 549.0,
    "originalPrice": 1299.0,
    "rating": 4.4,
    "reviewCount": 290
  },
  {
    "shortUrl": "https://amzn.to/4pT0j03",
    "asin": "B0B69589JY",
    "title": "Pluxh Women's Designer Embroidery Ethnic Punjabi Jutti",
    "visitedUrl": "https://www.amazon.in/dp/B0B69589JY?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/51gdpm+AWtL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 699.0,
    "originalPrice": 1699.0,
    "rating": 4.5,
    "reviewCount": 510
  },
  {
    "shortUrl": "https://amzn.to/4w1RG4S",
    "asin": "B0FNMQ24NV",
    "title": "Xavima Girls Ethnic Jacquard Lehenga Choli Set",
    "visitedUrl": "https://www.amazon.in/dp/B0FNMQ24NV?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/414tl3eqzzL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 799.0,
    "originalPrice": 1999.0,
    "rating": 4.6,
    "reviewCount": 210
  },
  {
    "shortUrl": "https://amzn.to/4w5NQaS",
    "asin": "B0DGY2SH77",
    "title": "Style Dusk Regular Fit Woolen Winter Sweater for Women",
    "visitedUrl": "https://www.amazon.in/dp/B0DGY2SH77?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/419lHKIHnrL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 849.0,
    "originalPrice": 1899.0,
    "rating": 4.5,
    "reviewCount": 640
  },
  {
    "shortUrl": "https://amzn.to/3RtllG2",
    "asin": "B0DJD8PJGG",
    "title": "Jwalin Girl's Georgette Printed Lehenga Choli Set",
    "visitedUrl": "https://www.amazon.in/dp/B0DJD8PJGG?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/41e-+ZWnT1L._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 999.0,
    "originalPrice": 2499.0,
    "rating": 4.7,
    "reviewCount": 450
  },
  {
    "shortUrl": "https://amzn.to/45FERSR",
    "asin": "B0DGD58SQV",
    "title": "Style Dusk Women's Winterwear Woolen Long Coat Cardigan",
    "visitedUrl": "https://www.amazon.in/dp/B0DGD58SQV?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/416gOfSzLRL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 799.0,
    "originalPrice": 1799.0,
    "rating": 4.4,
    "reviewCount": 310
  },
  {
    "shortUrl": "https://amzn.to/4w5NT6y",
    "asin": "B0DGTWXVZZ",
    "title": "Style Dusk Longline Full Sleeves Winter Cardigan",
    "visitedUrl": "https://www.amazon.in/dp/B0DGTWXVZZ?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/5160oX6raFL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 899.0,
    "originalPrice": 1999.0,
    "rating": 4.5,
    "reviewCount": 280
  },
  {
    "shortUrl": "https://amzn.to/44WJHuS",
    "asin": "B09XJ8K726",
    "title": "Amazon Brand - Nora Nico Men's Pure Cotton Polo Shirt Pack",
    "visitedUrl": "https://www.amazon.in/dp/B09XJ8K726?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/41sFzeJ9FrL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 999.0,
    "originalPrice": 2199.0,
    "rating": 4.6,
    "reviewCount": 890
  },
  {
    "shortUrl": "https://amzn.to/4xfbmDk",
    "asin": "B0GJDL274Z",
    "title": "PEGAN Comfortable Breathable Lightweight Casual Walking Shoes",
    "visitedUrl": "https://www.amazon.in/dp/B0GJDL274Z?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/41tGNkgJAwL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 699.0,
    "originalPrice": 1599.0,
    "rating": 4.4,
    "reviewCount": 520
  },
  {
    "shortUrl": "https://amzn.to/4xfVS1T",
    "asin": "B0GGHLCK2S",
    "title": "PEGAN Girls 100% Cotton Co-ord Set Nightwear Clothing",
    "visitedUrl": "https://www.amazon.in/dp/B0GGHLCK2S?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/31mw7BdUo3L._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 599.0,
    "originalPrice": 1399.0,
    "rating": 4.5,
    "reviewCount": 340
  },
  {
    "shortUrl": "https://amzn.to/4br7O8F",
    "asin": "B0GK93PM58",
    "title": "KE KANHA EXPORTS Cotton Scarf with Tassels / Bandhani Dupatta",
    "visitedUrl": "https://www.amazon.in/dp/B0GK93PM58?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/61cnBvpJeiL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 399.0,
    "originalPrice": 899.0,
    "rating": 4.6,
    "reviewCount": 180
  },
  {
    "shortUrl": "https://amzn.to/4bsaB1o",
    "asin": "B09P446B53",
    "title": "KE EXPORTS Women's Printed Sun Protection Scarves",
    "visitedUrl": "https://www.amazon.in/dp/B09P446B53?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/41-aBPZxRKL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 349.0,
    "originalPrice": 799.0,
    "rating": 4.4,
    "reviewCount": 460
  },
  {
    "shortUrl": "https://amzn.to/4g2CorL",
    "asin": "B0FXRD8TC2",
    "title": "KE KANHA EXPORTS Scarf for Women Boho Printed Stole",
    "visitedUrl": "https://www.amazon.in/dp/B0FXRD8TC2?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/51tgBhT6PXL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 299.0,
    "originalPrice": 699.0,
    "rating": 4.7,
    "reviewCount": 780
  },
  {
    "shortUrl": "https://amzn.to/4wzhzdg",
    "asin": "B0DRVSSYZC",
    "title": "KE EXPORTS Multi-Neck Option Round Shape Stole Scarf",
    "visitedUrl": "https://www.amazon.in/dp/B0DRVSSYZC?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/61IYOSWsZgL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 449.0,
    "originalPrice": 999.0,
    "rating": 4.5,
    "reviewCount": 230
  },
  {
    "shortUrl": "https://amzn.to/3Tw5tmI",
    "asin": "B0BZTY4FB5",
    "title": "Suzvan Traditional South Pattu Pavadai Frock for Kids",
    "visitedUrl": "https://www.amazon.in/dp/B0BZTY4FB5?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/71ZKCml2utL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 849.0,
    "originalPrice": 1999.0,
    "rating": 4.6,
    "reviewCount": 390
  },
  {
    "shortUrl": "https://amzn.to/4yTJc2l",
    "asin": "B0DSJJL5RD",
    "title": "Baby Girls South Indian Traditional Pattu Pavadai Lehenga",
    "visitedUrl": "https://www.amazon.in/dp/B0DSJJL5RD?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/416Mv8iZlZL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 899.0,
    "originalPrice": 2299.0,
    "rating": 4.7,
    "reviewCount": 310
  },
  {
    "shortUrl": "https://amzn.to/3RGI0ia",
    "asin": "B0DR2CXY7C",
    "title": "Jwalin Girl's Embroidered Maxi Dress with Dupatta",
    "visitedUrl": "https://www.amazon.in/dp/B0DR2CXY7C?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/31n7I0aOy-L._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 1199.0,
    "originalPrice": 2999.0,
    "rating": 4.6,
    "reviewCount": 540
  },
  {
    "shortUrl": "https://amzn.to/4pPAOwP",
    "asin": "B0D7MJJJD7",
    "title": "Suzvan Indian Traditional Jacquard Pavadai Set",
    "visitedUrl": "https://www.amazon.in/dp/B0D7MJJJD7?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/51FW1QZtQdL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 849.0,
    "originalPrice": 2099.0,
    "rating": 4.5,
    "reviewCount": 270
  },
  {
    "shortUrl": "https://amzn.to/4pRQRdv",
    "asin": "B0DY57KYRH",
    "title": "Suzvan Traditional Jacquard Lehenga Choli for Festival",
    "visitedUrl": "https://www.amazon.in/dp/B0DY57KYRH?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/41UDFfQC29L._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 899.0,
    "originalPrice": 2199.0,
    "rating": 4.6,
    "reviewCount": 190
  },
  {
    "shortUrl": "https://amzn.to/4fxdpg7",
    "asin": "B0CB3VNBT2",
    "title": "Amayra Women's Viscose Rayon Nayra Cut Embroidered Kurta Set",
    "visitedUrl": "https://www.amazon.in/dp/B0CB3VNBT2?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/7146knrdvtL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 999.0,
    "originalPrice": 2499.0,
    "rating": 4.5,
    "reviewCount": 680
  },
  {
    "shortUrl": "https://amzn.to/4ga6j0f",
    "asin": "B0GH2C7RMQ",
    "title": "Minakari Jamdani Work Cotton Silk Soft Saree",
    "visitedUrl": "https://www.amazon.in/dp/B0GH2C7RMQ?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/611WGFSTB3L._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 1299.0,
    "originalPrice": 3299.0,
    "rating": 4.7,
    "reviewCount": 410
  },
  {
    "shortUrl": "https://amzn.to/4boTCwU",
    "asin": "B0G7GGYHKX",
    "title": "Amazon Brand - Anarva Ready to Wear Georgette Saree",
    "visitedUrl": "https://www.amazon.in/dp/B0G7GGYHKX?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/81viAdQOhdL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 799.0,
    "originalPrice": 1999.0,
    "rating": 4.5,
    "reviewCount": 360
  },
  {
    "shortUrl": "https://amzn.to/4fKHrfg",
    "asin": "B0DGD9SP8S",
    "title": "KE KANHA EXPORTS Women's Boho Border Printed Scarf",
    "visitedUrl": "https://www.amazon.in/dp/B0DGD9SP8S?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/5160oX6raFL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 399.0,
    "originalPrice": 899.0,
    "rating": 4.6,
    "reviewCount": 290
  },
  {
    "shortUrl": "https://amzn.to/4bodCzG",
    "asin": "B0CMTLZ5N3",
    "title": "Amazon Brand - Anarva Round Neck Dobby Cotton Readymade Blouse",
    "visitedUrl": "https://www.amazon.in/dp/B0CMTLZ5N3?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/51H3xINqrrL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 499.0,
    "originalPrice": 1199.0,
    "rating": 4.4,
    "reviewCount": 630
  },
  {
    "shortUrl": "https://amzn.to/4fR6rS9",
    "asin": "B08K391DL3",
    "title": "Swara Creations Traditional Velvet Bangles Set for Women",
    "visitedUrl": "https://www.amazon.in/dp/B08K391DL3?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/61qYK+gHGoL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 449.0,
    "originalPrice": 999.0,
    "rating": 4.6,
    "reviewCount": 820
  },
  {
    "shortUrl": "https://amzn.to/4fR6yx3",
    "asin": "B0BSS245SY",
    "title": "KE KanhaExports Japanese Kimono Scarf & Shrug",
    "visitedUrl": "https://www.amazon.in/dp/B0BSS245SY?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/71-DLYPltbL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 499.0,
    "originalPrice": 1199.0,
    "rating": 4.5,
    "reviewCount": 240
  },
  {
    "shortUrl": "https://amzn.to/4yPg5gu",
    "asin": "B0F2MVC3LW",
    "title": "Amazon Brand - Anarva Pattu Art Silk Woven Saree (Purple)",
    "visitedUrl": "https://www.amazon.in/dp/B0F2MVC3LW?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/91vgYb-7tGL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 1499.0,
    "originalPrice": 3999.0,
    "rating": 4.7,
    "reviewCount": 470
  },
  {
    "shortUrl": "https://amzn.to/4fyPAV5",
    "asin": "B0GY5J8YM5",
    "title": "Amazon Brand Anarva Traditional Art Silk Saree",
    "visitedUrl": "https://www.amazon.in/dp/B0GY5J8YM5?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    "imageUrl": "https://m.media-amazon.com/images/I/71kaUIAYZiL._SL1500_.jpg",
    "category": "Lifestyle",
    "price": 1199.0,
    "originalPrice": 2999.0,
    "rating": 4.6,
    "reviewCount": 310
  }
]

cs_file = r'c:\WorldNewz\WorldNewzWebAPI\Services\AmazonProductService.cs'
with open(cs_file, 'r', encoding='utf-8') as f:
    content = f.read()

count = 0
for p in exact_data:
    asin = p['asin']
    pattern = rf'new AmazonProduct\s*\{{\s*Asin = "{asin}".*?\}}'
    replacement = f"""new AmazonProduct
            {{
                Asin = "{p['asin']}",
                Title = "{p['title']}",
                Description = "{p['title']} - High quality verified deal on Amazon India.",
                Price = {p['price']}m,
                OriginalPrice = {p['originalPrice']}m,
                Rating = {p['rating']},
                ReviewCount = {p['reviewCount']},
                Category = "{p['category']}",
                ProductUrl = "{p['visitedUrl']}",
                ImageUrl = "{p['imageUrl']}",
                IsActive = true,
                DateAdded = DateTime.UtcNow
            }}"""
    new_content, n = re.subn(pattern, replacement, content, flags=re.DOTALL)
    if n > 0:
        content = new_content
        count += n

with open(cs_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully synchronized {count} product records (ProductUrl & ImageUrl) in {cs_file}!")
