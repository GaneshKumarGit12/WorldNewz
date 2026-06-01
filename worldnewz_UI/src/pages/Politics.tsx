import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchPolitics } from "../api/apiClient";

const Politics: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="politics"
      title="Politics"
      emoji="🏛️"
      keywords={["politics", "elections", "government", "policy", "news", "world politics"]}
      fetchApi={fetchPolitics}
    />
  );
};

export default Politics;
