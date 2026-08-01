import urllib.request

asin = 'B0FDQKGB28'
url = f'https://m.media-amazon.com/images/P/{asin}.01._SCLZZZZZZZ_SX500_.jpg'
proxy_url = f'https://images.weserv.nl/?url={urllib.parse.quote(url)}'

print("Testing direct:", url)
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        content = resp.read()
        print(f"Direct Status: {resp.status}, Length: {len(content)}, Content-Type: {resp.headers.get('Content-Type')}")
except Exception as e:
        print("Direct Error:", e)

print("\nTesting weserv proxy:", proxy_url)
try:
    req = urllib.request.Request(proxy_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        content = resp.read()
        print(f"Proxy Status: {resp.status}, Length: {len(content)}, Content-Type: {resp.headers.get('Content-Type')}")
except Exception as e:
        print("Proxy Error:", e)
