export interface NavLink {
  label: string;
  path: string;
  highlight?: boolean;
  highlightColor?: string;
  badge?: string;
}

export const primaryNavLinks: NavLink[] = [
  { label: "Discover", path: "/" },
  { label: "Politics", path: "/politics" },
  { label: "Technology", path: "/technology" },
  { label: "Business", path: "/business" },
  { label: "Trending Videos 🎥", path: "/trending-videos", highlight: true, highlightColor: "linear-gradient(135deg, #ef4444, #b91c1c)", badge: "HOT" },
  { label: "Polls 🗳️", path: "/polls", highlight: true, highlightColor: "linear-gradient(135deg, #00c6ff, #0072ff)" },
  { label: "GK Quiz 🏆", path: "/badge-quiz", highlight: true, highlightColor: "linear-gradient(135deg, #f857a6, #ff5858)" },
  { label: "MoviesDB 🎬", path: "/movies", highlight: true, highlightColor: "linear-gradient(135deg, #e11d48, #be123c)" },
  { label: "Deals 🛍️", path: "/amazon-products", highlight: true, highlightColor: "linear-gradient(135deg, #ff8a00, #ff5500)" },
  { label: "Jobs 💼", path: "/jobs", highlight: true, highlightColor: "linear-gradient(135deg, #10b981, #059669)" },
  { label: "DVCubie2026 🐍", path: "/games/dvcubie2026", highlight: true, highlightColor: "linear-gradient(135deg, #a855f7, #ec4899)", badge: "NEW" },
  { label: "Book Cab 🚗", path: "/transportation", highlight: true, highlightColor: "linear-gradient(135deg, #f59e0b, #d97706)", badge: "NEW" },
  { label: "NewsBot 🤖", path: "/chatbot", highlight: true, highlightColor: "linear-gradient(135deg, #3b82f6, #1d4ed8)", badge: "NEW" },
];

export const secondaryNavLinks: NavLink[] = [
  { label: "Science & Health", path: "/science-health" },
  { label: "Local News (India)", path: "/local-news" },
  { label: "Sports", path: "/sports" },
  { label: "Money", path: "/money" },
  { label: "Weather", path: "/weather" },
  { label: "Shopping", path: "/shopping" },
  { label: "Travel", path: "/travel" },
  { label: "Food", path: "/food" },
  { label: "Entertainment", path: "/entertainment" },
  { label: "Services", path: "/services" },
  { label: "Gaming", path: "/gaming" },
  { label: "Cartoons", path: "/cartoons" },
  { label: "Stocks", path: "/stocks" },
  { label: "Lifestyle", path: "/lifestyle" },
  { label: "Education", path: "/education" },
  { label: "Opinion", path: "/opinion" },
  { label: "Trending", path: "/trending" },
  { label: "Podcasts & Videos", path: "/podcasts-videos" },
  { label: "Editorial Briefings", path: "/editorial-briefings" },
];

export const categories: string[] = [
  "general", 
  "politics", 
  "technology", 
  "business", 
  "science & health", 
  "lifestyle", 
  "education", 
  "opinion", 
  "trending", 
  "podcasts & videos",
  "local news", 
  "sports", 
  "money", 
  "weather", 
  "shopping", 
  "travel", 
  "food", 
  "entertainment",
  "services",
  "gaming",
  "cartoons",
  "polls",
  "badge quiz",
  "stocks",
  "movies",
  "jobs",
  "transportation",
  "chatbot"
];

export const getCategoryPath = (cat: string): string => {
  switch (cat.toLowerCase().trim()) {
    case "general": return "/";
    case "politics": return "/politics";
    case "technology": return "/technology";
    case "business": return "/business";
    case "science & health": return "/science-health";
    case "lifestyle": return "/lifestyle";
    case "education": return "/education";
    case "opinion": return "/opinion";
    case "trending": return "/trending";
    case "podcasts & videos": return "/podcasts-videos";
    case "local news": return "/local-news";
    case "sports": return "/sports";
    case "money": return "/money";
    case "weather": return "/weather";
    case "shopping": return "/shopping";
    case "travel": return "/travel";
    case "food": return "/food";
    case "entertainment": return "/entertainment";
    case "services": return "/services";
    case "gaming": return "/gaming";
    case "cartoons": return "/cartoons";
    case "polls": return "/polls";
    case "badge quiz": return "/badge-quiz";
    case "stocks": return "/stocks";
    case "movies": return "/movies";
    case "deals": return "/amazon-products";
    case "amazon products": return "/amazon-products";
    case "jobs": return "/jobs";
    case "transportation": return "/transportation";
    case "chatbot": return "/chatbot";
    default: return "/";
  }
};
