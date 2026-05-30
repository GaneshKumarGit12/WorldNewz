import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://worldnewzs.in';
const SITE_NAME = 'WorldNewzs';
const LOGO_URL = 'https://worldnewzs.in/favicon.svg'; // Fixed fallback URL

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
        }
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
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-800-555-0199",
        "contactType": "customer service"
      },
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
}

export const JSONLDNewsArticle = ({ article }: { article: Article }) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.summary,
      "image": [article.imageUrl],
      "datePublished": article.publishedAt,
      "url": article.url,
      "articleSection": article.category,
      "inLanguage": "en-US",
      "publisher": {
        "@type": "Organization",
        "name": SITE_NAME,
        "logo": { "@type": "ImageObject", "url": LOGO_URL }
      }
    })}</script>
  </Helmet>
);
