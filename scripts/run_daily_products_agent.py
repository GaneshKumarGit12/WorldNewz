#!/usr/bin/env python3
"""
Daily Products Agent CLI Runner - WorldNewz
===========================================
Automates the complete DailyProductsActivity lifecycle:
1. Resolves short/mobile Amazon links (link.amazon/XXXX, amzn.to/XXXX).
2. Filters expired or dead Amazon listings.
3. Enforces multi-dimensional deduplication (ASIN, Image, Title, Price/Discounts).
4. Upgrades images to 1500px Ultra HD and validates HTTP 200 accessibility.
5. Injects new seed records into WorldNewzWebAPI/Services/AmazonProductService.cs.
6. Persists new ASINs to scratch/seen_asins.json.
7. Runs frontend/backend build verification and optional Git deploy.

Usage:
    python scripts/run_daily_products_agent.py --links "https://link.amazon/B09... https://link.amazon/B0h..."
    python scripts/run_daily_products_agent.py --file links.txt --deploy
    python scripts/run_daily_products_agent.py --interactive
"""

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import re
import html
import json
import time
import random
import argparse
import subprocess
import urllib.request
import urllib.parse
import http.cookiejar
from datetime import datetime

AFFILIATE_TAG = "ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
SEEN_ASINS_FILE = os.path.join("scratch", "seen_asins.json")
CSHARP_SERVICE_FILE = os.path.join("WorldNewzWebAPI", "Services", "AmazonProductService.cs")
FAILED_LOG_FILE = os.path.join("scratch", "failed_links.log")
RESOLVED_BATCH_FILE = os.path.join("scratch", "resolved_daily_batch.json")

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
]

MOBILE_USER_AGENTS = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.64 Mobile Safari/537.36'
]

def load_seen_asins():
    if os.path.exists(SEEN_ASINS_FILE):
        try:
            with open(SEEN_ASINS_FILE, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except Exception as e:
            print(f"⚠️ Warning loading seen_asins.json: {e}")
    return set()

def save_seen_asins(seen_set):
    os.makedirs(os.path.dirname(SEEN_ASINS_FILE), exist_ok=True)
    with open(SEEN_ASINS_FILE, "w", encoding="utf-8") as f:
        json.dump(sorted(list(seen_set)), f, indent=2)

def log_failure(url, reason):
    os.makedirs(os.path.dirname(FAILED_LOG_FILE), exist_ok=True)
    try:
        from datetime import timezone
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    except Exception:
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    with open(FAILED_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] URL: {url} | Reason: {reason}\n")

def check_image_url(url):
    """Verifies that an image URL returns HTTP 200 and image content type."""
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': random.choice(USER_AGENTS)}
        )
        with urllib.request.urlopen(req, timeout=6) as response:
            if response.status == 200:
                ct = response.headers.get("Content-Type", "")
                if "image" in ct or "octet-stream" in ct:
                    return True
    except Exception:
        pass
    return False

def make_hd_image(img_url):
    """Upgrades Amazon CDN image URL to full 1500px Ultra HD representation."""
    if not img_url:
        return ""
    clean = re.sub(r'\._[A-Za-z0-9_,-]+(?=\.[a-zA-Z]+$)', '._SL1500_', img_url)
    if '._SL1500_' not in clean and '.' in clean:
        clean = re.sub(r'\.(jpg|jpeg|png|webp)$', '._SL1500_.\\1', clean, flags=re.I)
    return clean

def extract_asin_from_url(url):
    """Extracts 10-character Amazon ASIN from any standard or redirected URL."""
    match = re.search(r'/(?:dp|gp/product|d)/([A-Z0-9]{10})', url, re.I)
    if match:
        return match.group(1).upper()
    match2 = re.search(r'[?&]asin=([A-Z0-9]{10})', url, re.I)
    if match2:
        return match2.group(1).upper()
    match3 = re.search(r'/([A-Z0-9]{10})(?:[/?]|$)', url)
    if match3:
        return match3.group(1).upper()
    return None

def clean_title_text(raw_title):
    t = html.unescape(raw_title)
    t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'^(?:Buy|Order)\s+', '', t, flags=re.I)
    t = re.sub(r'\s*(?:Online at Low Prices in India\s*-\s*Amazon\.in|at Amazon\.in|:\s*Amazon\.in(?::.*)?|- Amazon\.in)$', '', t, flags=re.I).strip()
    return t

