import urllib.request
import http.cookiejar
import re
import html as html_parser
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

urls = [
    ("https://link.amazon/B0c3WEwH9", "B0D2S3RVWS"),
    ("https://www.amazon.in/dp/B0H4CYJMQ1", "B0H4CYJMQ1")
]

class TraceRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        print(f"Hop: {req.full_url} -> {newurl}")
        return urllib.request.Request(newurl, headers=req.headers)

opener = urllib.request.build_opener(TraceRedirects)
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')]

for short_url, default_asin in urls:
    print(f"\n--- Checking {short_url} ---")
    try:
        resp = opener.open(short_url, timeout=12)
        final_url = resp.geturl()
        print(f"Final URL: {final_url}")
    except Exception as e:
        print(f"Error {short_url}: {e}")
