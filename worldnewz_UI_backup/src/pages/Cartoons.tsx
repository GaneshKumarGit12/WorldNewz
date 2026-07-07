import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchCartoons } from "../api/apiClient";

const Cartoons: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="cartoons"
      title="Cartoons"
      emoji="🎨"
      keywords={["cartoon", "anime", "manga", "animation", "disney", "pixar", "comic books"]}
      fetchApi={fetchCartoons}
    />
  );
};

export default Cartoons;
