import urllib.request
import re
import json
import time
import random
import os
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

headers_list = [
    {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0'
    },
    {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
    }
]

def fetch_product_details(item):
    asin = item['asin']
    url = f"https://www.amazon.in/dp/{asin}"
    req = urllib.request.Request(url, headers=random.choice(headers_list))
    
    title = None
    image_url = None
    price = None
    original_price = None
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
            # Extract title
            t_match = re.search(r'<span id="productTitle"[^>]*>\s*([^<]+)\s*</span>', html)
            if t_match:
                title = html_parser.unescape(t_match.group(1).strip())
            
            # Extract hi-res image from colorImages or landingImage
            img_match = re.search(r'"hiRes":\s*"(https://m\.media-amazon\.com/images/I/[^"]+\.jpg)"', html)
            if not img_match:
                img_match = re.search(r'"large":\s*"(https://m\.media-amazon\.com/images/I/[^"]+\.jpg)"', html)
            if not img_match:
                img_match = re.search(r'data-old-hires="(https://m\.media-amazon\.com/images/I/[^"]+\.jpg)"', html)
            if not img_match:
                img_match = re.search(r'data-a-dynamic-image=\'{&quot;(https://m\.media-amazon\.com/images/I/[^&]+\.jpg)', html)
            if not img_match:
                img_match = re.search(r'https://m\.media-amazon\.com/images/I/([A-Za-z0-9%_\-+]+)\._AC_[^"]+\.jpg', html)
                if img_match:
                    img_id = img_match.group(1)
                    image_url = f"https://m.media-amazon.com/images/I/{img_id}._SL1500_.jpg"
            
            if img_match and not image_url:
                image_url = img_match.group(1)
                
            # Extract price
            p_match = re.search(r'<span class="a-price-whole">\s*([\d,]+)', html)
            if p_match:
                price = float(p_match.group(1).replace(',', ''))
                
            op_match = re.search(r'<span class="a-text-price"[^>]*>\s*<span class="a-offscreen">\s*₹?\s*([\d,]+)', html)
            if op_match:
                original_price = float(op_match.group(1).replace(',', ''))

    except Exception as e:
        print(f"[{asin}] Failed to fetch page directly: {e}")
        
    # Construct exact canonical Amazon product image URL if html extraction hit captcha
    if not image_url:
        image_url = f"https://m.media-amazon.com/images/P/{asin}.01._SCLZZZZZZZ_SX500_.jpg"

    return {
        "asin": asin,
        "title": title,
        "imageUrl": image_url,
        "price": price,
        "originalPrice": original_price,
        "shortUrl": item['shortUrl']
    }

print("Fetching exact product details for 30 links...\n")
scraped_data = []

for idx, item in enumerate(urls_info, 1):
    time.sleep(random.uniform(0.5, 1.2))
    details = fetch_product_details(item)
    print(f"[{idx}/30] ASIN: {details['asin']} -> Title: {details['title'][:40] if details['title'] else 'N/A'} -> Image: {details['imageUrl']}")
    scraped_data.append(details)

with open("scratch/scraped_30_details.json", "w") as f:
    json.dump(scraped_data, f, indent=2)

print("\nFinished scraping 30 exact product details.")
