import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchTrending } from "../api/apiClient";

const Trending: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="trending"
      title="Trending"
      emoji="🔥"
      keywords={["trending", "viral", "social media", "buzz", "memes", "pop culture"]}
      fetchApi={fetchTrending}
    />
  );
};

export default Trending;
