import urllib.request
import gzip

url = 'https://www.amazon.in/dp/B0CV4FW8SG'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br'
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        content = resp.read()
        if resp.headers.get('Content-Encoding') == 'gzip':
            content = gzip.decompress(content)
        html_text = content.decode('utf-8', errors='ignore')
        print("HTML Length:", len(html_text))
        print("First 500 chars:", html_text[:500])
except Exception as e:
    print("Error:", e)
