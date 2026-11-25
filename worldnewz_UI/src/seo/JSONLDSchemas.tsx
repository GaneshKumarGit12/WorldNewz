import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://worldnewzs.in';
const SITE_NAME = 'WorldNewzs';
const LOGO_URL = 'https://worldnewzs.in/logo.svg'; // Updated to official logo svg

/* ── WebSite schema (inject in App root, once) ── */
export const JSONLDWebSite = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": SITE_URL,
      "description": "Breaking news in sports, business, technology, health, and world events.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${SITE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": SITE_NAME,
        "logo": {
          "@type": "ImageObject",
          "url": LOGO_URL
        },
        "sameAs": [
          "https://www.facebook.com/profile.php?id=61589266599006",
          "https://x.com/ganeshkumard1",
          "https://www.youtube.com/@ganeshkumar56",
          "https://www.linkedin.com/in/ganesh-kumar-devarasetty-b4743621/recent-activity/all/",
          "https://www.instagram.com/ganeshkumard12/"
        ]
      }
    })}</script>
  </Helmet>
);

/* ── Organization schema (inject in App root, once) ── */
export const JSONLDOrganization = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": SITE_NAME,
      "url": SITE_URL,
      "logo": LOGO_URL,
      "description": "Multi-category news aggregator with original editorial analysis and verified reporting",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "url": `${SITE_URL}/contact`,
        "availableLanguage": ["English", "Hindi"]
      },
      "publisher": {
        "@type": "Organization",
        "name": SITE_NAME,
        "url": SITE_URL
      },
      "mainEntity": {
        "@type": "NewsMediaOrganization",
        "name": SITE_NAME,
        "url": SITE_URL,
        "logo": LOGO_URL,
        "description": "Breaking news aggregator with original editorial analysis across sports, business, technology, health, and world events",
        "foundingDate": "2024-01-01",
        "knowsAbout": ["World News", "Technology", "Business", "Sports", "Politics", "Science & Health"]
      },
      "hasPart": [
        {
          "@type": "WebPage",
          "name": "Editorial Briefings",
          "url": `${SITE_URL}/editorial-briefings`,
          "description": "Original editorial analysis synthesized from multiple credible sources"
        },
        {
          "@type": "WebPage",
          "name": "Editorial Guidelines",
          "url": `${SITE_URL}/editorial-guidelines`,
          "description": "Comprehensive editorial standards covering source verification, content originality, and factual accuracy"
        }
      ],
      "sameAs": [
        "https://www.facebook.com/profile.php?id=61589266599006",
        "https://x.com/ganeshkumard1",
        "https://www.youtube.com/@ganeshkumar56",
        "https://www.linkedin.com/in/ganesh-kumar-devarasetty-b4743621/recent-activity/all/",
        "https://www.instagram.com/ganeshkumard12/"
      ]
    })}</script>
  </Helmet>
);

/* ── BreadcrumbList schema ── */
interface Crumb { name: string; url: string; }
export const JSONLDBreadcrumb = ({ crumbs }: { crumbs: Crumb[] }) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": crumbs.map((c, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": c.name,
        "item": c.url
      }))
    })}</script>
  </Helmet>
);

/* ── NewsArticle schema (fallback if needed) ── */
interface Article {
  title: string;
  summary: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  category: string;
  authorName?: string;
  authorSlug?: string;
  dateModified?: string;
}

export const JSONLDNewsArticle = ({ article }: { article: Article }) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.summary,
      "image": [article.imageUrl || "https://worldnewzs.in/og-image.png"],
      "datePublished": article.publishedAt,
      "dateModified": article.dateModified || article.publishedAt,
      "url": article.url,
      "isBasedOn": article.url, // Curator attribution link
      "articleSection": article.category,
      "inLanguage": "en-US",
      "author": {
        "@type": "Person",
        "name": article.authorName || "WorldNewzs Editorial Desk",
        "url": article.authorSlug ? `${SITE_URL}/author/${article.authorSlug}` : `${SITE_URL}/about`
      },
      "publisher": {
        "@type": "Organization",
        "name": SITE_NAME,
        "logo": { "@type": "ImageObject", "url": LOGO_URL },
        "sameAs": [
          "https://www.facebook.com/profile.php?id=61589266599006",
          "https://x.com/ganeshkumard1",
          "https://www.youtube.com/@ganeshkumar56",
          "https://www.linkedin.com/in/ganesh-kumar-devarasetty-b4743621/recent-activity/all/",
          "https://www.instagram.com/ganeshkumard12/"
        ]
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "xpathSelectors": ["//*[@data-announcement]"]
      },
      "mainEntity": {
        "@type": "Article",
        "isPartOf": {
          "@type": "NewsMediaOrganization",
          "name": SITE_NAME,
          "url": SITE_URL
        }
      }
    })}</script>
  </Helmet>
);

