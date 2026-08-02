import urllib.request
import re
import json
import time
import random
import os
import html as html_parser

urls = [
    "https://link.amazon/B0ciCa5II",
    "https://link.amazon/B0eomIiia",
    "https://link.amazon/B0gITC2Q0",
    "https://link.amazon/B0br3xSbP",
    "https://link.amazon/B0fSjSazi",
    "https://link.amazon/B0aTOPhp2",
    "https://link.amazon/B03vGxa0P",
    "https://link.amazon/B04AhWYic",
    "https://link.amazon/B08vFEh4E",
    "https://link.amazon/B0hEiZxoa",
    "https://link.amazon/B00GvYgaz",
    "https://link.amazon/B0irB9pyF",
    "https://link.amazon/B0ajXTsuc",
    "https://link.amazon/B06x92KB1",
    "https://link.amazon/B09GVdOOU",
    "https://link.amazon/B0gllCIix",
    "https://link.amazon/B00rHCIiR",
    "https://link.amazon/B0gP71Ija",
    "https://link.amazon/B0a4UfDa1",
    "https://link.amazon/B05wVR9sl",
    "https://link.amazon/B060re8FL",
    "https://link.amazon/B01tiGvWg",
    "https://link.amazon/B04X1dG2O",
    "https://link.amazon/B0inJ6wrA",
    "https://link.amazon/B08ypxEJV",
    "https://link.amazon/B09JIH8qx",
    "https://link.amazon/B09Jnbm1r",
    "https://link.amazon/B0cJmRc5n",
    "https://link.amazon/B0hOpAT8N",
    "https://link.amazon/B0aYM3mHO",
    "https://link.amazon/B00uq6Cw1",
    "https://link.amazon/B0ijfiT1E",
    "https://link.amazon/B0bulmWvS",
    "https://link.amazon/B0htxY90B",
    "https://link.amazon/B0hbt9ixP",
    "https://link.amazon/B02hF4o77",
    "https://link.amazon/B02RlIDJc",
    "https://link.amazon/B03a4rcy3",
    "https://link.amazon/B0dzvLZIn",
    "https://link.amazon/B01eV8Xai",
    "https://link.amazon/B0fNB2Ofu",
    "https://link.amazon/B02TNuyBG",
    "https://link.amazon/B0iKcxvfb",
    "https://link.amazon/B0civpDsF",
    "https://link.amazon/B0aonAqN4",
    "https://link.amazon/B07TbNtLL",
    "https://link.amazon/B0iEsgrk6",
    "https://link.amazon/B00RO5aTe"
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
            
    # Try to extract ASIN
    asin_match = re.search(r'/(?:dp|gp/product|ASIN)/([A-Z0-9]{10})', dest, re.IGNORECASE)
    if not asin_match:
        asin_match = re.search(r'[?&]asin=([A-Z0-9]{10})', dest, re.IGNORECASE)
    if not asin_match:
        # Check if short URL ends with an ASIN-like 10-char string
        m2 = re.search(r'/([A-Z0-9]{10})(?:\?|$)', short_url, re.IGNORECASE)
        if m2:
            asin = m2.group(1).upper()
        else:
            asin = "UNKNOWN"
    else:
        asin = asin_match.group(1).upper()

    return dest, asin

resolved_batch = []

print(f"Starting resolution of {len(urls)} Amazon links...\n")
for idx, link in enumerate(urls, 1):
    time.sleep(random.uniform(0.3, 0.8))
    visited, asin = resolve_url(link)
    print(f"[{idx}/{len(urls)}] Link: {link} -> Visited: {visited[:60]}... -> ASIN: {asin}")
    resolved_batch.append({
        "shortUrl": link,
        "visitedUrl": visited,
        "asin": asin
    })

with open("scratch/resolved_48_links.json", "w") as f:
    json.dump(resolved_batch, f, indent=2)

print("\nFinished resolving 48 links.")
