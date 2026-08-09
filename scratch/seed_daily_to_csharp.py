import json
import re

def main():
    with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
        products = json.load(f)

    print(f"Loaded {len(products)} products from resolved_daily_batch.json")

    with open("WorldNewzWebAPI/Services/AmazonProductService.cs", "r", encoding="utf-8") as f:
        csharp_code = f.read()

    # Build C# code string for products
    seed_blocks = []
    tag = "ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"

    for p in products:
        asin = p["asin"]
        # Skip if ASIN is already in C# file
        if f'Asin = "{asin}"' in csharp_code:
            print(f"ASIN {asin} already in C# file. Skipping.")
            continue

        title_escaped = p["title"].replace('"', '\\"').replace('\n', ' ').strip()
        desc_escaped = p["description"].replace('"', '\\"').replace('\n', ' ').strip()
        category = p["category"]
        img_url = p["imageUrl"]
        price = p["price"]
        orig_price = p["originalPrice"]
        product_url = f"https://www.amazon.in/dp/{asin}?tag={tag}"

        block = f"""            new AmazonProduct
            {{
                Asin = "{asin}",
                Title = "{title_escaped}",
                Description = "{desc_escaped}",
                Price = {price:.2f}m,
                OriginalPrice = {orig_price:.2f}m,
                Rating = 4.5,
                ReviewCount = 150,
                Category = "{category}",
                ProductUrl = "{product_url}",
                ImageUrl = "{img_url}",
                IsActive = true,
                DateAdded = DateTime.UtcNow
            }},"""
        seed_blocks.append(block)

    print(f"Generated {len(seed_blocks)} new C# seed blocks.")

    if not seed_blocks:
        print("No new seed blocks to add.")
        return

    new_blocks_str = "\n".join(seed_blocks)

    # Insert right before line `        };` in seedData list (near line 8949)
    target = "            },\n        };"
    replacement = f"            }},\n{new_blocks_str}\n        }};"

    if target in csharp_code:
        updated_code = csharp_code.replace(target, replacement, 1)
        with open("WorldNewzWebAPI/Services/AmazonProductService.cs", "w", encoding="utf-8") as f:
            f.write(updated_code)
        print("Successfully updated AmazonProductService.cs with new seed products!")
    else:
        # Fallback target matching
        target_alt = "        };"
        pos = csharp_code.rfind(target_alt, 0, csharp_code.rfind("bool changed = false;"))
        if pos != -1:
            updated_code = csharp_code[:pos] + new_blocks_str + "\n" + csharp_code[pos:]
            with open("WorldNewzWebAPI/Services/AmazonProductService.cs", "w", encoding="utf-8") as f:
                f.write(updated_code)
            print("Successfully updated AmazonProductService.cs via fallback target match!")
        else:
            print("❌ Could not locate insertion point in AmazonProductService.cs")

if __name__ == "__main__":
    main()