/* ── CollectionPage / Hub Schema (for category & entity hubs) ── */
interface ItemListItem {
  title: string;
  url: string;
}

export const JSONLDCollectionPage = ({
  title,
  description,
  url,
  articles
}: {
  title: string;
  description: string;
  url: string;
  articles: ItemListItem[];
}) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": title,
      "description": description,
      "url": url,
      "publisher": {
        "@type": "Organization",
        "name": SITE_NAME,
        "logo": { "@type": "ImageObject", "url": LOGO_URL }
      },
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": articles.length,
        "itemListElement": articles.map((art, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "url": art.url,
          "name": art.title
        }))
      }
    })}</script>
  </Helmet>
);

/* ── FAQPage schema ── */
interface FAQItem {
  question: string;
  answer: string;
}

export const JSONLDFAQPage = ({ faqs }: { faqs: FAQItem[] }) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    })}</script>
  </Helmet>
);

/* ── CollectionPage + ItemList / Product Catalog Schema ── */
function getRollingPriceValidUntil(): string {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return future.toISOString().split('T')[0];
}

export interface ProductSchemaItem {
  asin?: string;
  brand?: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice: number;
  productUrl: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
}

export interface JSONLDProductListProps {
  products: ProductSchemaItem[];
  collectionName?: string;
  collectionDescription?: string;
  canonicalUrl?: string;
}

export const JSONLDProductList = ({
  products,
  collectionName = "Amazon India Deals Hub",
  collectionDescription = "Hand-picked Amazon India flash sales, verified price drops, and daily offers curated by WorldNewzs.",
  canonicalUrl = `${SITE_URL}/amazon-products`,
}: JSONLDProductListProps) => {
  const serializedSchema = useMemo(() => {
    const validUntil = getRollingPriceValidUntil();
    const cappedProducts = products.slice(0, 30);

    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": collectionName,
      "description": collectionDescription,
      "url": canonicalUrl,
      "publisher": {
        "@type": "Organization",
        "name": SITE_NAME,
        "logo": { "@type": "ImageObject", "url": LOGO_URL }
      },
      "mainEntity": {
        "@type": "ItemList",
        "name": collectionName,
        "description": collectionDescription,
        "numberOfItems": cappedProducts.length,
        "itemListElement": cappedProducts.map((prod, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "Product",
            "name": prod.title,
            "description": prod.description || prod.title,
            "image": prod.imageUrl,
            "sku": prod.asin || undefined,
            "brand": prod.brand ? { "@type": "Brand", "name": prod.brand } : undefined,
            "category": prod.category || "Shopping",
            "aggregateRating": prod.rating && prod.rating > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": Number(prod.rating.toFixed(1)),
              "reviewCount": Math.max(1, prod.reviewCount || 100),
              "bestRating": 5,
              "worstRating": 1
            } : undefined,
            "offers": {
              "@type": "Offer",
              "priceCurrency": "INR",
              "price": prod.price,
              "priceValidUntil": validUntil,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "Amazon India"
              },
              "url": prod.productUrl
            }
          }
        }))
      }
    });
  }, [products, collectionName, collectionDescription, canonicalUrl]);

  if (!products || products.length === 0) return null;

  return (
    <Helmet>
      <script type="application/ld+json">{serializedSchema}</script>
    </Helmet>
  );
};

/* ── JobPosting schema (Google for Jobs) ── */
export interface JobPostingSchemaItem {
  title: string;
  description: string;
  companyName: string;
  location: string;
  jobType?: string;
  remote?: boolean;
  url: string;
  datePosted?: string;
}

export const JSONLDJobPosting = ({ job }: { job: JobPostingSchemaItem }) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description,
      "datePosted": job.datePosted || new Date().toISOString(),
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.companyName,
        "sameAs": SITE_URL
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.location || "Remote",
          "addressCountry": "US"
        }
      },
      "applicantLocationRequirements": job.remote ? {
        "@type": "Country",
        "name": "Worldwide"
      } : undefined,
      "jobLocationType": job.remote ? "TELECOMMUTE" : undefined,
      "employmentType": job.jobType ? job.jobType.toUpperCase().replace(/-/g, '_') : "FULL_TIME",
      "url": job.url,
      "directApply": true
    })}</script>
  </Helmet>
);

