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
}