import json
import re
import os

with open("scratch/scraped_48_products.json", "r") as f:
    products = json.load(f)

SEEN_ASINS_PATH = "scratch/seen_asins.json"
seen_asins = set()
if os.path.exists(SEEN_ASINS_PATH):
    with open(SEEN_ASINS_PATH, "r") as f:
        seen_asins = set(json.load(f))

cs_file = r'c:\WorldNewz\WorldNewzWebAPI\Services\AmazonProductService.cs'
with open(cs_file, 'r', encoding='utf-8') as f:
    content = f.read()

new_csharp_blocks = []
added_count = 0

for p in products:
    asin = p['asin']
    if asin in seen_asins:
        print(f"Skipping duplicate ASIN: {asin}")
        continue
        
    seen_asins.add(asin)
    added_count += 1
    
    # Escape quotes in title & description
    title = p['title'].replace('"', '\\"').replace('\n', ' ')
    desc = p['description'].replace('"', '\\"').replace('\n', ' ')
    
    block = f"""            new AmazonProduct
            {{
                Asin = "{asin}",
                Title = "{title}",
                Description = "{desc}",
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
    new_csharp_blocks.append(block)

if new_csharp_blocks:
    # Insert new blocks before closing }; of seedData list
    pos = content.rfind("        };")
    if pos != -1:
        inserted_code = "\n".join(new_csharp_blocks) + "\n"
        content = content[:pos] + inserted_code + content[pos:]
        
        with open(cs_file, 'w', encoding='utf-8') as f:
            f.write(content)
            
        with open(SEEN_ASINS_PATH, 'w') as f:
            json.dump(sorted(list(seen_asins)), f, indent=2)
            
        print(f"Successfully seeded {added_count} new products into {cs_file}!")
    else:
        print("Error: Could not find closing '};' of seedData list in AmazonProductService.cs")
else:
    print("No new products to add.")
