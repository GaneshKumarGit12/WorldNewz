export interface Author {
  name: string;
  slug: string;
  title: string;
  avatar: string;
  bio: string;
  specialty: string;
  education: string;
  socials: {
    twitter?: string;
    linkedin?: string;
    email?: string;
  };
}

export const AUTHORS: Record<string, Author> = {
  "marcus-sterling": {
    name: "Marcus Sterling",
    slug: "marcus-sterling",
    title: "Senior Sports Editor",
    avatar: "MS",
    bio: "Marcus Sterling is a veteran sports analyst with over 15 years of experience covering global sports events, from the Olympics to local leagues. Formerly a collegiate track athlete, he specializes in breaking down tactics, sports business, and athletic performance.",
    specialty: "Sports & Athletics",
    education: "B.A. in Sports Journalism, Syracuse University",
    socials: { twitter: "https://x.com/msterling_sports", linkedin: "https://linkedin.com/in/marcus-sterling" }
  },
  "elena-rostova": {
    name: "Elena Rostova",
    slug: "elena-rostova",
    title: "Chief Financial Analyst",
    avatar: "ER",
    bio: "Elena Rostova specializes in macroeconomic trends, stock markets, and personal finance. Formerly a portfolio manager at a major investment firm, she brings rigorous data analysis and clarity to complex economic updates.",
    specialty: "Business & Finance",
    education: "M.S. in Economics, London School of Economics",
    socials: { twitter: "https://x.com/erostova_finance", linkedin: "https://linkedin.com/in/elena-rostova" }
  },
  "aris-thorne": {
    name: "Dr. Aris Thorne",
    slug: "aris-thorne",
    title: "Technology & AI Correspondent",
    avatar: "AT",
    bio: "Dr. Aris Thorne covers emerging tech, artificial intelligence, cybersecurity, and consumer electronics. With a background in computer engineering, he writes in-depth analyses on how tech policy and innovation shape our everyday lives.",
    specialty: "Technology & Artificial Intelligence",
    education: "Ph.D. in Computer Science, Stanford University",
    socials: { twitter: "https://x.com/aris_tech", linkedin: "https://linkedin.com/in/aris-thorne" }
  },
  "clara-vance": {
    name: "Dr. Clara Vance",
    slug: "clara-vance",
    title: "Science & Environment Editor",
    avatar: "CV",
    bio: "Dr. Clara Vance writes about space exploration, astrophysics, climate change, and biotechnology. She makes complex scientific discoveries accessible and engaging for the general public.",
    specialty: "Astrophysics & Environmental Science",
    education: "Ph.D. in Astrophysics, Caltech",
    socials: { twitter: "https://x.com/clara_vance_sci", linkedin: "https://linkedin.com/in/clara-vance" }
  },
  "derrick-storm": {
    name: "Derrick Storm",
    slug: "derrick-storm",
    title: "Lead Meteorologist & Science Writer",
    avatar: "DS",
    bio: "Derrick Storm is a certified meteorologist who has spent a decade reporting on extreme weather events, climate patterns, and earth science. He focuses on safety, forecasting, and ecological sustainability.",
    specialty: "Meteorology & Climate",
    education: "B.S. in Atmospheric Science, Penn State University",
    socials: { twitter: "https://x.com/derrick_storm_wx", linkedin: "https://linkedin.com/in/derrick-storm" }
  },
  "maya-patel": {
    name: "Maya Patel",
    slug: "maya-patel",
    title: "Travel & Culture Editor",
    avatar: "MP",
    bio: "Maya Patel is an award-winning travel writer and photojournalist who has visited over 70 countries. She covers travel trends, eco-tourism, cultural heritage, and hospitality industry news.",
    specialty: "Travel & Global Culture",
    education: "B.A. in Anthropology & Journalism, NYU",
    socials: { twitter: "https://x.com/maya_travels", linkedin: "https://linkedin.com/in/maya-patel" }
  },
  "julian-vance": {
    name: "Chef Julian Vance",
    slug: "julian-vance",
    title: "Food Critic & Culinary Writer",
    avatar: "JV",
    bio: "Julian Vance is a former executive chef turned food journalist. He reviews restaurants, covers food industry trends, and writes about culinary arts, agricultural sustainability, and nutrition.",
    specialty: "Culinary Arts & Food Industry",
    education: "A.S. in Culinary Arts, Culinary Institute of America",
    socials: { twitter: "https://x.com/chef_julian_vance", linkedin: "https://linkedin.com/in/julian-vance" }
  },
  "chloe-devereaux": {
    name: "Chloe Devereaux",
    slug: "chloe-devereaux",
    title: "Entertainment & Culture Critic",
    avatar: "CD",
    bio: "Chloe Devereaux covers the film, television, music, and pop culture beats. She has written extensively for major trade publications and specializes in media criticism and celebrity profiles.",
    specialty: "Entertainment & Performing Arts",
    education: "M.A. in Media Studies, USC",
    socials: { twitter: "https://x.com/chloe_devereaux", linkedin: "https://linkedin.com/in/chloe-devereaux" }
  },
  "ganesh-kumar": {
    name: "Ganesh Kumar",
    slug: "ganesh-kumar",
    title: "Editor-in-Chief & Founder",
    avatar: "GK",
    bio: "Ganesh Kumar is the founder and Editor-in-Chief of WorldNewzs. With a passion for transparent news curation, he oversees the editorial guidelines and ensures every aggregated briefing meets high standards of factuality and neutrality.",
    specialty: "Editorial Oversight & Curation",
    education: "B.S. in Computer Science & Journalism, Osmania University",
    socials: { twitter: "https://x.com/ganeshkumard1", linkedin: "https://linkedin.com/in/ganesh-kumar-devarasetty-b4743621/" }
  }
};

export const getAuthorForCategory = (category?: string): Author => {
  const cat = (category || "").toLowerCase().trim();
  switch (cat) {
    case "sports":
      return AUTHORS["marcus-sterling"];
    case "business":
    case "money":
    case "finance":
      return AUTHORS["elena-rostova"];
    case "tech":
    case "technology":
      return AUTHORS["aris-thorne"];
    case "science":
      return AUTHORS["clara-vance"];
    case "weather":
      return AUTHORS["derrick-storm"];
    case "travel":
      return AUTHORS["maya-patel"];
    case "food":
      return AUTHORS["julian-vance"];
    case "entertainment":
      return AUTHORS["chloe-devereaux"];
    default:
      return AUTHORS["ganesh-kumar"];
  }
};
