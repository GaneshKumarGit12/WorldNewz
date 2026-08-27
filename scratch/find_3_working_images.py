import urllib.request
import http.cookiejar
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

asins = ["B0GQMRTH12", "B0F446395Z", "B0FT14Z75S"]

user_agents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
]

results = {}

for asin in asins:
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    opener.addheaders = [
        ('User-Agent', user_agents[0]),
        ('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
    ]
    
    url = f"https://www.amazon.in/dp/{asin}"
    try:
        with opener.open(url, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            all_imgs = re.findall(r'https://m\.media-amazon\.com/images/I/[A-Za-z0-9%_\-\+\.]+\.(?:jpg|png)', html)
            
            headers = {'User-Agent': user_agents[1]}
            for img in all_imgs:
                if any(x in img for x in ['PKmb-play', 'sprite', 'icon', 'logo', 'G/01', 'G/31']):
                    continue
                try:
                    req = urllib.request.Request(img, headers=headers)
                    with urllib.request.urlopen(req, timeout=5) as t_resp:
                        if t_resp.status == 200:
                            results[asin] = img
                            print(f"✅ Found working image for {asin}: {img}")
                            break
                except:
                    pass
    except Exception as e:
        print(f"Error {asin}: {e}")

print("\n--- Summary of Verified Working Images ---")
for asin, img in results.items():
    print(f"'{asin}': '{img}'")
