import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchBusiness } from "../api/apiClient";

const Business: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="business"
      title="Business"
      emoji="💼"
      keywords={["business", "market", "trends", "startups", "corporate", "stocks"]}
      fetchApi={fetchBusiness}
    />
  );
};

export default Business;
