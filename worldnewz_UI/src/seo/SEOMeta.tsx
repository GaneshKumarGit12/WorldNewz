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
const DEFAULT_OG = 'https://worldnewzs.in/og-image.png'; // Updated to 1200x630px image

const DEFAULTS: SEOMetaProps = {
  title: 'WorldNewzs – Your World, Your News',
  description: 'Stay updated with the latest breaking news in sports, business, technology, health, entertainment and world events.',
  keywords: ['news', 'breaking news', 'world news', 'latest headlines', 'WorldNewzs'],
  ogType: 'website',
  ogImage: DEFAULT_OG,
};

export const SEOMeta = (props: SEOMetaProps) => {
  const p = { ...DEFAULTS, ...props };
  const fullTitle = p.title === DEFAULTS.title ? p.title : `${p.title} | ${SITE_NAME}`;
  const canonical = p.canonical ?? (typeof window !== 'undefined' ? `${SITE_URL}${window.location.pathname.replace(/\/$/, '')}` : SITE_URL);
  const keywordsStr = Array.isArray(p.keywords) ? p.keywords.join(', ') : (p.keywords ?? '');

  return (
    <Helmet prioritizeSeoTags>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={p.description!} />
      <meta name="keywords" content={keywordsStr} />
      <link rel="canonical" href={canonical} />
      {p.noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={p.description!} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={p.ogType!} />
      <meta property="og:image" content={p.ogImage!} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter / X Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@WorldNewzs" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={p.description!} />
      <meta name="twitter:image" content={p.ogImage!} />
      <meta name="author" content="WorldNewzs Editorial Team" />

      {/* Article-specific */}
      {p.ogType === 'article' && p.articlePublishedTime && (
        <meta property="article:published_time" content={p.articlePublishedTime} />
      )}
      {p.ogType === 'article' && (p.articleModifiedTime || p.articlePublishedTime) && (
        <meta property="article:modified_time" content={p.articleModifiedTime || p.articlePublishedTime} />
      )}
      {p.ogType === 'article' && p.articleSection && (
        <meta property="article:section" content={p.articleSection} />
      )}

      {/* Technical */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="theme-color" content="#1a1a2e" />
    </Helmet>
  );
};
