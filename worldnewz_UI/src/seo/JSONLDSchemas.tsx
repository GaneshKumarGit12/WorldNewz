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
