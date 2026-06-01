import React from "react";
import CategoryPage from "../components/CategoryPage";
import { fetchPodcastsVideos } from "../api/apiClient";

const PodcastsVideos: React.FC = () => {
  return (
    <CategoryPage
      categoryKey="podcasts-videos"
      title="Podcasts & Videos"
      emoji="🎙️"
      keywords={["podcasts", "videos", "multimedia", "interviews", "explainers", "clips"]}
      fetchApi={fetchPodcastsVideos}
    />
  );
};

export default PodcastsVideos;
