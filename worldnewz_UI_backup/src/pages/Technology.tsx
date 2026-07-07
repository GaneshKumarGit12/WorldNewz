import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchTechnology } from "../api/apiClient";

const Technology: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="technology"
      title="Technology"
      emoji="💻"
      keywords={["technology", "ai", "gadgets", "software", "cybersecurity", "innovation"]}
      fetchApi={fetchTechnology}
    />
  );
};

export default Technology;
