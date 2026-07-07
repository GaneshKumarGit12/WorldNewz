import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchEducation } from "../api/apiClient";

const Education: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="education"
      title="Education"
      emoji="🎓"
      keywords={["education", "learning", "students", "exams", "career", "university"]}
      fetchApi={fetchEducation}
    />
  );
};

export default Education;
