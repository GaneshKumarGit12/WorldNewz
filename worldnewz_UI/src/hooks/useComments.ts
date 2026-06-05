import { useState, useEffect } from 'react';
import type { ArticleEngagement, Comment } from '../types';

const STORAGE_KEY = 'worldnewz_engagement';

export const useComments = () => {
  const [engagement, setEngagement] = useState<Record<string, ArticleEngagement>>({});

  // Load engagement data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEngagement(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse engagement data:', error);
      }
    }
  }, []);

  // Save engagement data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(engagement));
  }, [engagement]);

  const getEngagement = (articleUrl: string): ArticleEngagement => {
    if (!articleUrl) {
      return { url: '', likes: 0, dislikes: 0, comments: [] };
    }
    return (
      engagement[articleUrl] || {
        url: articleUrl,
        likes: 0,
        dislikes: 0,
        comments: [],
        userLiked: false,
        userDisliked: false,
      }
    );
  };

  const toggleLike = (articleUrl: string) => {
    setEngagement((prev) => {
      const current = prev[articleUrl] || {
        url: articleUrl,
        likes: 0,
        dislikes: 0,
        comments: [],
        userLiked: false,
        userDisliked: false,
      };

      const userLiked = !current.userLiked;
      const likes = userLiked ? current.likes + 1 : Math.max(0, current.likes - 1);
      let userDisliked = current.userDisliked;
      let dislikes = current.dislikes;

      // If user liked, remove dislike
      if (userLiked && userDisliked) {
        userDisliked = false;
        dislikes = Math.max(0, dislikes - 1);
      }

      return {
        ...prev,
        [articleUrl]: {
          ...current,
          likes,
          dislikes,
          userLiked,
          userDisliked,
        },
      };
    });
  };

  const toggleDislike = (articleUrl: string) => {
    setEngagement((prev) => {
      const current = prev[articleUrl] || {
        url: articleUrl,
        likes: 0,
        dislikes: 0,
        comments: [],
        userLiked: false,
        userDisliked: false,
      };

      const userDisliked = !current.userDisliked;
      const dislikes = userDisliked ? current.dislikes + 1 : Math.max(0, current.dislikes - 1);
      let userLiked = current.userLiked;
      let likes = current.likes;

      // If user disliked, remove like
      if (userDisliked && userLiked) {
        userLiked = false;
        likes = Math.max(0, likes - 1);
      }

      return {
        ...prev,
        [articleUrl]: {
          ...current,
          likes,
          dislikes,
          userLiked,
          userDisliked,
        },
      };
    });
  };

  const sanitizeInput = (val: string): string => {
    if (!val) return '';
    // Strip all HTML tags to prevent XSS injection
    return val.replace(/<[^>]*>/g, '').trim();
  };

  const addComment = (articleUrl: string, text: string, author: string = 'Anonymous'): Comment => {
    const sanitizedText = sanitizeInput(text);
    const sanitizedAuthor = sanitizeInput(author) || 'Anonymous';

    const comment: Comment = {
      id: `${Date.now()}-${Math.random()}`,
      articleUrl,
      author: sanitizedAuthor,
      text: sanitizedText,
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
    };

    setEngagement((prev) => {
      const current = prev[articleUrl] || {
        url: articleUrl,
        likes: 0,
        dislikes: 0,
        comments: [],
        userLiked: false,
        userDisliked: false,
      };

      return {
        ...prev,
        [articleUrl]: {
          ...current,
          comments: [comment, ...current.comments],
        },
      };
    });

    return comment;
  };

  const deleteComment = (articleUrl: string, commentId: string) => {
    setEngagement((prev) => {
      const current = prev[articleUrl];
      if (!current) return prev;

      return {
        ...prev,
        [articleUrl]: {
          ...current,
          comments: current.comments.filter((c) => c.id !== commentId),
        },
      };
    });
  };

  const likeComment = (articleUrl: string, commentId: string) => {
    setEngagement((prev) => {
      const current = prev[articleUrl];
      if (!current) return prev;

      return {
        ...prev,
        [articleUrl]: {
          ...current,
          comments: current.comments.map((c) =>
            c.id === commentId ? { ...c, likes: c.likes + 1 } : c
          ),
        },
      };
    });
  };

  const dislikeComment = (articleUrl: string, commentId: string) => {
    setEngagement((prev) => {
      const current = prev[articleUrl];
      if (!current) return prev;

      return {
        ...prev,
        [articleUrl]: {
          ...current,
          comments: current.comments.map((c) =>
            c.id === commentId ? { ...c, dislikes: c.dislikes + 1 } : c
          ),
        },
      };
    });
  };

  const getAllComments = (): Comment[] => {
    return Object.values(engagement).flatMap((e) => e.comments || []);
  };

  return {
    engagement,
    getEngagement,
    toggleLike,
    toggleDislike,
    addComment,
    deleteComment,
    likeComment,
    dislikeComment,
    getAllComments,
  };
};
