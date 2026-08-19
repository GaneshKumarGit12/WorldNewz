import urllib.request
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

url = "https://link.amazon/B02Jb64Kl"

class TraceRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        print(f"Hop -> Code: {code}, Location: {newurl}")
        return urllib.request.Request(newurl, headers=req.headers)

opener = urllib.request.build_opener(TraceRedirects)
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')]

try:
    with opener.open(url, timeout=12) as resp:
        print(f"Final URL: {resp.geturl()}")
        html = resp.read().decode('utf-8', errors='ignore')
        print(f"HTML Title: {re.search(r'<title>(.*?)</title>', html, re.I)}")
except Exception as e:
    print(f"Exception: {e}")
