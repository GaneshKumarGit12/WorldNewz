import urllib.request
import re
import json
import os
import time
import random
import html as html_parser

urls = [
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

SEEN_ASINS_PATH = "scratch/seen_asins.json"
TAG = "ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"

def load_seen_asins():
    if os.path.exists(SEEN_ASINS_PATH):
        with open(SEEN_ASINS_PATH, "r") as f:
            return set(json.load(f))
    return set()

def save_seen_asins(seen):
    with open(SEEN_ASINS_PATH, "w") as f:
        json.dump(sorted(seen), f, indent=2)

headers_list = [
    {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9'},
    {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15', 'Accept-Language': 'en-US,en;q=0.9'}
]

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Stop redirect and capture the target URL
        return None

def resolve_url(short_url):
    req = urllib.request.Request(short_url, headers=random.choice(headers_list))
    opener = urllib.request.build_opener(NoRedirectHandler())
    try:
        resp = opener.open(req)
        return resp.url
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303, 307, 308):
            redirect_url = e.headers.get('Location')
            return redirect_url
        return None
    except Exception as e:
        print(f"Error resolving {short_url}: {e}")
        return None

def extract_asin(target_url):
    if not target_url:
        return None
    # Look for /dp/ASIN or /gp/product/ASIN or /ASIN
    match = re.search(r'/(?:dp|gp/product|ASIN)/([A-Z0-9]{10})', target_url, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    match = re.search(r'[?&]asin=([A-Z0-9]{10})', target_url, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    return None

resolved_results = []
seen_asins = load_seen_asins()

print(f"Starting resolution for {len(urls)} Amazon affiliate short links...\n")

for idx, url in enumerate(urls, 1):
    time.sleep(random.uniform(0.3, 0.8))
    target = resolve_url(url)
    asin = extract_asin(target)
    
    if not asin:
        # Try full redirect chain without NoRedirectHandler
        try:
            req = urllib.request.Request(url, headers=random.choice(headers_list))
            with urllib.request.urlopen(req) as resp:
                target = resp.url
                asin = extract_asin(target)
        except Exception:
            pass
            
    print(f"[{idx}/{len(urls)}] {url} -> ASIN: {asin} (Resolved: {target[:70] if target else 'Failed'})")
    
    if asin:
        resolved_results.append({
            'shortUrl': url,
            'resolvedUrl': target,
            'asin': asin
        })

print(f"\nSuccessfully resolved {len(resolved_results)} out of {len(urls)} links.")
