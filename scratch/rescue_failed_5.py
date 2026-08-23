import urllib.request
import re
import html as html_parser
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

failed_urls = [
    ("https://link.amazon/B0h0nOdta", "B0FC1YDXRS"),
    ("https://link.amazon/B01K9BC8j", "B0G5QK4VYP"),
    ("https://link.amazon/B07NdmUrT", "B0HB5C5ZMN"),
    ("https://link.amazon/B008TeQ2j", "B0D8G58Q18"),
    ("https://link.amazon/B03sRbGa5", "B0H25P6QKJ")
]

class TraceRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        print(f"Hop -> Code: {code}, Location: {newurl}")
        return urllib.request.Request(newurl, headers=req.headers)

opener = urllib.request.build_opener(TraceRedirects)
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1')]

for short_url, asin in failed_urls:
    print(f"\n--- Checking {short_url} (ASIN: {asin}) ---")
    try:
        with opener.open(short_url, timeout=12) as resp:
            final_url = resp.geturl()
            print(f"Final URL: {final_url}")
            html = resp.read().decode('utf-8', errors='ignore')
            
            title_m = re.search(r'<title>(.*?)</title>', html, re.I)
            title = title_m.group(1).replace('Amazon.in', '').replace('Buy', '').strip() if title_m else ""
            title = re.sub(r'\s*: Amazon\.in.*$', '', title, flags=re.I).strip()
            print(f"Title: {title}")
            
            img_m = re.search(r'https://m\.media-amazon\.com/images/I/[A-Za-z0-9%_\-\+\.]+\.(?:jpg|png)', html)
            img = img_m.group(0) if img_m else ""
            print(f"Image: {img}")
            
            price_m = re.search(r'<span class="a-price-whole">\s*([\d,]+)', html)
            price = float(price_m.group(1).replace(',', '')) if price_m else 999.0
            print(f"Price: {price}")
    except Exception as e:
        print(f"Error: {e}")
