import urllib.request
import re
import json

asin = 'B0D5YWQDZT'
search_url = f'https://html.duckduckgo.com/html/?q=site:amazon.in+{asin}+m.media-amazon.com'

req = urllib.request.Request(
    search_url,
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'}
)

try:
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8', errors='ignore')
        matches = re.findall(r'https://m\.media-amazon\.com/images/I/[A-Za-z0-9%_\-\.]+\.jpg', content)
        print("DuckDuckGo Matches:", list(set(matches)))
except Exception as e:
    print("Search Error:", e)
