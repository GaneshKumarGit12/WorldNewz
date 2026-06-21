import { useEffect, useState } from 'react';

interface KeywordData {
  category: string;
  primary: string[];
  longtail: string[];
  trending: string[];
  metaDesc: string;
  date: string;
}

export const useKeywords = (category: string): KeywordData | null => {
  const [data, setData] = useState<KeywordData | null>(null);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://worldnewz.onrender.com/api';
    fetch(`${apiBase}/seo/keywords/${category.toLowerCase()}`)
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then(json => {
        if (!json || !json.primary) {
          throw new Error("Invalid keyword data structure");
        }
        setData({
          category: json.category,
          primary: typeof json.primary === "string" ? JSON.parse(json.primary) : json.primary,
          longtail: typeof json.longtail === "string" ? JSON.parse(json.longtail) : json.longtail,
          trending: typeof json.trending === "string" ? JSON.parse(json.trending) : json.trending,
          metaDesc: json.metaDesc,
          date: json.date
        });
      })
      .catch(err => {
        console.warn(`Failed to fetch SEO keywords for ${category}:`, err.message);
        setData(null);
      });
  }, [category]);

  return data;
};
