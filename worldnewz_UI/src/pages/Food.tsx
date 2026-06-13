import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchFood } from "../api/apiClient";

const Food: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="food"
      title="Food"
      emoji="🍲"
      keywords={["food", "recipe", "cuisine", "cooking", "restaurant", "dining", "nutrition"]}
      fetchApi={fetchFood}
    />
  );
};

export default Food;
