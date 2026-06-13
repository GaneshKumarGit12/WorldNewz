import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchMoney } from "../api/apiClient";

const Money: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="money"
      title="Money"
      emoji="💵"
      keywords={["money", "finance", "investment", "wealth", "savings", "personal finance", "economy"]}
      fetchApi={fetchMoney}
    />
  );
};

export default Money;
