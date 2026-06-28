import React from "react";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LaptopIcon from "@mui/icons-material/Laptop";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import ScienceIcon from "@mui/icons-material/Science";
import SelfImprovementIcon from "@mui/icons-material/SelfImprovement";
import SchoolIcon from "@mui/icons-material/School";
import RateReviewIcon from "@mui/icons-material/RateReview";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import PodcastsIcon from "@mui/icons-material/Podcasts";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import FlightIcon from "@mui/icons-material/Flight";
import MovieIcon from "@mui/icons-material/Movie";
import ExploreIcon from "@mui/icons-material/Explore";

export interface CategoryConfig {
  color: string;
  icon: React.ReactNode;
  name: string;
}

export const getCategoryConfig = (category?: string): CategoryConfig => {
  const cat = (category || '').toLowerCase().trim();
  
  if (cat.includes('politics') || cat.includes('government') || cat.includes('election') || cat.includes('policy')) {
    return { color: '#0d6efd', icon: <AccountBalanceIcon fontSize="inherit" />, name: 'Politics' };
  }
  if (cat.includes('tech') || cat.includes('software') || cat.includes('gadget') || cat.includes('computer')) {
    return { color: '#2196f3', icon: <LaptopIcon fontSize="inherit" />, name: 'Technology' };
  }
  if (cat.includes('business') || cat.includes('corporate') || cat.includes('market') || cat.includes('startup')) {
    return { color: '#0f172a', icon: <BusinessCenterIcon fontSize="inherit" />, name: 'Business' };
  }
  if ((cat.includes('science') && cat.includes('health')) || cat.includes('science-health') || cat.includes('health & science') || cat.includes('health-science')) {
    return { color: '#10b981', icon: <MedicalServicesIcon fontSize="inherit" />, name: 'Science & Health' };
  }
  if (cat.includes('science') || cat.includes('space') || cat.includes('environment')) {
    return { color: '#4caf50', icon: <ScienceIcon fontSize="inherit" />, name: 'Science' };
  }
  if (cat.includes('health') || cat.includes('medical') || cat.includes('medicine') || cat.includes('fitness')) {
    return { color: '#10b981', icon: <MedicalServicesIcon fontSize="inherit" />, name: 'Science & Health' };
  }
  if (cat.includes('lifestyle') || cat.includes('life style') || cat.includes('fashion') || cat.includes('culture') || cat.includes('wellness') || cat.includes('home')) {
    return { color: '#ec4899', icon: <SelfImprovementIcon fontSize="inherit" />, name: 'Lifestyle' };
  }
  if (cat.includes('education') || cat.includes('school') || cat.includes('learning') || cat.includes('career') || cat.includes('university') || cat.includes('exam')) {
    return { color: '#8b5cf6', icon: <SchoolIcon fontSize="inherit" />, name: 'Education' };
  }
  if (cat.includes('opinion') || cat.includes('editorial') || cat.includes('column') || cat.includes('perspective') || cat.includes('analyse') || cat.includes('analysis')) {
    return { color: '#f59e0b', icon: <RateReviewIcon fontSize="inherit" />, name: 'Opinion' };
  }
  if (cat.includes('trending') || cat.includes('viral') || cat.includes('pop culture') || cat.includes('meme')) {
    return { color: '#ef4444', icon: <WhatshotIcon fontSize="inherit" />, name: 'Trending' };
  }
  if (cat.includes('podcast') || cat.includes('video') || cat.includes('multimedia') || cat.includes('audio') || cat.includes('clip')) {
    return { color: '#d946ef', icon: <PodcastsIcon fontSize="inherit" />, name: 'Podcasts & Videos' };
  }
  if (cat.includes('local') || cat.includes('india') || cat.includes('regional') || cat.includes('hyderabad') || cat.includes('telangana')) {
    return { color: '#06b6d4', icon: <LocationOnIcon fontSize="inherit" />, name: 'Local News' };
  }
  if (cat.includes('sports') || cat.includes('cricket') || cat.includes('football') || cat.includes('game') || cat.includes('match') || cat.includes('soccer')) {
    return { color: '#f44336', icon: <SportsSoccerIcon fontSize="inherit" />, name: 'Sports' };
  }
  if (cat.includes('money') || cat.includes('finance') || cat.includes('stock') || cat.includes('economy')) {
    return { color: '#e91e63', icon: <MonetizationOnIcon fontSize="inherit" />, name: 'Money' };
  }
  if (cat.includes('food') || cat.includes('recipe') || cat.includes('cooking') || cat.includes('restaurant') || cat.includes('dine') || cat.includes('dining')) {
    return { color: '#9c27b0', icon: <RestaurantIcon fontSize="inherit" />, name: 'Food' };
  }
  if (cat.includes('shopping') || cat.includes('store') || cat.includes('retail') || cat.includes('deal') || cat.includes('discount')) {
    return { color: '#00bcd4', icon: <ShoppingBagIcon fontSize="inherit" />, name: 'Shopping' };
  }
  if (cat.includes('travel') || cat.includes('flight') || cat.includes('destination') || cat.includes('hotel') || cat.includes('tourism')) {
    return { color: '#009688', icon: <FlightIcon fontSize="inherit" />, name: 'Travel' };
  }
  if (cat.includes('entertainment') || cat.includes('movie') || cat.includes('music') || cat.includes('celebrity') || cat.includes('showbiz') || cat.includes('cinema')) {
    return { color: '#673ab7', icon: <MovieIcon fontSize="inherit" />, name: 'Entertainment' };
  }
  
  return { color: '#ff9800', icon: <ExploreIcon fontSize="inherit" />, name: 'Discover' };
};
