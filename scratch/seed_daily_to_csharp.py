import json
import os
import re

SEED_JSON_PATH = os.path.join("WorldNewzWebAPI", "Data", "amazon-products-seed.json")
RESOLVED_BATCH_PATH = os.path.join("scratch", "resolved_daily_batch.json")
TAG = "ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"


def main():
    with open(RESOLVED_BATCH_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)

    print(f"Loaded {len(products)} products from {RESOLVED_BATCH_PATH}")

    existing = []
    if os.path.exists(SEED_JSON_PATH):
        with open(SEED_JSON_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)

    existing_asins = {str(p.get("asin", "")).strip().upper() for p in existing}
    existing_images = set()
    existing_titles = set()
    for item in existing:
        img = str(item.get("imageUrl", ""))
        m = re.search(r"/images/I/([A-Za-z0-9\-_%+]+)", img)
        existing_images.add(m.group(1) if m else img)
        existing_titles.add(re.sub(r"[^a-zA-Z0-9]", "", str(item.get("title", "")).lower())[:40])

    added = 0
    for p in products:
        asin = str(p.get("asin", "")).strip().upper()
        if not asin or asin in existing_asins:
            print(f"ASIN {asin} already in JSON seed catalog. Skipping.")
            continue

        price = round(float(p.get("price", 0) or 0), 2)
        if price <= 0:
            print(f"ASIN {asin} missing valid price (Zero Synthetic Pricing). Skipping.")
            continue

        orig_price = round(float(p.get("originalPrice", price) or price), 2)
        if orig_price < price:
            orig_price = price

        img_url = str(p.get("imageUrl", "")).strip()
        m = re.search(r"/images/I/([A-Za-z0-9\-_%+]+)", img_url)
        media_id = m.group(1) if m else img_url
        norm_title = re.sub(r"[^a-zA-Z0-9]", "", str(p.get("title", "")).lower())[:40]
        if (media_id and media_id in existing_images) or (norm_title and norm_title in existing_titles):
            print(f"ASIN {asin} duplicate image or title. Skipping.")
            continue

        existing.append({
            "asin": asin,
            "title": str(p["title"]).replace("\n", " ").strip(),
            "description": str(p["description"]).replace("\n", " ").strip(),
            "imageUrl": img_url,
            "price": price,
            "originalPrice": orig_price,
            "rating": float(p.get("rating", 4.5) or 4.5),
            "reviewCount": int(p.get("reviewCount", 150) or 150),
            "category": str(p.get("category", "Shopping")).strip() or "Shopping",
            "productUrl": f"https://www.amazon.in/dp/{asin}?tag={TAG}",
            "isActive": True,
        })
        existing_asins.add(asin)
        if media_id:
            existing_images.add(media_id)
        if norm_title:
            existing_titles.add(norm_title)
        added += 1

    if added == 0:
        print("No new seed products to add.")
        return

    os.makedirs(os.path.dirname(SEED_JSON_PATH), exist_ok=True)
    with open(SEED_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Successfully appended {added} new products to {SEED_JSON_PATH} (Total: {len(existing)})!")


if __name__ == "__main__":
    main()
