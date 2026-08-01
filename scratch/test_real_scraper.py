import urllib.request
import re
import json

asins = ['B0CV4FW8SG', 'B0DTB5LZN6', 'B0FDQKGB28', 'B0D5YWQDZT']

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br'
}

for asin in asins:
    url = f'https://www.amazon.in/dp/{asin}'
    print(f"\n--- ASIN: {asin} ({url}) ---")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            # If gzip encoded
            if resp.headers.get('Content-Encoding') == 'gzip':
                import gzip
                content = gzip.decompress(content)
            html_text = content.decode('utf-8', errors='ignore')
            
            # Find data-a-dynamic-image
            dynamic_img = re.search(r'data-a-dynamic-image="([^"]+)"', html_text)
            if dynamic_img:
                raw_json = html_text[dynamic_img.start(1):dynamic_img.end(1)].replace('&quot;', '"')
                img_dict = json.loads(raw_json)
                main_img = list(img_dict.keys())[0]
                print(f"Dynamic Image Found: {main_img}")
            else:
                # Find hiRes or landingImageUrl
                hires = re.search(r'"hiRes"\s*:\s*"([^"]+)"', html_text)
                if hires:
                    print(f"HiRes Image Found: {hires.group(1)}")
                else:
                    landing = re.search(r'"landingImageUrl"\s*:\s*"([^"]+)"', html_text)
                    if landing:
                        print(f"Landing Image Found: {landing.group(1)}")
                    else:
                        # Find all m.media-amazon.com/images/I/
                        imgs = re.findall(r'https://m\.media-amazon\.com/images/I/([A-Za-z0-9\-_%+]+)\._[^"\']+\.jpg', html_text)
                        if imgs:
                            print(f"Found Media Image ID: {imgs[0]} -> https://m.media-amazon.com/images/I/{imgs[0]}._SL500_.jpg")
                        else:
                            print("No image pattern matched in page HTML.")
    except Exception as e:
        print(f"Error scraping {asin}: {e}")
