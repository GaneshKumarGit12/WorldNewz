import type { Article } from "../types";

export const fallbackDiscoverArticles: Article[] = [
  // 1. TECHNOLOGY
  {
    title: "Global Clean Energy Investments Surge to Record $1.8 Trillion Amid Accelerated Solar and Wind Expansion",
    description: "International energy agencies report unprecedented capital deployment into renewable infrastructure, driven by technological breakthroughs in grid-scale battery storage and policy incentives across North America, Europe, and Asia.",
    summary: "The International Energy Agency (IEA) confirmed that global investment in clean energy technologies reached an all-time high of $1.8 trillion in the past twelve months. Solar photovoltaic installations and offshore wind farms accounted for over 65% of all new electricity generation capacity added worldwide.",
    url: "https://worldnewzs.in/technology/global-clean-energy-investments-surge",
    imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    source: { id: "tech-desk", name: "Technology" },
    category: "Technology",
  },
  {
    title: "Frontier Quantum Computing Benchmarks Demonstrate Practical Error Correction at Scale",
    description: "Researchers achieve physical qubit coherence milestones, paving the way for fault-tolerant algorithmic execution in cryptography and material sciences.",
    summary: "A breakthrough in topological qubit stabilization has lowered logical error rates by an order of magnitude. Hardware engineers confirm that scalable quantum simulation for molecular drug discovery is now entering practical testing phases.",
    url: "https://worldnewzs.in/technology/frontier-quantum-computing-benchmarks",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    source: { id: "tech-wire", name: "Technology" },
    category: "Technology",
  },

  // 2. BUSINESS & MONEY
  {
    title: "Central Banks Signal Coordinated Approach to Economic Growth and Inflation Moderation",
    description: "Financial policymakers emphasize data-driven rate strategies as core consumer price indices stabilize across major developed and emerging economies.",
    summary: "Top economic officials and central bank governors highlighted emerging stability in global supply chains, noting that core inflation has trended steadily toward target corridors. Growth projections for emerging markets have been revised upward, with tech and green infrastructure driving trade volumes.",
    url: "https://worldnewzs.in/business/central-banks-signal-coordinated-approach",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    source: { id: "business-wire", name: "Business" },
    category: "Business",
  },
  {
    title: "Global Equity Markets Reach New Heights as Tech and Industrial Earnings Outperform Forecasts",
    description: "Resilient consumer spending and enterprise software modernization spur broad market rallies across Wall Street and European exchanges.",
    summary: "Major market indices closed higher this week as corporate balance sheets reflected strong margin resilience and sustained capital expenditures into digital automation infrastructure.",
    url: "https://worldnewzs.in/money/global-equity-markets-reach-new-heights",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    source: { id: "money-desk", name: "Money" },
    category: "Money",
  },

  // 3. SCIENCE & HEALTH
  {
    title: "Breakthrough Genomic Mapping Unveils Targeted Pathways for Precision Oncology Therapies",
    description: "Researchers identify novel cellular checkpoints that enable individualized immunotherapy treatments with minimal side effects for patients.",
    summary: "A global consortium of biomedical researchers has mapped over 100,000 cellular interactions in complex tumors, opening doors for precision medicine tailored to individual genetic profiles. Clinical trials show exceptional response rates across previously treatment-resistant variants.",
    url: "https://worldnewzs.in/science-health/breakthrough-genomic-mapping-precision-oncology",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    source: { id: "health-digest", name: "Science & Health" },
    category: "Science & Health",
  },
  {
    title: "Deep Space Observatory Detects Atmospheric Water Vapor Signatures on Temperate Exoplanet",
    description: "Spectroscopic data confirms volatile composition on Earth-sized world orbiting within habitable star system zone.",
    summary: "Astrophysicists analyzing infrared spectroscopy feeds have detected definitive chemical signatures indicating water vapor and complex cloud formations on exoplanet K2-18b, marking a giant leap for exobiology.",
    url: "https://worldnewzs.in/science-health/deep-space-observatory-atmospheric-signatures",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
    source: { id: "space-desk", name: "Science & Health" },
    category: "Science & Health",
  },

  // 4. POLITICS
  {
    title: "International Diplomatic Summit Concludes with Historic Accord on Cross-Border AI Safety Frameworks",
    description: "Delegates from 45 nations establish standardized audit protocols, open research benchmarks, and ethical guidelines for frontier artificial intelligence models.",
    summary: "The landmark international summit produced a comprehensive accord requiring red-teaming evaluations, watermarking standards for synthetic media, and collaborative incident reporting frameworks for advanced machine intelligence systems.",
    url: "https://worldnewzs.in/politics/international-diplomatic-summit-ai-safety-frameworks",
    imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    source: { id: "world-desk", name: "Politics" },
    category: "Politics",
  },
  {
    title: "Electoral Reform Legislation Passed to Strengthen Transparency and Voter Participation",
    description: "Bipartisan consensus establishes updated auditing mandates, modernized cybersecurity baselines, and expanded ballot access.",
    summary: "Civic governance bodies have codified sweeping election modernization standards, guaranteeing paper-trail verification, encrypted voter registries, and expanded independent observation protocols.",
    url: "https://worldnewzs.in/politics/electoral-reform-legislation-passed",
    imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 170 * 60 * 1000).toISOString(),
    source: { id: "policy-wire", name: "Politics" },
    category: "Politics",
  },

  // 5. TRAVEL & INFRASTRUCTURE
  {
    title: "Next-Generation Electric Rail Corridor Unveiled Connecting Major Industrial Hubs",
    description: "High-speed zero-emission transport network reduces freight transit times by 40% while eliminating millions of tons of annual carbon emissions.",
    summary: "The newly inaugurated 1,200-kilometer dedicated freight and passenger rail corridor features fully automated signaling and regenerative braking systems. It sets a new benchmark for sustainable intercity logistics and passenger transit.",
    url: "https://worldnewzs.in/travel/next-gen-electric-rail-corridor-unveiled",
    imageUrl: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
    source: { id: "transit-watch", name: "Travel" },
    category: "Travel",
  },
  {
    title: "Eco-Tourism Destinations Adopt Zero-Waste Certification to Protect Pristine Marine Habitats",
    description: "Coastal preserves and luxury resorts implement circular resource management and solar-powered desalination facilities.",
    summary: "Sustainable hospitality groups across the Pacific and Mediterranean have instituted rigorous zero-single-use plastics standards and coral reef restoration programs funded through carbon-offset traveler contributions.",
    url: "https://worldnewzs.in/travel/eco-tourism-destinations-zero-waste",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    source: { id: "travel-desk", name: "Travel" },
    category: "Travel",
  },

  // 6. SPORTS
  {
    title: "Championship Tournament Delivers Thrilling Finals with Record-Breaking Global Viewership",
    description: "Spectacular individual performances and tactical masterclasses capture the imagination of millions of sports fans worldwide.",
    summary: "The championship climax concluded with an exhilarating display of athletic mastery, setting all-time broadcast and streaming records across 140 countries. Fans celebrated a historic season highlighted by unprecedented sportsmanship and competitive parity.",
    url: "https://worldnewzs.in/sports/championship-tournament-thrilling-finals",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    source: { id: "sports-live", name: "Sports" },
    category: "Sports",
  },
  {
    title: "Youth Athletics and Community Sports Programs Receive Multimillion-Dollar Modernization Grant",
    description: "New initiatives expand accessible sports facilities, high-performance training hubs, and STEM sports analytics curricula.",
    summary: "Grassroots sports federations announce historic investments in public athletic infrastructure, providing modern equipment and certified coaching programs to empower the next generation of athletic talent.",
    url: "https://worldnewzs.in/sports/youth-athletics-modernization-grant",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 270 * 60 * 1000).toISOString(),
    source: { id: "sports-desk", name: "Sports" },
    category: "Sports",
  },

  // 7. LIFESTYLE
  {
    title: "Urban Green Architecture Redefining Modern Living Spaces with Sustainable Biophilic Design",
    description: "Architects and urban planners incorporate native plant ecosystems, passive cooling ventilation, and natural timber construction into modern high-rises.",
    summary: "Cities worldwide are witnessing a transformation in residential and commercial architecture. Biophilic structures that integrate vertical gardens and energy-positive microgrids are proving to improve resident wellness while slashing urban heat island effects.",
    url: "https://worldnewzs.in/lifestyle/urban-green-architecture-biophilic-design",
    imageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    source: { id: "lifestyle-mag", name: "Lifestyle" },
    category: "Lifestyle",
  },
  {
    title: "Mindfulness and Circadian Architecture: The New Standard for Workplace Wellbeing",
    description: "Forward-thinking workplaces introduce natural circadian lighting, acoustic retreat pods, and active wellness programming.",
    summary: "Studies show a direct link between biophilic interior ergonomics and reduced cognitive fatigue. Contemporary workplace designers are prioritizing natural air circulation, acoustic tranquility, and movement-friendly workspaces.",
    url: "https://worldnewzs.in/lifestyle/mindfulness-circadian-architecture-wellbeing",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
    source: { id: "wellness-today", name: "Lifestyle" },
    category: "Lifestyle",
  },
  {
    title: "Minimalist Living and Circular Fashion Take Center Stage in Urban Culture",
    description: "Consumers embrace modular wardrobes, verified garment repair cooperatives, and regenerative organic fabrics.",
    summary: "Sustainable lifestyle choices are moving into mainstream consumer consciousness, with textile longevity indexes and circular upcycling programs reshaping modern apparel standards.",
    url: "https://worldnewzs.in/lifestyle/minimalist-living-circular-fashion",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 340 * 60 * 1000).toISOString(),
    source: { id: "style-desk", name: "Lifestyle" },
    category: "Lifestyle",
  },

  // 8. FOOD
  {
    title: "Culinary Renaissance: Ancient Grains and Heritage Farming Revitalize Modern Gastronomy",
    description: "Top chefs and artisanal producers champion nutrient-dense heirloom crops, blending traditional recipes with modern gastronomic techniques.",
    summary: "From millet and farro to heritage wheat varieties, ancient grains are leading a major culinary revival. Farm-to-table restaurants and everyday home cooks are rediscovering sustainable cultivation methods that deliver exceptional flavor and health benefits.",
    url: "https://worldnewzs.in/food/culinary-renaissance-ancient-grains-heritage-farming",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    source: { id: "food-culture", name: "Food" },
    category: "Food",
  },
  {
    title: "Fermentation Science and Plant-Based Innovation Create New Horizons in Fine Dining",
    description: "Culinary laboratories utilize koji cultures and precision botanical extractions to craft complex umami flavors.",
    summary: "Innovative gastronomy pioneers are combining traditional artisanal fermentation wisdom with modern precision temperature control, creating zero-waste culinary menus celebrated by global food critics.",
    url: "https://worldnewzs.in/food/fermentation-science-plant-based-fine-dining",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 380 * 60 * 1000).toISOString(),
    source: { id: "gourmet-desk", name: "Food" },
    category: "Food",
  },

  // 9. ENTERTAINMENT & MOVIES
  {
    title: "International Film Festivals Celebrate Independent Cinema and Groundbreaking Virtual Production",
    description: "Emerging auteur directors leverage real-time LED volume stages to deliver sweeping cinematic epics on independent budgets.",
    summary: "The global cinematic community convenes to celebrate boundary-pushing storytelling, with jury awards highlighting bold thematic vision, innovative spatial sound design, and exceptional ensemble casts.",
    url: "https://worldnewzs.in/entertainment/international-film-festivals-celebrate-indie-cinema",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 400 * 60 * 1000).toISOString(),
    source: { id: "cinema-desk", name: "Entertainment" },
    category: "Entertainment",
  },
  {
    title: "Next-Gen Immersive Audio Formats Transform Live Concerts and Studio Production",
    description: "Acoustic engineers introduce object-based binaural spatial mixing for mainstream streaming platforms and concert venues.",
    summary: "Music producers and audio hardware manufacturers collaborate on spatial acoustic standards that replicate three-dimensional stadium acoustics for everyday headphone listeners.",
    url: "https://worldnewzs.in/entertainment/next-gen-immersive-audio-formats",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    urlToImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 420 * 60 * 1000).toISOString(),
    source: { id: "music-today", name: "Entertainment" },
    category: "Entertainment",
  }
];

export const getCategoryFallbackArticles = (categoryName: string): Article[] => {
  const cat = (categoryName || "").toLowerCase().trim();
  const matched = fallbackDiscoverArticles.filter(a => (a.category || "").toLowerCase().includes(cat));
  
  // If we have 5 or more matched articles, return them
  if (matched.length >= 5) {
    return matched;
  }

  // Otherwise, combine matched with remaining fallback articles to ensure at least 8-10 articles
  const leadUrl = matched[0]?.url;
  const remaining = fallbackDiscoverArticles.filter(a => a.url !== leadUrl && !matched.some(m => m.url === a.url));

  const supplemented = [
    ...matched,
    ...remaining.map((a) => ({
      ...a,
      category: a.category || categoryName,
    }))
  ];

  return supplemented.slice(0, 10);
};
