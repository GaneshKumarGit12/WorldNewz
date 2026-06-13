import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchEntertainment } from "../api/apiClient";

const Entertainment: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="entertainment"
      title="Entertainment"
      emoji="🎬"
      keywords={["entertainment", "movies", "celebrities", "music", "box office", "shows", "reviews"]}
      fetchApi={fetchEntertainment}
    />
  );
};

export default Entertainment;
