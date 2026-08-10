import urllib.request
import re
import html as html_parser
import json

asins = ["B0D9MDRRFQ", "B0DX2C5F4G", "B0BRVG7DNG"]

# Manual high-res lookup or alternative page formats
headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1'
}

with open("scratch/resolved_daily_batch.json", "r", encoding="utf-8") as f:
    products = json.load(f)

for p in products:
    if p["asin"] in asins:
        asin = p["asin"]
        url = f"https://www.amazon.in/dp/{asin}"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                title_m = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
                title = title_m.group(1).replace('Amazon.in', '').replace('Buy', '').strip() if title_m else ""
                img_m = re.search(r'https://m\.media-amazon\.com/images/I/[A-Za-z0-9%_\-\+\.]+\.jpg', html)
                img = img_m.group(0) if img_m else ""
                if title:
                    p["title"] = title[:120]
                    p["description"] = f"Get the best deal on {title[:80]}. High quality and top rated on Amazon."
                if img:
                    p["imageUrl"] = img
                print(f"ASIN {asin}: Title='{title[:60]}' | Img='{img}'")
        except Exception as e:
            print(f"Error {asin}: {e}")

with open("scratch/resolved_daily_batch.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print("Saved scratch/resolved_daily_batch.json")
