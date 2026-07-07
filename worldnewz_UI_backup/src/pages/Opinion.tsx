import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchOpinion } from "../api/apiClient";

const Opinion: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="opinion"
      title="Opinion"
      emoji="✍️"
      keywords={["opinion", "editorial", "column", "perspectives", "analysis"]}
      fetchApi={fetchOpinion}
    />
  );
};

export default Opinion;
