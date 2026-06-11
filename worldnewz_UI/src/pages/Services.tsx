import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchServices } from "../api/apiClient";

const Services: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="services"
      title="Services"
      emoji="🛠️"
      keywords={["services", "consulting", "utility", "saas", "solutions", "platforms"]}
      fetchApi={fetchServices}
    />
  );
};

export default Services;
