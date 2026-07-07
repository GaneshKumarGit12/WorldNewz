import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchLifestyle } from "../api/apiClient";

const Lifestyle: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="lifestyle"
      title="Lifestyle"
      emoji="✨"
      keywords={["lifestyle", "fashion", "culture", "wellness", "home", "growth"]}
      fetchApi={fetchLifestyle}
    />
  );
};

export default Lifestyle;
