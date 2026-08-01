import urllib.request

asins = ['B0DTB5LZN6', 'B0FDQKGB28', 'B0FMDL81GS', 'B0GX94B58L']

for asin in asins:
    print(f"=== ASIN: {asin} ===")
    patterns = [
        f"https://images-eu.ssl-images-amazon.com/images/P/{asin}.01._SCLZZZZZZZ_SX500_.jpg",
        f"https://m.media-amazon.com/images/P/{asin}.01._SCLZZZZZZZ_SX500_.jpg",
        f"https://images-na.ssl-images-amazon.com/images/I/{asin}.jpg",
        f"https://ws-in.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=IN&ASIN={asin}&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL500_"
    ]
    for p in patterns:
        try:
            req = urllib.request.Request(p, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req) as resp:
                length = len(resp.read())
                ct = resp.headers.get('Content-Type')
                print(f"  Pattern: {p}\n  Length: {length}, Content-Type: {ct}\n")
        except Exception as e:
            print(f"  Pattern: {p}\n  Error: {e}\n")
