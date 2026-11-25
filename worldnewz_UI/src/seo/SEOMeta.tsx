import { useEffect } from 'react';

export interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string[] | string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleSection?: string;
  noIndex?: boolean;
}

const SITE_NAME = 'WorldNewzs';
const SITE_URL = 'https://worldnewzs.in';
const DEFAULT_OG = 'https://worldnewzs.in/og-image.png';
const DEFAULT_DESCRIPTION = 'Stay updated with the latest breaking news in sports, business, technology, health, and world events.';
const ARTICLE_PUBLISHER_URL = 'https://www.facebook.com/profile.php?id=61589266599006';

const DEFAULTS: SEOMetaProps = {
  title: 'WorldNewzs – Your World, Your News',
  description: DEFAULT_DESCRIPTION,
  keywords: ['news', 'breaking news', 'world news', 'latest headlines', 'WorldNewzs'],
  ogType: 'website',
  ogImage: DEFAULT_OG,
};

function upsertMetaTag(
  attr: 'name' | 'property',
  key: string,
  content: string,
  extraAttr?: { name: string; value: string }
): void {
  const existing = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (existing) {
    existing.setAttribute('content', content);
    return;
  }
  const el = document.createElement('meta');
  el.setAttribute(attr, key);
  el.setAttribute('content', content);
  el.setAttribute('data-wn-seo', 'true');
  if (extraAttr) {
    el.setAttribute(extraAttr.name, extraAttr.value);
  }
  document.head.appendChild(el);
}

function upsertLinkTag(rel: string, href: string, extraAttrs?: Record<string, string>): void {
  const selector = extraAttrs?.type
    ? `link[rel="${rel}"][type="${extraAttrs.type}"]`
    : `link[rel="${rel}"]`;
  const existing = document.head.querySelector(selector);
  if (existing) {
    existing.setAttribute('href', href);
    return;
  }
  const link = document.createElement('link');
  link.setAttribute('rel', rel);
  link.setAttribute('href', href);
  link.setAttribute('data-wn-seo', 'true');
  if (extraAttrs) {
    for (const [k, v] of Object.entries(extraAttrs)) {
      link.setAttribute(k, v);
    }
  }
  document.head.appendChild(link);
}

export const SEOMeta = (props: SEOMetaProps) => {
  const p = { ...DEFAULTS, ...props };
  const baseTitle = (p.title || DEFAULTS.title || SITE_NAME).trim();
  const hasBrandSuffix = /\bworldnewzs\b/i.test(baseTitle);
  const fullTitle = hasBrandSuffix ? baseTitle : `${baseTitle} | ${SITE_NAME}`;
  const canonical = p.canonical ?? (typeof window !== 'undefined' ? `${SITE_URL}${window.location.pathname.replace(/\/$/, '')}` : SITE_URL);
  const keywordsStr = Array.isArray(p.keywords) ? p.keywords.join(', ') : (p.keywords ?? '');
  const normalizedTitle = fullTitle.replace(/\s+/g, ' ').trim();
  const metaDescription = p.description?.trim() || DEFAULT_DESCRIPTION;
  const metaImage = p.ogImage || DEFAULT_OG;
  const robotsContent = p.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const ogType = p.ogType || 'website';
  const articlePublishedTime = p.articlePublishedTime;
  const articleModifiedTime = p.articleModifiedTime || p.articlePublishedTime;
  const articleSection = p.articleSection;

  // Synchronize singleton <head> tags in place without mounting conflicting React 19 hoisted
  // <Helmet> metadata nodes or removing React-managed DOM elements (prevents removeChild crashes on route unmount).
  useEffect(() => {
    if (typeof document === 'undefined' || !document.head) return;

    document.documentElement.lang = 'en';
    document.title = normalizedTitle;

    upsertMetaTag('name', 'description', metaDescription);
    upsertMetaTag('name', 'keywords', keywordsStr);
    upsertMetaTag('name', 'author', 'WorldNewzs Editorial Team');
    upsertMetaTag('name', 'language', 'en');
    upsertMetaTag('name', 'format-detection', 'telephone=no');
    upsertMetaTag('name', 'color-scheme', 'dark light');
    upsertMetaTag('name', 'robots', robotsContent);
    upsertMetaTag('name', 'theme-color', '#0f172a');
    upsertMetaTag('name', 'apple-mobile-web-app-title', SITE_NAME);

    upsertLinkTag('canonical', canonical);
    upsertLinkTag('alternate', `${SITE_URL}/rss/discover`, {
      type: 'application/rss+xml',
      title: 'WorldNewzs RSS Feed',
    });

    upsertMetaTag('property', 'og:site_name', SITE_NAME);
    upsertMetaTag('property', 'og:title', normalizedTitle);
    upsertMetaTag('property', 'og:description', metaDescription);
    upsertMetaTag('property', 'og:url', canonical);
    upsertMetaTag('property', 'og:type', ogType);
    upsertMetaTag('property', 'og:image', metaImage);
    upsertMetaTag('property', 'og:image:alt', normalizedTitle);
    upsertMetaTag('property', 'og:image:width', '1200');
    upsertMetaTag('property', 'og:image:height', '630');
    upsertMetaTag('property', 'og:locale', 'en_US');

    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:site', '@WorldNewzs');
    upsertMetaTag('name', 'twitter:creator', '@WorldNewzs');
    upsertMetaTag('name', 'twitter:title', normalizedTitle);
    upsertMetaTag('name', 'twitter:description', metaDescription);
    upsertMetaTag('name', 'twitter:image', metaImage);

    // Only remove article-specific tags that we imperatively created (never React-managed nodes)
    const ownArticleTags = document.head.querySelectorAll('meta[data-wn-seo-article="true"]');
    ownArticleTags.forEach((node) => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });

    if (ogType === 'article') {
      const articleMarker = { name: 'data-wn-seo-article', value: 'true' };
      if (articlePublishedTime) {
        upsertMetaTag('property', 'article:published_time', articlePublishedTime, articleMarker);
      }
      if (articleModifiedTime) {
        upsertMetaTag('property', 'article:modified_time', articleModifiedTime, articleMarker);
      }
      if (articleSection) {
        upsertMetaTag('property', 'article:section', articleSection, articleMarker);
      }
      upsertMetaTag('property', 'article:publisher', ARTICLE_PUBLISHER_URL, articleMarker);
    }
  }, [
    normalizedTitle,
    metaDescription,
    keywordsStr,
    robotsContent,
    canonical,
    metaImage,
    ogType,
    articlePublishedTime,
    articleModifiedTime,
    articleSection,
  ]);

  return null;
};
