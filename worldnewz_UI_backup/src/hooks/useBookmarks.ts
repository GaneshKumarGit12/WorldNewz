import { useState, useEffect } from "react";
import type { Article } from "../types";

const STORAGE_KEY = "worldnewz_bookmarks";

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Article[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBookmarks(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse bookmarks:", error);
      }
    }
  }, []);

  // Save to localStorage when bookmarks change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = (article: Article) => {
    if (!article.url) return; // Guard against undefined URL
    setBookmarks((prev) => {
      if (prev.some((b) => b.url === article.url)) return prev;
      return [...prev, article];
    });
  };

  const removeBookmark = (url: string | undefined) => {
    if (!url) return; // Guard against undefined URL
    setBookmarks((prev) => prev.filter((b) => b.url !== url));
  };

  const isBookmarked = (url: string | undefined): boolean => {
    if (!url) return false; // Guard against undefined URL
    return bookmarks.some((b) => b.url === url);
  };

  const clearAll = () => {
    setBookmarks([]);
  };

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, clearAll };
};