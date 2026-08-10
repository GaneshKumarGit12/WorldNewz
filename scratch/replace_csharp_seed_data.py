import json
import re

def main():
    with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
        products = json.load(f)

    print(f"Loaded {len(products)} products from resolved_daily_batch.json")

    with open("WorldNewzWebAPI/Services/AmazonProductService.cs", "r", encoding="utf-8") as f:
        code = f.read()

    updated_count = 0
    tag = "ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"

    for p in products:
        asin = p["asin"]
        title_escaped = p["title"].replace('"', '\\"').replace('\n', ' ').strip()
        desc_escaped = p["description"].replace('"', '\\"').replace('\n', ' ').strip()
        category = p["category"]
        img_url = p["imageUrl"]
        price = p["price"]
        orig_price = p["originalPrice"]
        product_url = f"https://www.amazon.in/dp/{asin}?tag={tag}"

        pattern = rf'new AmazonProduct\s*\{{\s*Asin = "{asin}".*?\}},'
        
        new_block = f"""new AmazonProduct
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

        new_code, count = re.subn(pattern, new_block, code, flags=re.DOTALL)
        if count > 0:
            code = new_code
            updated_count += count

    with open("WorldNewzWebAPI/Services/AmazonProductService.cs", "w", encoding="utf-8") as f:
        f.write(code)

    print(f"Updated {updated_count} product blocks in AmazonProductService.cs!")

if __name__ == "__main__":
    main()
