import urllib.request
import ssl
import re

url = "https://link.amazon/B01Rr7hQD"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
        final_url = resp.geturl()
        print(f"Final URL: {final_url}")
        content = resp.read().decode('utf-8', errors='ignore')
        print(f"Content length: {len(content)}")
        m = re.search(r'/(?:dp|gp/product|ASIN)/([A-Z0-9]{10})', final_url, re.IGNORECASE)
        if m:
            print(f"Extracted ASIN: {m.group(1)}")
        else:
            print("No ASIN in URL")
except Exception as e:
    print(f"Error: {e}")
