export const getOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "WorldNewz",
    "url": "https://worldnewz.onrender.com",
    "logo": "https://worldnewz.onrender.com/favicon.svg",
    "description": "WorldNewz – Stay updated with the latest news in sports, business, technology, health, and more."
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
        "name": article.author || "WorldNewz Journalist"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "WorldNewz",
      "logo": {
        "@type": "ImageObject",
        "url": "https://worldnewz.onrender.com/favicon.svg"
      }
    },
    "description": article.description
  };
};
