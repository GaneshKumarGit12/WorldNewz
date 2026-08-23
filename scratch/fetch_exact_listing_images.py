import urllib.request
import http.cookiejar
import re
import html as html_parser
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

asins = ["B0HB5C5ZMN", "B0D8G58Q18", "B0H25P6QKJ", "B0FC1YDXRS"]

user_agents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
]

results = {}

for asin in asins:
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    opener.addheaders = [
        ('User-Agent', user_agents[0]),
        ('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'),
        ('Accept-Language', 'en-US,en;q=0.9')
    ]
    
    url = f"https://www.amazon.in/dp/{asin}"
    print(f"\n[CookieJar] Fetching {url}...")
    try:
        with opener.open(url, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
            # 1. Look for dynamic image JSON: "main":{"https://m.media-amazon.com/images/I/..."
            main_imgs = re.findall(r'"(https://m\.media-amazon\.com/images/I/[^"]+)"', html)
            
            valid_img = None
            for img in main_imgs:
                if any(x in img for x in ['PKmb-play', 'sprite', 'icon', 'logo', 'G/01', 'G/31']):
                    continue
                if not (img.endswith('.jpg') or img.endswith('.png')):
                    continue
                
                # Test image URL
                cleaned = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\.(jpg|png|jpeg|webp)', r'._SL1500_.\1', img, flags=re.I)
                cleaned = re.sub(r'\._[A-Za-z0-9%_\-\+\.]+\._', r'._', cleaned, flags=re.I)
                
                # Test cleaned
                try:
                    t_req = urllib.request.Request(cleaned, headers={'User-Agent': user_agents[1]})
                    with urllib.request.urlopen(t_req, timeout=5) as t_resp:
                        if t_resp.status == 200:
                            valid_img = cleaned
                            print(f"  ✅ Working Cleaned Image for {asin}: {cleaned}")
                            break
                except:
                    try:
                        t_req = urllib.request.Request(img, headers={'User-Agent': user_agents[1]})
                        with urllib.request.urlopen(t_req, timeout=5) as t_resp:
                            if t_resp.status == 200:
                                valid_img = img
                                print(f"  ✅ Working Original Image for {asin}: {img}")
                                break
                    except:
                        pass
            
            results[asin] = valid_img
            print(f"Result for {asin}: {valid_img}")
    except Exception as e:
        print(f"Error fetching {asin}: {e}")

print("\n--- Final Working Images ---")
for asin, img in results.items():
    print(f"'{asin}': '{img}'")
