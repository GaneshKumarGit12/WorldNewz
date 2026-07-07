export interface NavLink {
  label: string;
  path: string;
  highlight?: boolean;
  highlightColor?: string;
  badge?: string;
}

export const newsPillarLinks: NavLink[] = [
  { label: "Discover", path: "/" },
  { label: "Politics", path: "/politics" },
  { label: "Technology", path: "/technology" },
  { label: "Business", path: "/business" },
  { label: "Sports", path: "/sports" },
  { label: "Science & Health", path: "/science-health" },
  { label: "Money", path: "/money" },
  { label: "Local News (India)", path: "/local-news" },
  { label: "Editorial Briefings", path: "/editorial-briefings" },
];

export const lifestylePillarLinks: NavLink[] = [
  { label: "Lifestyle", path: "/lifestyle" },
  { label: "Education", path: "/education" },
  { label: "Travel", path: "/travel" },
  { label: "Food", path: "/food" },
  { label: "Weather ⛅", path: "/weather" },
  { label: "Opinion", path: "/opinion" },
];

export const explorePillarLinks: NavLink[] = [
  { label: "MoviesDB 🎬", path: "/movies" },
  { label: "Cartoons 🧸", path: "/cartoons" },
  { label: "Jobs 💼", path: "/jobs" },
  { label: "Stocks 📈", path: "/stocks" },
  { label: "Book Cab 🚗", path: "/transportation" },
  { label: "Deals 🛍️", path: "/amazon-products" },
  { label: "NewsBot AI 🤖", path: "/chatbot" },
];

export const playPillarLinks: NavLink[] = [
  { label: "Play Games Services 🎮", path: "/play-games", badge: "SPECIAL" },
  { label: "GK Quiz 🏆", path: "/badge-quiz" },
  { label: "Interactive Polls 🗳️", path: "/polls" },
  { label: "DVCubie2026 🐍", path: "/games/dvcubie2026", badge: "NEW" },
  { label: "Gaming 🎮", path: "/gaming" },
  { label: "Trending Videos 🎥", path: "/trending-videos", badge: "HOT" },
  { label: "Podcasts & Videos 🎙️", path: "/podcasts-videos" },
];

// Aliases for backward compatibility
export const coreNewsLinks: NavLink[] = newsPillarLinks.slice(0, 5);
export const exploreLinks: NavLink[] = explorePillarLinks;
export const utilityLinks: NavLink[] = [
  { label: "Weather ⛅", path: "/weather" },
  { label: "Stocks 📈", path: "/stocks" },
  { label: "Jobs 💼", path: "/jobs" },
  { label: "Deals 🛍️", path: "/amazon-products" },
];
export const moreNewsLinks: NavLink[] = [
  ...newsPillarLinks.slice(5),
  ...lifestylePillarLinks
];

// Fallback compatibility variables for legacy imports
export const primaryNavLinks: NavLink[] = [];
export const secondaryNavLinks: NavLink[] = [];


export const categories: string[] = [
  "general", 
  "play games 🎮",
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
    case "play games": return "/play-games";
    case "play games 🎮": return "/play-games";
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
