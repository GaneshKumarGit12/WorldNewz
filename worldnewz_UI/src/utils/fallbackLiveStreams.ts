import type { LiveStreamItem } from "../api/apiClient";

export const fallbackLiveStreams: Record<string, LiveStreamItem> = {
  politics: {
    videoId: "9Auq9mYxFEE",
    title: "Sky News Live: Breaking World & Politics News 24/7",
    channelTitle: "Sky News",
    description: "Watch Sky News live for uninterrupted global, political, and world breaking news coverage.",
    thumbnailUrl: "https://i.ytimg.com/vi/9Auq9mYxFEE/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/9Auq9mYxFEE?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
    category: "politics",
    isLive: true,
  },
  technology: {
    videoId: "_yK2NfH_t6M",
    title: "Tech Live: AI Innovations, Gadget Drops & Digital Trends",
    channelTitle: "Tech Today Live",
    description: "Real-time coverage of technology breakthroughs, gadget launches, and artificial intelligence developments.",
    thumbnailUrl: "https://i.ytimg.com/vi/_yK2NfH_t6M/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/_yK2NfH_t6M?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
    category: "technology",
    isLive: true,
  },
  business: {
    videoId: "dp8PhLsUcFE",
    title: "Bloomberg Live: Global Markets, Economy & Business News",
    channelTitle: "Bloomberg Television",
    description: "Live global business news, stock market updates, economic analysis, and financial insights.",
    thumbnailUrl: "https://i.ytimg.com/vi/dp8PhLsUcFE/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/dp8PhLsUcFE?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
    category: "business",
    isLive: true,
  },
  "science-health": {
    videoId: "21X5lGlDOfg",
    title: "NASA Live: Earth Views, Space Station & Cosmic Discoveries",
    channelTitle: "NASA",
    description: "Official NASA Live stream showcasing real-time views from the International Space Station and scientific updates.",
    thumbnailUrl: "https://i.ytimg.com/vi/21X5lGlDOfg/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/21X5lGlDOfg?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
    category: "science-health",
    isLive: true,
  },
  sports: {
    videoId: "vQK_p7x9bC0",
    title: "Sky Sports News Live: Breaking Scores, Transfers & Match Analysis",
    channelTitle: "Sky Sports News",
    description: "Live sports news, latest football transfer updates, match reports, and press conferences.",
    thumbnailUrl: "https://i.ytimg.com/vi/vQK_p7x9bC0/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/vQK_p7x9bC0?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
    category: "sports",
    isLive: true,
  },
  entertainment: {
    videoId: "9Auq9mYxFEE",
    title: "Entertainment & Culture Live: Breaking Headlines & Spotlight",
    channelTitle: "Live Spotlight Broadcast",
    description: "Live news, cinema updates, entertainment features, and celebrity interviews.",
    thumbnailUrl: "https://i.ytimg.com/vi/9Auq9mYxFEE/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/9Auq9mYxFEE?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
    category: "entertainment",
    isLive: true,
  },
  general: {
    videoId: "9Auq9mYxFEE",
    title: "WorldNewzs Live: Global Breaking News & 24/7 Coverage",
    channelTitle: "World Newz Live Broadcast",
    description: "Continuous live breaking news reporting, international affairs, and instant global updates.",
    thumbnailUrl: "https://i.ytimg.com/vi/9Auq9mYxFEE/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/9Auq9mYxFEE?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0",
    category: "general",
    isLive: true,
  },
};

export const getFallbackLiveStream = (category?: string): LiveStreamItem => {
  if (!category) return fallbackLiveStreams.general;
  const cat = category.toLowerCase().trim();
  if (cat.includes("politic") || cat.includes("world") || cat.includes("opinion")) return fallbackLiveStreams.politics;
  if (cat.includes("tech")) return fallbackLiveStreams.technology;
  if (cat.includes("biz") || cat.includes("business") || cat.includes("stock") || cat.includes("money")) return fallbackLiveStreams.business;
  if (cat.includes("sci") || cat.includes("health") || cat.includes("space") || cat.includes("weather")) return fallbackLiveStreams["science-health"];
  if (cat.includes("sport")) return fallbackLiveStreams.sports;
  if (cat.includes("entertain") || cat.includes("movie") || cat.includes("lifestyle") || cat.includes("travel") || cat.includes("food")) return fallbackLiveStreams.entertainment;
  return fallbackLiveStreams.general;
};
