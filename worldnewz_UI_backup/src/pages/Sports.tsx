import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchSports } from "../api/apiClient";

const Sports: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="sports"
      title="Sports"
      emoji="⚽"
      keywords={["sports", "football", "cricket", "basketball", "tennis", "latest sports news", "scores", "athletics"]}
      fetchApi={fetchSports}
    />
  );
};

export default Sports;