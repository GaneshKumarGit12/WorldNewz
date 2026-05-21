import type { Article } from "../types";

export function deduplicateArticles(articles: Article[]): Article[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  
  return articles.filter(article => {
    if (!article || !article.url) return false;
    
    const url = article.url.trim().toLowerCase();
    
    // Clean and normalize the title to detect duplicate stories with slightly different titles
    const normalizedTitle = (article.headline || article.title || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase()
      .trim();

    if (seenUrls.has(url)) {
      return false;
    }

    if (normalizedTitle && normalizedTitle.length > 10 && seenTitles.has(normalizedTitle)) {
      return false;
    }

    seenUrls.add(url);
    if (normalizedTitle && normalizedTitle.length > 10) {
      seenTitles.add(normalizedTitle);
    }
    
    return true;
  });
}
