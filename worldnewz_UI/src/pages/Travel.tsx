import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchTravel } from "../api/apiClient";

const Travel: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="travel"
      title="Travel"
      emoji="✈️"
      keywords={["travel", "tourism", "vacation", "hotels", "flights", "destinations", "guides"]}
      fetchApi={fetchTravel}
    />
  );
};

export default Travel;
