/**
 * Branded Amazon Affiliate Short-Link Redirector for WorldNewzs.in
 * Route: https://worldnewzs.in/p/{ASIN} -> /api/product-redirect?code={ASIN}
 *
 * Guarantees:
 * - Preserves the exact original Amazon.in affiliate productUrl & all tracking parameters
 *   (tag, linkCode, linkId, ref_) via HTTP 302 redirect.
 * - Strict ASIN validation + Amazon hostname allowlist (zero open-redirect risk).
 * - Instant deterministic affiliate fallback if Render backend is cold-starting.
 * - Smart Open Graph HTML response for social link-preview bots (facebookexternalhit,
 *   Facebot, Threads/Meta, WhatsApp, Twitterbot) so Facebook renders crisp deal cards,
 *   while human clicks receive an immediate HTTP 302 redirect to Amazon.in.
 * - Private Cache-Control + Vary: User-Agent prevents CDN cache collisions between
 *   social preview crawlers (200 OG HTML) and human visitors (302 redirect).
 */

const RENDER_API_BASE =
  process.env.WORLDNEWZ_API_BASE || 'https://worldnewz.onrender.com';
const DEFAULT_ASSOCIATE_TAG =
  process.env.AMAZON_ASSOCIATE_TAG || 'ganeshd12-21';
const DEFAULT_LINK_ID =
  process.env.AMAZON_DEFAULT_LINK_ID || '309384296fe1c1e72569a81c50402f7a';

const ASIN_REGEX = /^[A-Z0-9]{10}$/;
const SOCIAL_BOT_REGEX =
  /facebookexternalhit|facebot|meta-externalagent|twitterbot|whatsapp|linkedinbot|slackbot|telegrambot|discordbot/i;
const ALLOWED_AMAZON_HOSTS = new Set([
  'amazon.in',
  'www.amazon.in',
  'amzn.to',
  'amzn.in',
]);

// Warm serverless-instance cache: ASIN -> { productUrl, title, price, originalPrice, imageUrl, fromCatalog, expiresAt }
const PRODUCT_CACHE = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;

export function buildFallbackAmazonUrl(asin) {
  return `https://www.amazon.in/dp/${asin}?tag=${encodeURIComponent(
    DEFAULT_ASSOCIATE_TAG
  )}&linkCode=ll2&linkId=${encodeURIComponent(
    DEFAULT_LINK_ID
  )}&ref_=as_li_ss_tl`;
}

export function sanitizeAmazonAffiliateUrl(rawUrl, asin) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return buildFallbackAmazonUrl(asin);
  }
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return buildFallbackAmazonUrl(asin);
    }
    if (!ALLOWED_AMAZON_HOSTS.has(host)) {
      return buildFallbackAmazonUrl(asin);
    }
    // Preserve exact URL and all existing query parameters verbatim.
    // Only ensure associate tag is present if missing on amazon.in URLs.
    if (host.endsWith('amazon.in') && !parsed.searchParams.has('tag')) {
      parsed.searchParams.set('tag', DEFAULT_ASSOCIATE_TAG);
      return parsed.toString();
    }
    return rawUrl.trim();
  } catch {
    return buildFallbackAmazonUrl(asin);
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val).trim();
  if (s.includes('₹')) return s;
  const num = Number(s);
  if (!Number.isNaN(num) && num > 0) {
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  }
  return s;
}

function extractAsinCode(req) {
  let rawCode = Array.isArray(req.query?.code)
    ? req.query.code[0]
    : req.query?.code || '';

  // Defensive fallback: extract ASIN directly from request URL path if rewrite param is absent
  if (!rawCode && typeof req.url === 'string') {
    const pathOnly = req.url.split('?')[0];
    const match = pathOnly.match(/\/p\/([A-Za-z0-9]{10})\/?$/i);
    if (match) {
      rawCode = match[1];
    }
  }

  return String(rawCode).trim().toUpperCase();
}

