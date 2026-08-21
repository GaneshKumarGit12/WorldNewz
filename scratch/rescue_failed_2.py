import urllib.request
import re
import html as html_parser
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

urls = [
    ("https://link.amazon/B0gkom1d1", "B09H5SYGL5"),
    ("https://link.amazon/B0dE9ofTD", "B0DQV8T2JZ")
]

class TraceRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        print(f"Hop -> Code: {code}, Location: {newurl}")
        return urllib.request.Request(newurl, headers=req.headers)

opener = urllib.request.build_opener(TraceRedirects)
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')]

for short_url, asin in urls:
    print(f"\n--- Checking {short_url} (ASIN: {asin}) ---")
    try:
        with opener.open(short_url, timeout=12) as resp:
            final_url = resp.geturl()
            print(f"Final URL: {final_url}")
            html = resp.read().decode('utf-8', errors='ignore')
            title_m = re.search(r'<title>(.*?)</title>', html, re.I)
            if title_m:
                print(f"Title: {title_m.group(1)}")
            img_m = re.search(r'https://m\.media-amazon\.com/images/I/[A-Za-z0-9%_\-\+\.]+\.(?:jpg|png)', html)
            if img_m:
                print(f"Image: {img_m.group(0)}")
            price_m = re.search(r'<span class="a-price-whole">\s*([\d,]+)', html)
            if price_m:
                print(f"Price: {price_m.group(1)}")
    except Exception as e:
        print(f"Error: {e}")
