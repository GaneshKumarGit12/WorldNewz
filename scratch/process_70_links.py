import urllib.request
import re
import json
import random
import time

urls = [
    "https://link.amazon/B09s7PX8b",
    "https://link.amazon/B01jtHFTi",
    "https://link.amazon/B027eKlQ5",
    "https://link.amazon/B08mWblIy",
    "https://link.amazon/B0dd2CbEp",
    "https://link.amazon/B0cIbwTUU",
    "https://link.amazon/B0h25LxIq",
    "https://link.amazon/B0hb4uJMq",
    "https://link.amazon/B0ajDm0Oc",
    "https://link.amazon/B0hHiwfCo",
    "https://link.amazon/B03zID0gr",
    "https://link.amazon/B04lOGXRW",
    "https://link.amazon/B04iAyXcz",
    "https://link.amazon/B089d43Ni",
    "https://link.amazon/B01a9Pfyd",
    "https://link.amazon/B04gkYZOQ",
    "https://link.amazon/B0amLS9yj",
    "https://link.amazon/B0iNbNP19",
    "https://link.amazon/B02F7JJo9",
    "https://link.amazon/B082TbhUL",
    "https://link.amazon/B09b3AWhM",
    "https://link.amazon/B04O79NN9",
    "https://link.amazon/B0h9Pb2Jq",
    "https://link.amazon/B03dnavyP",
    "https://link.amazon/B03l2rXo4",
    "https://link.amazon/B05wQpXiW",
    "https://link.amazon/B04XWGoh2",
    "https://link.amazon/B0j2MOqJU",
    "https://link.amazon/B0aamuOIB",
    "https://link.amazon/B04tOLl0H",
    "https://link.amazon/B05jw8IrZ",
    "https://link.amazon/B019WTHuK",
    "https://link.amazon/B00GYkOqD",
    "https://link.amazon/B09Jugzpe",
    "https://link.amazon/B0ddD0jpy",
    "https://link.amazon/B0aeWnsS4",
    "https://link.amazon/B0a459vFV",
    "https://link.amazon/B0cYn1mNq",
    "https://link.amazon/B0b3S26M5",
    "https://link.amazon/B0iGFDTxV",
    "https://link.amazon/B04yKm66c",
    "https://link.amazon/B0eyohBRu",
    "https://link.amazon/B0gKyenUc",
    "https://link.amazon/B03yPd1QH",
    "https://link.amazon/B0adXaFak",
    "https://link.amazon/B018aQ2qO",
    "https://link.amazon/B0avO7OxC",
    "https://link.amazon/B08ZEdFBV",
    "https://link.amazon/B0gSXBvHs",
    "https://link.amazon/B0eUMuGi2",
    "https://link.amazon/B0d4azL9e",
    "https://link.amazon/B00snBqxO",
    "https://link.amazon/B07dbg0vB",
    "https://link.amazon/B06mRTLCs",
    "https://link.amazon/B0eANc81j",
    "https://link.amazon/B02Eo48c6",
    "https://link.amazon/B07dgjQKd",
    "https://link.amazon/B0ief2Qp4",
    "https://link.amazon/B02SJJ2cB",
    "https://link.amazon/B0eGKQQSL",
    "https://link.amazon/B0iPwILwG",
    "https://link.amazon/B086dmg06",
    "https://link.amazon/B0ie9M7TZ",
    "https://link.amazon/B04UQEDyl",
    "https://link.amazon/B04SpvxPe",
    "https://link.amazon/B06AWpF5c",
    "https://link.amazon/B06KsKYZI",
    "https://link.amazon/B0iZ9vl4q",
    "https://link.amazon/B09wVTbhm",
    "https://link.amazon/B03hA58zo"
]

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirectHandler)

headers_list = [
    {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'},
    {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15'}
]

def resolve_url(short_url):
    curr = short_url
    dest = short_url
    for _ in range(5):
        try:
            req = urllib.request.Request(curr, headers=random.choice(headers_list))
            res = opener.open(req, timeout=8)
            break
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 303, 307, 308) and 'Location' in e.headers:
                curr = e.headers['Location']
                dest = curr
            else:
                break
        except Exception:
            break
            
    asin_match = re.search(r'/(?:dp|gp/product|ASIN)/([A-Z0-9]{10})', dest, re.IGNORECASE)
    if not asin_match:
        asin_match = re.search(r'[?&]asin=([A-Z0-9]{10})', dest, re.IGNORECASE)
    if not asin_match:
        m2 = re.search(r'/([A-Z0-9]{10})(?:\?|$)', short_url, re.IGNORECASE)
        asin = m2.group(1).upper() if m2 else "UNKNOWN"
    else:
        asin = asin_match.group(1).upper()

    return dest, asin

resolved_batch = []

print(f"Starting resolution of {len(urls)} Amazon links...\n")
for idx, link in enumerate(urls, 1):
    time.sleep(random.uniform(0.25, 0.6))
    visited, asin = resolve_url(link)
    print(f"[{idx}/{len(urls)}] Link: {link} -> Visited: {visited[:60]}... -> ASIN: {asin}")
    resolved_batch.append({
        "shortUrl": link,
        "visitedUrl": visited,
        "asin": asin
    })

with open("scratch/resolved_70_links.json", "w") as f:
    json.dump(resolved_batch, f, indent=2)

print("\nFinished resolving 70 links.")
