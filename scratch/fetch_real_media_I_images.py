import urllib.request
import re
import json
import random
import time
import html as html_parser

urls_info = [
    {"shortUrl": "https://amzn.to/4fCeBNO", "asin": "B0DTXVM898"},
    {"shortUrl": "https://amzn.to/4vWRfIZ", "asin": "B0CGPTBFYL"},
    {"shortUrl": "https://amzn.to/4yTqQOQ", "asin": "B0D14QYFJP"},
    {"shortUrl": "https://amzn.to/4pT0j03", "asin": "B0B69589JY"},
    {"shortUrl": "https://amzn.to/4w1RG4S", "asin": "B0FNMQ24NV"},
    {"shortUrl": "https://amzn.to/4w5NQaS", "asin": "B0DGY2SH77"},
    {"shortUrl": "https://amzn.to/3RtllG2", "asin": "B0DJD8PJGG"},
    {"shortUrl": "https://amzn.to/45FERSR", "asin": "B0DGD58SQV"},
    {"shortUrl": "https://amzn.to/4w5NT6y", "asin": "B0DGTWXVZZ"},
    {"shortUrl": "https://amzn.to/44WJHuS", "asin": "B09XJ8K726"},
    {"shortUrl": "https://amzn.to/4xfbmDk", "asin": "B0GJDL274Z"},
    {"shortUrl": "https://amzn.to/4xfVS1T", "asin": "B0GGHLCK2S"},
    {"shortUrl": "https://amzn.to/4br7O8F", "asin": "B0GK93PM58"},
    {"shortUrl": "https://amzn.to/4bsaB1o", "asin": "B09P446B53"},
    {"shortUrl": "https://amzn.to/4g2CorL", "asin": "B0FXRD8TC2"},
    {"shortUrl": "https://amzn.to/4wzhzdg", "asin": "B0DRVSSYZC"},
    {"shortUrl": "https://amzn.to/3Tw5tmI", "asin": "B0BZTY4FB5"},
    {"shortUrl": "https://amzn.to/4yTJc2l", "asin": "B0DSJJL5RD"},
    {"shortUrl": "https://amzn.to/3RGI0ia", "asin": "B0DR2CXY7C"},
    {"shortUrl": "https://amzn.to/4pPAOwP", "asin": "B0D7MJJJD7"},
    {"shortUrl": "https://amzn.to/4pRQRdv", "asin": "B0DY57KYRH"},
    {"shortUrl": "https://amzn.to/4fxdpg7", "asin": "B0CB3VNBT2"},
    {"shortUrl": "https://amzn.to/4ga6j0f", "asin": "B0GH2C7RMQ"},
    {"shortUrl": "https://amzn.to/4boTCwU", "asin": "B0G7GGYHKX"},
    {"shortUrl": "https://amzn.to/4fKHrfg", "asin": "B0DGD9SP8S"},
    {"shortUrl": "https://amzn.to/4bodCzG", "asin": "B0CMTLZ5N3"},
    {"shortUrl": "https://amzn.to/4fR6rS9", "asin": "B08K391DL3"},
    {"shortUrl": "https://amzn.to/4fR6yx3", "asin": "B0BSS245SY"},
    {"shortUrl": "https://amzn.to/4yPg5gu", "asin": "B0F2MVC3LW"},
    {"shortUrl": "https://amzn.to/4fyPAV5", "asin": "B0GY5J8YM5"}
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
}

results = {}

for item in urls_info:
    asin = item['asin']
    url = f"https://www.amazon.in/dp/{asin}"
    req = urllib.request.Request(url, headers=headers)
    img_url = None
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Extract hiRes or landingImage or main image
            match = re.search(r'https://m\.media-amazon\.com/images/I/([A-Za-z0-9%_\-+]+)\._AC_[^"]+\.jpg', html)
            if match:
                img_url = f"https://m.media-amazon.com/images/I/{match.group(1)}._SL1500_.jpg"
            else:
                match2 = re.search(r'https://m\.media-amazon\.com/images/I/([A-Za-z0-9%_\-+]+)\.jpg', html)
                if match2:
                    img_url = f"https://m.media-amazon.com/images/I/{match2.group(1)}.jpg"
    except Exception as e:
        print(f"[{asin}] HTTP fetch error: {e}")
        
    if not img_url:
        img_url = f"https://m.media-amazon.com/images/P/{asin}.01._SCLZZZZZZZ_SX500_.jpg"
        
    results[asin] = img_url
    print(f"ASIN: {asin} -> Image: {img_url}")

with open("scratch/real_media_I_images.json", "w") as f:
    json.dump(results, f, indent=2)
