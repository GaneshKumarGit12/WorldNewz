export interface Comment {
  id: string;
  articleUrl: string;
  author: string;
  text: string;
  timestamp: string;
  likes: number;
  dislikes: number;
}

export interface ArticleEngagement {
  url: string;
  likes: number;
  dislikes: number;
  comments: Comment[];
  userLiked?: boolean;
  userDisliked?: boolean;
}

export interface Article {
  title: string;
  description?: string;
  url?: string;           // optional, guard in UI
  urlToImage?: string;    // optional
  imageUrl?: string;      // optional
  category?: string;      // optional
  publishedAt?: string;   // optional, guard in UI
  source?: { name: string } | string;
  featured?: boolean;
  engagement?: ArticleEngagement;
  headline?: string;
  summary?: string;
  context?: string;
  socialMediaHook?: string;
  verified?: boolean;
}