import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchShopping } from "../api/apiClient";

const Shopping: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="shopping"
      title="Shopping"
      emoji="🛍️"
      keywords={["shopping", "deals", "offers", "discounts", "sales", "reviews", "consumer guides"]}
      fetchApi={fetchShopping}
    />
  );
};

export default Shopping;
