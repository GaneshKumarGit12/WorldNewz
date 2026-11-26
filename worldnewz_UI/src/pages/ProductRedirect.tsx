import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button, Container } from '@mui/material';
import { SEOMeta } from '../seo/SEOMeta';

const ASIN_REGEX = /^[A-Z0-9]{10}$/;
const RENDER_API_BASE = 'https://worldnewz.onrender.com';
const DEFAULT_ASSOCIATE_TAG = 'ganeshd12-21';
const DEFAULT_LINK_ID = '309384296fe1c1e72569a81c50402f7a';
const ALLOWED_AMAZON_HOSTS = new Set(['amazon.in', 'www.amazon.in', 'amzn.to', 'amzn.in']);

function buildFallbackAmazonUrl(asin: string): string {
  return `https://www.amazon.in/dp/${asin}?tag=${encodeURIComponent(
    DEFAULT_ASSOCIATE_TAG
  )}&linkCode=ll2&linkId=${encodeURIComponent(DEFAULT_LINK_ID)}&ref_=as_li_ss_tl`;
}

function sanitizeAmazonUrl(rawUrl: string | undefined, asin: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return buildFallbackAmazonUrl(asin);
  }
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || !ALLOWED_AMAZON_HOSTS.has(host)) {
      return buildFallbackAmazonUrl(asin);
    }
    if (host.endsWith('amazon.in') && !parsed.searchParams.has('tag')) {
      parsed.searchParams.set('tag', DEFAULT_ASSOCIATE_TAG);
      return parsed.toString();
    }
    return rawUrl.trim();
  } catch {
    return buildFallbackAmazonUrl(asin);
  }
}

const ProductRedirect: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const asin = String(code || '').trim().toUpperCase();
  const isValidAsin = ASIN_REGEX.test(asin);
  const [targetUrl, setTargetUrl] = useState<string>(
    isValidAsin ? buildFallbackAmazonUrl(asin) : 'https://worldnewzs.in/amazon-products'
  );

  useEffect(() => {
    if (!isValidAsin) {
      window.location.replace('/amazon-products');
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2000);

    (async () => {
      let destination = buildFallbackAmazonUrl(asin);
      try {
        const res = await fetch(
          `${RENDER_API_BASE}/api/amazonproducts?search=${encodeURIComponent(asin)}&pageSize=5`,
          { signal: controller.signal, headers: { Accept: 'application/json' } }
        );
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.products)
              ? data.products
              : [];
          const match = list.find(
            (p: { asin?: string }) => String(p?.asin || '').trim().toUpperCase() === asin
          );
          if (match) {
            destination = sanitizeAmazonUrl(match.productUrl || match.dealUrl, asin);
          }
        }
      } catch {
        // Fallback affiliate URL already prepared above
      } finally {
        window.clearTimeout(timer);
      }

      if (!cancelled) {
        setTargetUrl(destination);
        window.location.replace(destination);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [asin, isValidAsin]);

  return (
    <>
      <SEOMeta
        title="Redirecting to Amazon.in Deal"
        description="Redirecting you to the verified Amazon.in product deal."
        noIndex={true}
      />
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center', minHeight: '60vh' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Redirecting to Amazon.in...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Taking you directly to the verified deal page.
          </Typography>
          <Button
            variant="contained"
            href={targetUrl}
            rel="nofollow sponsored noopener noreferrer"
            sx={{ textTransform: 'none', fontWeight: 600, mt: 1 }}
          >
            Continue to Amazon.in
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default ProductRedirect;
