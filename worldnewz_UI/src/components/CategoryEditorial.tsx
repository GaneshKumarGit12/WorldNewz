import React from 'react';
import { PoliticsEditorial } from './editorial/PoliticsEditorial';
import { TechnologyEditorial } from './editorial/TechnologyEditorial';
import { BusinessEditorial } from './editorial/BusinessEditorial';
import { ScienceHealthEditorial } from './editorial/ScienceHealthEditorial';
import {
  LifestyleEditorial,
  EducationEditorial,
  OpinionEditorial,
  TrendingEditorial,
  PodcastsVideosEditorial,
  LocalNewsEditorial,
  SportsEditorial
} from './editorial/GroupA_Editorials';
import {
  MoneyEditorial,
  WeatherEditorial,
  ShoppingEditorial,
  TravelEditorial,
  FoodEditorial,
  EntertainmentEditorial,
  ServicesEditorial
} from './editorial/GroupB_Editorials';
import {
  GamingEditorial,
  CartoonsEditorial,
  PollsEditorial,
  BadgeQuizEditorial,
  StocksEditorial,
  MoviesEditorial,
  JobsEditorial
} from './editorial/GroupC_Editorials';

interface CategoryEditorialProps {
  categoryKey: string;
}

export const CategoryEditorial: React.FC<CategoryEditorialProps> = ({ categoryKey }) => {
  const normalizedKey = categoryKey.toLowerCase().trim();

  switch (normalizedKey) {
    case 'politics':
      return <PoliticsEditorial />;
    case 'technology':
      return <TechnologyEditorial />;
    case 'business':
      return <BusinessEditorial />;
    case 'science-health':
    case 'science & health':
      return <ScienceHealthEditorial />;
    case 'lifestyle':
      return <LifestyleEditorial />;
    case 'education':
      return <EducationEditorial />;
    case 'opinion':
      return <OpinionEditorial />;
    case 'trending':
      return <TrendingEditorial />;
    case 'podcasts-videos':
    case 'podcasts & videos':
      return <PodcastsVideosEditorial />;
    case 'local-news':
    case 'local news':
      return <LocalNewsEditorial />;
    case 'sports':
      return <SportsEditorial />;
    case 'money':
      return <MoneyEditorial />;
    case 'weather':
      return <WeatherEditorial />;
    case 'shopping':
    case 'deals':
    case 'amazon products':
      return <ShoppingEditorial />;
    case 'travel':
      return <TravelEditorial />;
    case 'food':
      return <FoodEditorial />;
    case 'entertainment':
      return <EntertainmentEditorial />;
    case 'services':
      return <ServicesEditorial />;
    case 'gaming':
      return <GamingEditorial />;
    case 'cartoons':
      return <CartoonsEditorial />;
    case 'polls':
      return <PollsEditorial />;
    case 'badge-quiz':
    case 'badge quiz':
    case 'quiz':
      return <BadgeQuizEditorial />;
    case 'stocks':
      return <StocksEditorial />;
    case 'movies':
      return <MoviesEditorial />;
    case 'jobs':
      return <JobsEditorial />;
    default:
      return null;
  }
};

export default CategoryEditorial;
