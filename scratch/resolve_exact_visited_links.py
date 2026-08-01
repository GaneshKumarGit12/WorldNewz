import urllib.request
import re
import json
import time

short_links = [
    "https://amzn.to/4fCeBNO",
    "https://amzn.to/4vWRfIZ",
    "https://amzn.to/4yTqQOQ",
    "https://amzn.to/4pT0j03",
    "https://amzn.to/4w1RG4S",
    "https://amzn.to/4w5NQaS",
    "https://amzn.to/3RtllG2",
    "https://amzn.to/45FERSR",
    "https://amzn.to/4w5NT6y",
    "https://amzn.to/44WJHuS",
    "https://amzn.to/4xfbmDk",
    "https://amzn.to/4xfVS1T",
    "https://amzn.to/4br7O8F",
    "https://amzn.to/4bsaB1o",
    "https://amzn.to/4g2CorL",
    "https://amzn.to/4wzhzdg",
    "https://amzn.to/3Tw5tmI",
    "https://amzn.to/4yTJc2l",
    "https://amzn.to/3RGI0ia",
    "https://amzn.to/4pPAOwP",
    "https://amzn.to/4pRQRdv",
    "https://amzn.to/4fxdpg7",
    "https://amzn.to/4ga6j0f",
    "https://amzn.to/4boTCwU",
    "https://amzn.to/4fKHrfg",
    "https://amzn.to/4bodCzG",
    "https://amzn.to/4fR6rS9",
    "https://amzn.to/4fR6yx3",
    "https://amzn.to/4yPg5gu",
    "https://amzn.to/4fyPAV5"
]

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirectHandler)
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36')]

results = []

for idx, link in enumerate(short_links, 1):
    dest_url = link
    curr = link
    # Follow redirects up to 5 times to get final destination URL
    for step in range(5):
        try:
            req = urllib.request.Request(curr, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            res = opener.open(req, timeout=5)
            break
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 303, 307, 308) and 'Location' in e.headers:
                curr = e.headers['Location']
                dest_url = curr
            else:
                break
        except Exception:
            break
            
    # Extract ASIN from final location
    asin_match = re.search(r'/(?:dp|gp/product|ASIN)/([A-Z0-9]{10})', dest_url, re.IGNORECASE)
    if not asin_match:
        asin_match = re.search(r'[?&]asin=([A-Z0-9]{10})', dest_url, re.IGNORECASE)
        
    asin = asin_match.group(1).upper() if asin_match else "UNKNOWN"
    
    print(f"[{idx}/30] Short: {link} -> Visited Target: {dest_url} -> ASIN: {asin}")
    results.append({
        "shortUrl": link,
        "visitedUrl": dest_url,
        "asin": asin
    })

with open("scratch/visited_30_links.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nDone resolving 30 visited links.")
