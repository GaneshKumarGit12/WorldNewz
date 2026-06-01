import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchLocalNews } from "../api/apiClient";

const LocalNews: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="local-news"
      title="Local News (India)"
      emoji="📍"
      keywords={["local news", "india", "telangana", "hyderabad", "regional news"]}
      fetchApi={fetchLocalNews}
    />
  );
};

export default LocalNews;
