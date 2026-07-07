const KEYWORDS = [
  "Technology innovations",
  "Global finance and economy",
  "Climate change and sustainability",
  "Artificial Intelligence updates",
  "Health and wellness trends",
  "Space exploration",
  "Global elections",
  "Electric vehicles",
  "Cybersecurity news",
  "Renewable energy",
  "Startups and entrepreneurship",
  "Stock market trends",
  "Sports highlights",
  "Entertainment and culture",
  "Travel and tourism"
];

export const getDailyKeyword = (): string => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  return KEYWORDS[dayOfYear % KEYWORDS.length];
};
