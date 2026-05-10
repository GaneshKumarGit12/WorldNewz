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
      .then(r => r.json())
      .then(json => {
        setData({
          category: json.category,
          primary: JSON.parse(json.primary),
          longtail: JSON.parse(json.longtail),
          trending: JSON.parse(json.trending),
          metaDesc: json.metaDesc,
          date: json.date
        });
      })
      .catch(console.error);
  }, [category]);

  return data;
};
