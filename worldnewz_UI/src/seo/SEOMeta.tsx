import { Helmet } from 'react-helmet-async';

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
const DEFAULT_DESCRIPTION = 'Stay updated with the latest breaking news in sports, business, technology, health, entertainment, and world events.';

const DEFAULTS: SEOMetaProps = {
  title: 'WorldNewzs – Your World, Your News',
  description: DEFAULT_DESCRIPTION,
  keywords: ['news', 'breaking news', 'world news', 'latest headlines', 'WorldNewzs'],
  ogType: 'website',
  ogImage: DEFAULT_OG,
};

export const SEOMeta = (props: SEOMetaProps) => {
  const p = { ...DEFAULTS, ...props };
  const baseTitle = p.title || DEFAULTS.title || SITE_NAME;
  const fullTitle = baseTitle === DEFAULTS.title ? baseTitle : `${baseTitle} | ${SITE_NAME}`;
  const canonical = p.canonical ?? (typeof window !== 'undefined' ? `${SITE_URL}${window.location.pathname.replace(/\/$/, '')}` : SITE_URL);
  const keywordsStr = Array.isArray(p.keywords) ? p.keywords.join(', ') : (p.keywords ?? '');
  const normalizedTitle = fullTitle.replace(/\s+/g, ' ').trim();
  const metaDescription = p.description?.trim() || DEFAULT_DESCRIPTION;
  const metaImage = p.ogImage || DEFAULT_OG;
  const robotsContent = p.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{normalizedTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywordsStr} />
      <meta name="author" content="WorldNewzs Editorial Team" />
      <meta name="language" content="en" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="color-scheme" content="dark light" />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" type="application/rss+xml" title="WorldNewzs RSS Feed" href={`${SITE_URL}/rss/discover`} />
      {p.noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content={robotsContent} />
      )}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={normalizedTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={p.ogType!} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:alt" content={normalizedTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@WorldNewzs" />
      <meta name="twitter:creator" content="@WorldNewzs" />
      <meta name="twitter:title" content={normalizedTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {p.ogType === 'article' && p.articlePublishedTime && (
        <meta property="article:published_time" content={p.articlePublishedTime} />
      )}
      {p.ogType === 'article' && (p.articleModifiedTime || p.articlePublishedTime) && (
        <meta property="article:modified_time" content={p.articleModifiedTime || p.articlePublishedTime} />
      )}
      {p.ogType === 'article' && p.articleSection && (
        <meta property="article:section" content={p.articleSection} />
      )}
      {p.ogType === 'article' && (
        <meta property="article:publisher" content="https://www.facebook.com/profile.php?id=61589266599006" />
      )}

      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="theme-color" content="#0f172a" />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
    </Helmet>
  );
};
