export const getOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "WorldNewzs",
    "url": "https://worldnewzs.in",
    "logo": "https://worldnewzs.in/favicon.svg",
    "description": "WorldNewzs – Stay updated with the latest news in sports, business, technology, health, and more."
  };
};

export const getArticleSchema = (article: { title: string; description: string; url: string; imageUrl: string; publishedAt: string; author?: string; }) => {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.imageUrl],
    "datePublished": article.publishedAt,
    "dateModified": article.publishedAt,
    "author": [{
        "@type": "Person",
        "name": article.author || "WorldNewzs Journalist"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "WorldNewzs",
      "logo": {
        "@type": "ImageObject",
        "url": "https://worldnewzs.in/favicon.svg"
      }
    },
    "description": article.description
  };
};