async function lookupProductByAsin(asin) {
  const now = Date.now();
  const cached = PRODUCT_CACHE.get(asin);
  if (cached && cached.expiresAt > now) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const url = `${RENDER_API_BASE}/api/amazonproducts?search=${encodeURIComponent(
      asin
    )}&pageSize=5`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'WorldNewzs-ShortLink-Redirector/1.0',
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const payload = await response.json();
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.products)
          ? payload.products
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

      const match = list.find(
        (p) => String(p?.asin || '').trim().toUpperCase() === asin
      );

      if (match) {
        const record = {
          productUrl: sanitizeAmazonAffiliateUrl(
            match.productUrl || match.dealUrl,
            asin
          ),
          title: String(match.title || match.name || '').trim(),
          price: formatPrice(match.price),
          originalPrice: formatPrice(match.originalPrice),
          imageUrl: String(match.imageUrl || '').trim(),
          fromCatalog: true,
          expiresAt: now + CACHE_TTL_MS,
        };
        if (PRODUCT_CACHE.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = PRODUCT_CACHE.keys().next().value;
          if (oldestKey) PRODUCT_CACHE.delete(oldestKey);
        }
        PRODUCT_CACHE.set(asin, record);
        return record;
      }
    }
  } catch {
    // Graceful fallback below if Render is cold-starting or timed out
  }

  return {
    productUrl: buildFallbackAmazonUrl(asin),
    title: '',
    price: '',
    originalPrice: '',
    imageUrl: `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_SX500_.jpg`,
    fromCatalog: false,
    expiresAt: now + 60 * 1000,
  };
}

export default async function handler(req, res) {
  const asin = extractAsinCode(req);

  // Security and cache-isolation headers common to all responses
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('Vary', 'User-Agent');

  if (!ASIN_REGEX.test(asin)) {
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.setHeader('Location', 'https://worldnewzs.in/amazon-products');
    return res.status(302).end();
  }

  const product = await lookupProductByAsin(asin);
  const destinationUrl = sanitizeAmazonAffiliateUrl(product.productUrl, asin);
  const userAgent = String(req.headers?.['user-agent'] || '');

  // Serve crisp Open Graph card metadata for social preview crawlers when metadata is available.
  // Cache-Control: private, no-store ensures Vercel Edge CDN never caches bot HTML for human clicks.
  if (SOCIAL_BOT_REGEX.test(userAgent) && product.title) {
    const ogTitle = product.price
      ? `${product.title.slice(0, 90)} — ${product.price} | Amazon.in Deal`
      : `${product.title.slice(0, 100)} | Amazon.in Deal`;
    const mrpPart =
      product.originalPrice && product.originalPrice !== product.price
        ? ` (MRP ${product.originalPrice})`
        : '';
    const ogDesc = product.price
      ? `Check out this Amazon India deal: ${product.price}${mrpPart}. Tap to view directly on Amazon.in via WorldNewzs.`
      : `Tap to view this Amazon India product deal directly on Amazon.in via WorldNewzs.`;
    const shortCanonical = `https://worldnewzs.in/p/${asin}`;
    const ogImage =
      product.imageUrl ||
      `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_SX500_.jpg`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, max-age=0');

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${escapeHtml(ogTitle)}</title>
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="WorldNewzs Deals on Amazon.in" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(ogDesc)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:url" content="${escapeHtml(shortCanonical)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(destinationUrl)}" />
</head>
<body>
  <p>Redirecting to Amazon.in... <a href="${escapeHtml(destinationUrl)}" rel="nofollow sponsored">Click here if not redirected</a>.</p>
  <script>window.location.replace(${JSON.stringify(destinationUrl)});</script>
</body>
</html>`;

    return res.status(200).send(html);
  }

  // Human browsers & all other clients: instant HTTP 302 to exact Amazon affiliate URL.
  // Private Cache-Control avoids CDN cache poisoning with social crawler responses.
  res.setHeader(
    'Cache-Control',
    product.fromCatalog
      ? 'private, max-age=60, no-transform'
      : 'private, no-cache, no-store, max-age=0'
  );
  res.setHeader('Location', destinationUrl);
  return res.status(302).end();
}
