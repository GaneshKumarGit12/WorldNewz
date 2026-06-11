import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchGaming } from "../api/apiClient";

const Gaming: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="gaming"
      title="Gaming"
      emoji="🎮"
      keywords={["gaming", "e-sports", "xbox", "playstation", "nintendo", "pc games", "mobile gaming"]}
      fetchApi={fetchGaming}
    />
  );
};

export default Gaming;