class CustomRedirectHandler(urllib.request.HTTPRedirectHandler):
    def http_error_302(self, req, fp, code, msg, headers):
        location = headers.get('Location', '')
        if location.startswith('intent://'):
            m = re.search(r'S\.browser_fallback_url=([^;]+)', location)
            if m:
                fallback = urllib.parse.unquote(m.group(1))
                new_req = urllib.request.Request(fallback, headers=req.headers)
                return self.parent.open(new_req)
            m2 = re.search(r'intent://www\.amazon\.in/([^#]+)', location)
            if m2:
                dp_url = "https://www.amazon.in/" + m2.group(1)
                new_req = urllib.request.Request(dp_url, headers=req.headers)
                return self.parent.open(new_req)
        return super().http_error_302(req, fp, code, msg, headers)

    http_error_301 = http_error_302
    http_error_303 = http_error_302
    http_error_307 = http_error_302

def resolve_single_url(raw_url, seen_asins, existing_csharp_asins, seen_images, seen_titles):
    """Resolves and scrapes a single short link with authentic live data and zero synthetic pricing."""
    raw_url = raw_url.strip()
    if not raw_url or not raw_url.startswith("http"):
        return None

    print(f"\n🔍 Resolving: {raw_url}")
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), CustomRedirectHandler())
    
    # 1. Resolve redirect hops (including client-side JS redirects e.g. amzlinks.in)
    final_url = raw_url
    html_content = ""
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                final_url,
                headers={
                    'User-Agent': random.choice(MOBILE_USER_AGENTS),
                    'Accept-Language': 'en-IN,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            )
            with opener.open(req, timeout=12) as resp:
                final_url = resp.geturl()
                html_bytes = resp.read()
                html_content = html_bytes.decode('utf-8', errors='ignore')

            # Check for client-side JavaScript redirect (e.g. amzlinks.in window.location.replace)
            js_redirect = re.search(r'window\.location\.(?:replace|href)\s*=\s*["\'](https?://[^"\']+)["\']', html_content)
            if not js_redirect:
                js_redirect = re.search(r'<meta\s+http-equiv=["\']refresh["\']\s+content=["\']\d+;\s*url=(https?://[^"\']+)["\']', html_content, re.I)
            
            if js_redirect:
                target_url = js_redirect.group(1)
                print(f"🔄 Following client-side JS redirect to: {target_url}")
                final_url = target_url
                req2 = urllib.request.Request(
                    final_url,
                    headers={
                        'User-Agent': random.choice(MOBILE_USER_AGENTS),
                        'Accept-Language': 'en-IN,en;q=0.9',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    }
                )
                with opener.open(req2, timeout=12) as resp2:
                    final_url = resp2.geturl()
                    html_content = resp2.read().decode('utf-8', errors='ignore')

            break
        except Exception as e:
            if attempt == 2:
                print(f"❌ Failed to resolve {raw_url}: {e}")
                log_failure(raw_url, f"Resolution error: {e}")
                return None
            time.sleep(random.uniform(1.0, 2.5))

    # 2. Extract ASIN
    asin = extract_asin_from_url(final_url) or extract_asin_from_url(raw_url)
    if not asin:
        can_m = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)["\']', html_content)
        if can_m:
            asin = extract_asin_from_url(can_m.group(1))
    if not asin:
        asin_match = re.search(r'data-asin=["\']([A-Z0-9]{10})["\']', html_content)
        if asin_match:
            asin = asin_match.group(1).upper()
    if not asin:
        asin_match2 = re.search(r'/(?:dp|gp/product|d)/([A-Z0-9]{10})', html_content)
        if asin_match2:
            asin = asin_match2.group(1).upper()

    if not asin:
        print(f"❌ Could not extract ASIN from {final_url}")
        log_failure(raw_url, f"ASIN extraction failed on URL: {final_url}")
        return None

    # If resolved page was an intermediary or lacks core product title/price, fetch direct Amazon DP
    if 'productTitle' not in html_content and 'priceToPay' not in html_content and 'twister-plus' not in html_content:
        dp_url = f"https://www.amazon.in/dp/{asin}?th=1"
        try:
            req_dp = urllib.request.Request(
                dp_url,
                headers={
                    'User-Agent': random.choice(MOBILE_USER_AGENTS),
                    'Accept-Language': 'en-IN,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            )
            with opener.open(req_dp, timeout=12) as resp_dp:
                html_content = resp_dp.read().decode('utf-8', errors='ignore')
        except Exception as e:
            pass

    # 3. Check ASIN deduplication
    if asin in seen_asins or asin in existing_csharp_asins:
        print(f"⏩ Skipping duplicate ASIN: {asin}")
        return None

    # 4. Check expired / dead listing signatures
    broken_signatures = [
        "not a functioning page on our site",
        "the web address you entered is not a functioning page",
        "looking for something? we're sorry",
        "<title>page not found</title>",
        "<title>404 - "
    ]
    if any(sig in html_content.lower() for sig in broken_signatures):
        print(f"⚠️ Listing page is broken or 404: ASIN {asin}")
        log_failure(raw_url, f"Broken page for ASIN {asin}")
        return None

    # Check scoped out-of-stock availability
    avail_m = re.search(r'id=["\']availability["\'][^>]*>(.*?)</div>', html_content, re.S)
    if avail_m:
        avail_text = re.sub(r'<[^>]+>', ' ', avail_m.group(1)).strip().lower()
        if "currently unavailable" in avail_text or "we don't know when or if this item will be back in stock" in avail_text:
            print(f"⚠️ Product currently out of stock: ASIN {asin}")
            log_failure(raw_url, f"Out of stock for ASIN {asin}")
            return None

    # 5. Extract Authentic Clean Title
    title = ""
    title_match = re.search(r'<span[^>]*id=["\']productTitle["\'][^>]*>(.*?)</span>', html_content, re.S)
    if title_match and title_match.group(1).strip():
        title = clean_title_text(title_match.group(1))
    if not title:
        title_meta = re.search(r'<title>(.*?)</title>', html_content, re.S)
        if title_meta:
            title = clean_title_text(title_meta.group(1))

    if not title or len(title) < 5:
        print(f"⚠️ Missing or invalid title for ASIN {asin}")
        log_failure(raw_url, f"Missing title for ASIN {asin}")
        return None

    norm_title = re.sub(r'[^a-zA-Z0-9]', '', title.lower())[:40]
    if norm_title in seen_titles:
        print(f"⏩ Skipping duplicate title: {title[:50]}...")
        return None

    # 6. Extract Images & Upgrade to 1500px HD
    img_url = ""
    hires_match = re.search(r'"hiRes"\s*:\s*"([^"]+)"', html_content)
    if hires_match and hires_match.group(1).startswith("http"):
        img_url = hires_match.group(1)
    if not img_url:
        old_hires = re.search(r'data-old-hires=["\'](https?://[^"\']+)["\']', html_content)
        if old_hires:
            img_url = old_hires.group(1)
    if not img_url:
        img_tag = re.search(r'<img[^>]*id=["\']landingImage["\'][^>]*src=["\'](https?://[^"\']+)["\']', html_content)
        if img_tag:
            img_url = img_tag.group(1)
    if not img_url:
        img_m = re.search(r'https://m\.media-amazon\.com/images/I/([A-Za-z0-9\-_%]+)\.(?:jpg|jpeg|png|webp)', html_content)
        if img_m:
            img_url = img_m.group(0)

    if not img_url:
        img_url = f"https://images-na.ssl-images-amazon.com/images/P/{asin}.01.LZZZZZZZ.jpg"

    hd_image = make_hd_image(img_url)
    if not check_image_url(hd_image):
        if check_image_url(img_url):
            hd_image = img_url
        else:
            fallback = f"https://images-na.ssl-images-amazon.com/images/P/{asin}.01.LZZZZZZZ.jpg"
            if check_image_url(fallback):
                hd_image = fallback
            else:
                print(f"⚠️ Image URL inaccessible for ASIN {asin}")
                log_failure(raw_url, f"Image inaccessible for ASIN {asin}: {hd_image}")
                return None

    # Extract media asset ID for image deduplication
    img_id_match = re.search(r'/images/I/([A-Za-z0-9\-_%]+)', hd_image)
    media_id = img_id_match.group(1) if img_id_match else hd_image
    if media_id in seen_images:
        print(f"⏩ Skipping duplicate image asset ID: {media_id}")
        return None

    # 7. Strict Scoped Price Extraction (Zero Synthetic Pricing Protocol)
    price = None

    # Scoped source 1: twister-plus JSON
    twister_m = re.search(r'twister-plus-buying-options-price-data">.*?\{"displayPrice":"[₹$]?([0-9,]+(?:\.[0-9]+)?)"', html_content)
    if twister_m:
        try:
            price = float(twister_m.group(1).replace(',', ''))
        except ValueError:
            price = None

    # Scoped source 2: priceToPay class
    if price is None:
        ptp_m = re.search(r'class=["\'][^"\']*priceToPay[^"\']*["\'].*?<span class=["\']a-offscreen["\']>([₹$]?\s*[0-9,]+(?:\.[0-9]+)?)</span>', html_content, re.S)
        if ptp_m:
            num_str = re.sub(r'[^\d.]', '', ptp_m.group(1))
            if num_str:
                price = float(num_str)

    if price is None:
        ptp_m2 = re.search(r'class=["\'][^"\']*priceToPay[^"\']*["\'].*?<span class=["\']a-price-whole["\']>([0-9,]+)</span>(?:<span class=["\']a-price-fraction["\']>([0-9]+)</span>)?', html_content, re.S)
        if ptp_m2:
            whole = ptp_m2.group(1).replace(',', '')
            frac = ptp_m2.group(2) or "00"
            price = float(f"{whole}.{frac}")

    if price is None:
        inp_m = re.search(r'id=["\']twister-plus-price-data-price["\']\s+value=["\']([0-9,]+(?:\.[0-9]+)?)["\']', html_content)
        if inp_m:
            price = float(inp_m.group(1).replace(',', ''))

    if price is None:
        apex_p = re.search(r'class=["\'][^"\']*apex-pricetopay-value[^"\']*["\'].*?<span class=["\']a-offscreen["\']>([₹$]?\s*[0-9,]+(?:\.[0-9]+)?)</span>', html_content, re.S)
        if apex_p:
            num_str = re.sub(r'[^\d.]', '', apex_p.group(1))
            if num_str:
                price = float(num_str)

    # Reject if price cannot be verified (Zero Dummy Prices)
    if price is None or price <= 0:
        print(f"❌ Could not extract authentic price for ASIN {asin}")
        log_failure(raw_url, f"Unextractable price for ASIN {asin}")
        return None

    # Extract Authentic MRP / Original Price
    orig_price = None
    bp_m = re.search(r'class=["\'][^"\']*basisPrice[^"\']*["\'].*?<span class=["\']a-offscreen["\']>([₹$]?\s*[0-9,]+(?:\.[0-9]+)?)</span>', html_content, re.S)
    if bp_m:
        num_str = re.sub(r'[^\d.]', '', bp_m.group(1))
        if num_str:
            orig_price = float(num_str)

    if not orig_price:
        block_m = re.search(r'id=["\'](?:corePriceDisplay_desktop_feature_div|apex_desktop|corePrice_desktop|desktop_unifiedPrice)["\'](.*?)</div>\s*</div>', html_content, re.S)
        if block_m:
            atp = re.search(r'class=["\'][^"\']*a-text-price[^"\']*["\'].*?<span class=["\']a-offscreen["\']>([₹$]?\s*[0-9,]+(?:\.[0-9]+)?)</span>', block_m.group(1), re.S)
            if atp:
                num_str = re.sub(r'[^\d.]', '', atp.group(1))
                if num_str:
                    orig_price = float(num_str)

    # Extract Authentic Discount %
    discount_pct = None
    disc_m = re.search(r'class=["\'][^"\']*savingPriceOverride[^"\']*["\']>(-?\d+)%</span>', html_content)
    if disc_m:
        discount_pct = abs(int(disc_m.group(1)))
    else:
        disc_m2 = re.search(r'with\s+(\d+)\s+percent\s+savings', html_content)
        if disc_m2:
            discount_pct = int(disc_m2.group(1))

    # Consistency check: If discount percentage exists, verify or calculate authentic MRP
    if (orig_price is None or orig_price <= price) and discount_pct and discount_pct > 0 and discount_pct < 100:
        calculated_mrp = round(price / (1.0 - (discount_pct / 100.0)))
        orig_price = float(calculated_mrp)
    elif orig_price is None or orig_price < price:
        orig_price = price  # No synthetic calculations, 0% discount if no MRP

    # 8. Extract Category & Clean Description
    category = "Technology"
    cat_keywords = {
        "Fashion": ["shirt", "pant", "jogger", "trouser", "dress", "shoes", "sneakers", "jacket", "jeans", "wallet", "bag", "handbag", "jewellery", "jewelry", "fabric", "saree", "kurta", "kurti", "tshirt", "t-shirt", "bra", "lingerie", "socks", "rhinestone", "hair bow", "clips", "beads", "lungi", "bangles", "earring", "necklace", "ring", "sunglasses", "sandals", "slippers", "heels", "watch", "belt", "backpack", "duffle", "lehenga", "suit", "blazer", "tie", "cufflink", "clutch", "purse", "dhoti", "headband", "trolley bag", "suitcase"],
        "Beauty & Personal Care": ["cream", "lotion", "serum", "perfume", "fragrance", "shampoo", "trimmer", "shaver", "soap", "body brush", "rose water", "face wash", "nail polish", "kajal", "eyeliner", "mascara", "lipstick", "lip balm", "comb", "roller", "sunscreen", "moisturizer", "scissor", "reetha", "hair oil", "wax", "scrub", "ghee cream", "cleanser", "toner", "conditioner", "face mask", "sun screen", "toothpaste", "handwash", "roll-on", "deodorant", "hair color"],
        "Grocery & Gourmet Foods": ["honey", "dates", "dry fruit", "khajoor", "almond", "sugar-free", "cashew", "snack", "tea", "coffee", "biscuit", "cookie", "spice", "masala", "edible oil", "cooking oil", "ghee", "dry fruits", "raisin", "walnut", "makhana", "seeds", "peanuts", "badam"],
        "Home & Kitchen": ["cookware", "kitchen", "bottle", "knife", "towel", "pillow", "bed", "curtain", "lamp", "desk", "chair", "wall plate", "mosquito net", "candle", "tealight", "bedsheet", "blanket", "shelf", "fan cover", "dibba", "container", "storage", "organizer", "tray", "twine", "photo frame", "plant stand", "flower pot", "mattress", "razai", "lock", "vinyl", "wallpaper", "mat", "rug", "lighter", "sign board", "wall decor", "broom", "dispenser", "water bottle", "cover", "fridge magnet", "clip", "mop", "cup", "mug", "plate", "spoon", "fork", "pan", "pot", "cooker", "bed sheet", "doormat", "curtain rod", "hanger", "cutlery", "utensil", "casserole", "chopper", "peeler", "grater", "blender", "mixer", "flask", "thermos", "drainer", "dustbin", "cushion", "sofa", "wardrobe", "tawa", "pooja", "showpiece", "god idol", "idol", "figurine", "garbage bag", "water purifier", "kettle", "cleaning cloth", "magic eraser"],
        "Health & Fitness": ["protein", "supplement", "vitamin", "dumbbells", "yoga", "fitness", "massager", "hot water bag", "foot patch", "eye mask", "reading glasses", "hand wrap", "knee support", "weight", "shaker", "bandage", "brace", "gym", "exercise", "resistance band", "incline", "barbell", "glucometer", "thermometer", "nebulizer", "weighing scale", "orthopedic", "diaper", "cycle"],
        "Toys & Games": ["squishy toy", "fidget toy", "toy knife", "novelty", "taba squeeze", "puzzle", "action figure", "pencil box", "lcd writing pad", "drawing board", "balloon", "decoration kit", "birthday", "toy", "game", "doll", "car toy", "board game", "cards", "lego", "building block", "glitter tape", "art and craft"]
    }
    lower_t = title.lower()
    for cat, kws in cat_keywords.items():
        if any(re.search(r'\b' + re.escape(kw) + r'\b', lower_t, re.I) for kw in kws):
            category = cat
            break

    # Clean description from feature bullets, filtering out warranty / protection garbage
    description = ""
    valid_bullets = []
    fb_m = re.search(r'id=["\']feature-bullets["\'].*?</ul>', html_content, re.S)
    if fb_m:
        bullets = re.findall(r'<span class=["\']a-list-item["\'][^>]*>(.*?)</span>', fb_m.group(0), re.S)
        for b in bullets:
            cb = html.unescape(re.sub(r'<[^>]+>', ' ', b)).strip()
            cb = re.sub(r'\s+', ' ', cb)
            if not cb or len(cb) < 10:
                continue
            lower_cb = cb.lower()
            if any(junk in lower_cb for junk in [
                'protection plan', 'warranty certificate', 'email delivery only',
                'dimension options with no featured offers', 'no featured offers',
                'replacement plan', 'claim within', 'valid for a period of', 'terms and conditions'
            ]):
                continue
            valid_bullets.append(cb)

    if valid_bullets:
        description = " • ".join(valid_bullets[:3])
        if len(description) > 280:
            description = description[:277] + "..."
    else:
        pd_m = re.search(r'id=["\']productDescription["\'][^>]*>(.*?)</div>', html_content, re.S)
        if pd_m:
            desc_text = html.unescape(re.sub(r'<[^>]+>', ' ', pd_m.group(1))).strip()
            desc_text = re.sub(r'\s+', ' ', desc_text)
            if len(desc_text) > 20:
                description = desc_text[:277] + "..." if len(desc_text) > 280 else desc_text

    if not description:
        description = title[:200] + "..."

    description = description.replace("&amp;", "&").replace("&quot;", '"').replace("&#39;", "'")
    title = re.sub(r'[\ufffd\x80-\x9f\u2013\u2014]', '-', title).strip()
    description = re.sub(r'[\ufffd\x80-\x9f\u2013\u2014]', '-', description).strip()

    # Record unique identifiers
    seen_images.add(media_id)
    seen_titles.add(norm_title)

    product_url = f"https://www.amazon.in/dp/{asin}?tag={AFFILIATE_TAG}"
    print(f"✅ Resolved ASIN {asin} | {title[:40]}... | Price: ₹{price:.2f} (MRP: ₹{orig_price:.2f}) [{category}]")

    return {
        "asin": asin,
        "title": title,
        "description": description,
        "category": category,
        "imageUrl": hd_image,
        "price": price,
        "originalPrice": orig_price,
        "productUrl": product_url,
        "shareUrl": product_url,
        "isActive": True
    }

def seed_to_csharp(products):
    """Appends new product blocks to WorldNewzWebAPI/Services/AmazonProductService.cs."""
    if not os.path.exists(CSHARP_SERVICE_FILE):
        print(f"❌ C# Service file not found: {CSHARP_SERVICE_FILE}")
        return False

    with open(CSHARP_SERVICE_FILE, "r", encoding="utf-8") as f:
        csharp_code = f.read()

    new_blocks = []
    for p in products:
        asin = p["asin"]
        if f'Asin = "{asin}"' in csharp_code:
            continue

        title_esc = p["title"].replace('"', '\\"').replace('\n', ' ').strip()
        desc_esc = p["description"].replace('"', '\\"').replace('\n', ' ').strip()
        cat = p["category"]
        img = p["imageUrl"]
        price = p["price"]
        orig_price = p["originalPrice"]
        prod_url = p["productUrl"]

        block = f"""            new AmazonProduct
            {{
                Asin = "{asin}",
                Title = "{title_esc}",
                Description = "{desc_esc}",
                Price = {price:.2f}m,
                OriginalPrice = {orig_price:.2f}m,
                Rating = 4.5,
                ReviewCount = 150,
                Category = "{cat}",
                ProductUrl = "{prod_url}",
                ImageUrl = "{img}",
                IsActive = true,
                DateAdded = DateTime.UtcNow
            }},"""
        new_blocks.append(block)

    if not new_blocks:
        print("ℹ️ No new C# blocks to inject.")
        return True

    insertion_text = "\n".join(new_blocks)
    target = "            },\n        };"
    if target in csharp_code:
        updated_code = csharp_code.replace(target, f"            }},\n{insertion_text}\n        }};", 1)
    else:
        target_alt = "        };"
        pos = csharp_code.rfind(target_alt, 0, csharp_code.rfind("bool changed = false;"))
        if pos != -1:
            updated_code = csharp_code[:pos] + insertion_text + "\n" + csharp_code[pos:]
        else:
            print("❌ Failed to locate insertion target in AmazonProductService.cs")
            return False

    with open(CSHARP_SERVICE_FILE, "w", encoding="utf-8") as f:
        f.write(updated_code)

    print(f"✨ Successfully injected {len(new_blocks)} new product seeds into AmazonProductService.cs!")
    return True

def run_build_verification():
    """Runs dotnet build and npm run build to verify integrity."""
    print("\n🔨 Starting verification builds...")
    
    # 1. Backend build
    print("👉 Checking WorldNewzWebAPI (dotnet build)...")
    res_dotnet = subprocess.run(["dotnet", "build", "WorldNewzWebAPI/WorldNewzWebAPI.csproj"], capture_output=True, text=True)
    if res_dotnet.returncode != 0:
        print(f"❌ Backend build failed:\n{res_dotnet.stderr or res_dotnet.stdout}")
        return False
    print("✅ Backend build succeeded!")

    # 2. Frontend build
    print("👉 Checking worldnewz_UI (npm run build)...")
    res_npm = subprocess.run(["npm", "run", "build"], cwd="worldnewz_UI", shell=True, capture_output=True, text=True)
    if res_npm.returncode != 0:
        print(f"❌ Frontend build failed:\n{res_npm.stderr or res_npm.stdout}")
        return False
    print("✅ Frontend build succeeded!")
    return True

def git_commit_and_push(count):
    """Commits and pushes changes to git repository."""
    print("\n🚀 Pushing changes to origin/main...")
    try:
        subprocess.run(["git", "add", "-u"], check=True)
        commit_msg = f"feat: Add {count} daily Amazon affiliate products and update rotation seeds"
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        subprocess.run(["git", "push", "origin", "main"], check=True)
        print("✅ Git push successful!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Git deploy failed: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="WorldNewz Daily Products Agent CLI")
    parser.add_argument("--links", type=str, help="Space or newline separated Amazon short links")
    parser.add_argument("--file", type=str, help="Path to text file containing links")
    parser.add_argument("--deploy", action="store_true", help="Auto-commit and push to Git upon successful build")
    parser.add_argument("--interactive", action="store_true", help="Interactively enter URLs")
    args = parser.parse_args()

    urls = []
    if args.links:
        urls = [u.strip() for u in args.links.split() if u.strip()]
    elif args.file and os.path.exists(args.file):
        with open(args.file, "r", encoding="utf-8") as f:
            urls = [line.strip() for line in f if line.strip()]
    elif args.interactive or len(sys.argv) == 1:
        print("==================================================")
        print("🛍️  WorldNewz Daily Products Activity Agent CLI")
        print("==================================================")
        print("Enter raw affiliate links (one per line). Submit empty line when finished:")
        while True:
            try:
                line = input().strip()
                if not line:
                    break
                urls.append(line)
            except EOFError:
                break

    if not urls:
        print("ℹ️ No links provided. Exiting.")
        return

    print(f"\n📋 Received {len(urls)} links to process.")

    # Load deduplication registries
    seen_asins = load_seen_asins()
    existing_csharp_asins = set()
    if os.path.exists(CSHARP_SERVICE_FILE):
        with open(CSHARP_SERVICE_FILE, "r", encoding="utf-8") as f:
            existing_csharp_asins = set(re.findall(r'Asin\s*=\s*"([A-Z0-9]{10})"', f.read()))

    seen_images = set()
    seen_titles = set()
    resolved_products = []

    for raw_url in urls:
        product = resolve_single_url(raw_url, seen_asins, existing_csharp_asins, seen_images, seen_titles)
        if product:
            resolved_products.append(product)
            seen_asins.add(product["asin"])

    print(f"\n==================================================")
    print(f"📊 Summary: {len(resolved_products)} valid unique products ready for seeding.")
    print(f"==================================================")

    if not resolved_products:
        print("ℹ️ No new products to seed. All were duplicates, expired, or invalid.")
        return

    # Save resolved batch
    os.makedirs(os.path.dirname(RESOLVED_BATCH_FILE), exist_ok=True)
    with open(RESOLVED_BATCH_FILE, "w", encoding="utf-8") as f:
        json.dump(resolved_products, f, indent=2)

    # Seed to C#
    if not seed_to_csharp(resolved_products):
        print("❌ Seeding to C# failed.")
        return

    # Update seen ASINs registry
    save_seen_asins(seen_asins)
    print(f"💾 Updated {SEEN_ASINS_FILE} (Total tracked ASINs: {len(seen_asins)})")

    # Run verification builds
    if run_build_verification():
        print("\n🎉 Build verification passed cleanly!")
        if args.deploy:
            git_commit_and_push(len(resolved_products))
        else:
            print("💡 Tip: Pass --deploy to automatically commit and push to production.")
    else:
        print("\n❌ Verification build failed. Please inspect errors.")

if __name__ == "__main__":
    main()
