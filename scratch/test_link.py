import urllib.request
import re
import json

url = 'https://www.amazon.in/HTM-590-Contact-Digital-Tachometer-Easy/dp/B0D5YWQDZT'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        html_text = resp.read().decode('utf-8', errors='ignore')
        
        # Look for landingImageUrl or hiRes or dynamic image json
        match = re.search(r'data-a-dynamic-image="([^"]+)"', html_text)
        if match:
            clean_json = match.group(1).replace('&quot;', '"')
            img_dict = json.loads(clean_json)
            print("Found dynamic images:", list(img_dict.keys()))
        else:
            # Try finding landingImageUrl
            match_landing = re.search(r'"landingImageUrl"\s*:\s*"([^"]+)"', html_text)
            if match_landing:
                print("Landing Image URL:", match_landing.group(1))
            else:
                # Find all m.media-amazon.com/images/I/ URLs
                imgs = re.findall(r'https://m\.media-amazon\.com/images/I/([A-Za-z0-9\-_%+]+)\._[^"\']+\.jpg', html_text)
                if imgs:
                    print("Extracted Amazon Image Code:", imgs[0])
                    print("Full Image URL:", f"https://m.media-amazon.com/images/I/{imgs[0]}.jpg")
                else:
                    print("No direct image match found in HTML.")
except Exception as e:
    print("Scrape Error:", e)
