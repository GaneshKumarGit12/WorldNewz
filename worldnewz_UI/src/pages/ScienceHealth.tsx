import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchScienceHealth } from "../api/apiClient";

const ScienceHealth: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="science-health"
      title="Science & Health"
      emoji="🔬"
      keywords={["science", "health", "space", "environment", "medical", "fitness"]}
      fetchApi={fetchScienceHealth}
    />
  );
};

export default ScienceHealth;
