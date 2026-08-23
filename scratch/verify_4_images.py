import urllib.request
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

test_imgs = {
    'B0HB5C5ZMN': 'https://m.media-amazon.com/images/I/51OYQt1+CnL._SL1500_.jpg',
    'B0D8G58Q18': 'https://m.media-amazon.com/images/I/71R6r-3i91L._SL1500_.jpg',
    'B0H25P6QKJ': 'https://m.media-amazon.com/images/I/61UXbjAbUJL._SL1500_.jpg',
    'B0FC1YDXRS': 'https://m.media-amazon.com/images/I/71X9DeiwmlL._SL1500_.jpg'
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for asin, url in test_imgs.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"✅ ASIN {asin}: Status {resp.status}, Content-Length: {resp.headers.get('Content-Length')}")
    except Exception as e:
        print(f"❌ ASIN {asin}: Error {e}")
        # Try raw base URL
        raw_url = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\.jpg', '.jpg', url)
        try:
            req = urllib.request.Request(raw_url, headers=headers)
            with urllib.request.urlopen(req, timeout=5) as resp:
                print(f"  ✅ Raw fallback works for {asin}: Status {resp.status}")
        except Exception as e2:
            print(f"  ❌ Raw also failed for {asin}: {e2}")
