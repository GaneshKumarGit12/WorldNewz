import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGE_METADATA = {
  'badge-quiz': {
    title: 'Badge Trivia Quiz – Challenge Your Knowledge & Earn Badges',
    description: 'Play the WorldNewzs daily trivia badge quiz! Test your knowledge across world news, sports, business, science, history, and tech to earn coins and unlock mastery badges.',
    keywords: 'trivia quiz, badge quiz, knowledge quiz, daily trivia, earn coins, WorldNewzs quiz, general knowledge',
    canonical: 'https://worldnewzs.in/badge-quiz',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'polls': {
    title: 'Opinion Polls – Vote & Explore Live Public Sentiment',
    description: 'Participate in WorldNewzs daily opinion polls. Cast your vote on sports, geopolitics, economy, and emerging technology, and view real-time voter statistics instantly.',
    keywords: 'opinion polls, public opinion, cast vote, voting polls, daily polls, community sentiment',
    canonical: 'https://worldnewzs.in/polls',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'politics': {
    title: 'Politics News – Global Geopolitics & Policy Updates',
    description: 'Stay updated with global politics, government policies, international diplomacy, election reports, and expert geopolitical analysis on WorldNewzs.',
    keywords: 'politics news, government policy, elections, geopolitical updates, world politics',
    canonical: 'https://worldnewzs.in/politics',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'technology': {
    title: 'Technology News – Artificial Intelligence, Gadgets & Silicon Innovations',
    description: 'Discover Silicon Valley breakthroughs, artificial intelligence developments, smartphone launches, cybersecurity updates, and software reviews on WorldNewzs.',
    keywords: 'tech news, AI advancements, gadget launches, software reviews, cybersecurity, silicon chips',
    canonical: 'https://worldnewzs.in/technology',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'business': {
    title: 'Business News – Financial Markets, Startups & Corporate Mergers',
    description: 'Latest financial news, stock market updates, startup funding, merger announcements, and macroeconomic trends on WorldNewzs.',
    keywords: 'business news, stock market, start-ups, economy, corporate mergers, venture capital',
    canonical: 'https://worldnewzs.in/business',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'science-health': {
    title: 'Science & Health News – Medical Discoveries, Space & Wellness',
    description: 'Stay informed with medical research breakthroughs, public health guidelines, space exploration missions, and climate discoveries on WorldNewzs.',
    keywords: 'science news, medical research, health tips, climate science, space exploration, clinical studies',
    canonical: 'https://worldnewzs.in/science-health',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'sports': {
    title: 'Sports News – Live Scores, Match Results & Tournament Updates',
    description: 'Get real-time sports results, cricket match scores, football league tables, player transfers, and global tournament rankings on WorldNewzs.',
    keywords: 'sports news, cricket scores, football transfer, tennis tournament, sports highlights',
    canonical: 'https://worldnewzs.in/sports',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'money': {
    title: 'Money & Personal Finance – Investment Strategies & Wealth Planning',
    description: 'Learn personal finance management, tax-saving tips, smart investment strategies, mutual funds, and wealth management advice on WorldNewzs.',
    keywords: 'personal finance, investment, tax-saving, wealth management, financial planning',
    canonical: 'https://worldnewzs.in/money',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'weather': {
    title: 'Weather Forecast – Local Meteorological Alerts & Temperature Indices',
    description: 'Check current weather forecasts, severe weather alerts, temperature indices, radar maps, and regional climate reports on WorldNewzs.',
    keywords: 'weather forecast, temperature, climate alerts, local weather, meteorology reports',
    canonical: 'https://worldnewzs.in/weather',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'shopping': {
    title: 'Shopping News – Consumer Trends, Retail Reports & E-Commerce',
    description: 'Find retail market news, consumer buying trends, e-commerce developments, and product guides on WorldNewzs.',
    keywords: 'shopping news, retail trends, e-commerce, consumer reports, buyer guides',
    canonical: 'https://worldnewzs.in/shopping',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'travel': {
    title: 'Travel Guides – Destinations, Flight Advisories & Itineraries',
    description: 'Explore top travel destinations, flight advisories, hotel guides, cultural insights, and budget travel advice on WorldNewzs.',
    keywords: 'travel guide, tourism, budget travel, destination itineraries, flight advisories',
    canonical: 'https://worldnewzs.in/travel',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'food': {
    title: 'Food & Dining – Gourmet Recipes, Kitchen Guides & Nutrition',
    description: 'Browse delicious culinary recipes, cooking techniques, kitchen hacks, dietary science, and honest restaurant reviews on WorldNewzs.',
    keywords: 'cooking recipes, restaurant reviews, food tips, gourmet dining, culinary guides',
    canonical: 'https://worldnewzs.in/food',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'entertainment': {
    title: 'Entertainment News – Cinema, Music Releases & Celebrity Buzz',
    description: 'Keep up with movie releases, celebrity interviews, music chart leaders, television broadcasts, and pop culture highlights on WorldNewzs.',
    keywords: 'entertainment news, movie reviews, celebrity gossip, music charts, television shows',
    canonical: 'https://worldnewzs.in/entertainment',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'services': {
    title: 'Online Services – Utilities, Digital Solutions & Public Tools',
    description: 'Access digital tools, essential utility directories, public services lookup, and productivity software reviews on WorldNewzs.',
    keywords: 'online services, utility lookup, digital tools, productivity platforms',
    canonical: 'https://worldnewzs.in/services',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'gaming': {
    title: 'Gaming News – Video Game Reviews, Esports & Console Updates',
    description: 'Get reviews of new PC, console, and mobile game releases, gaming walkthroughs, and esports tournament highlights on WorldNewzs.',
    keywords: 'gaming news, game reviews, esports, cheats, console releases, walkthroughs',
    canonical: 'https://worldnewzs.in/gaming',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'cartoons': {
    title: 'Cartoons & Comics – Daily Satire, Strips & Illustrations',
    description: 'Daily political cartoons, comic strips, editorial satire, animated features, and light-hearted illustrations on WorldNewzs.',
    keywords: 'comic strips, political cartoons, editorial satire, animations, comic art',
    canonical: 'https://worldnewzs.in/cartoons',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'stocks': {
    title: 'Stock Market Live – Real-Time Indices, Nifty, Sensex & Price Trackers',
    description: 'Live stock market indices updates, price movements, top gainers, losers, sector performance, and market analysis on WorldNewzs.',
    keywords: 'stock prices, live indices, nifty 50, sensex index, stock market tracker, equity news',
    canonical: 'https://worldnewzs.in/stocks',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'about': {
    title: 'About WorldNewzs – Editorial Mission, Standards & Team',
    description: 'Learn about WorldNewzs, our team, our mission, and our editorial guidelines for transparent, factual, and objective news curation.',
    keywords: 'about worldnewzs, news aggregator mission, editorial staff, journalism standards',
    canonical: 'https://worldnewzs.in/about',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'contact': {
    title: 'Contact Us – Get in Touch with WorldNewzs Editorial Desk',
    description: 'Contact the WorldNewzs team. Send us your feedback, report site issues, submit news tips, or explore media partnerships.',
    keywords: 'contact news aggregator, submit feedback, customer service, editorial contact',
    canonical: 'https://worldnewzs.in/contact',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'jobs': {
    title: 'Jobs Board – Explore Career Opportunities & Remote Roles',
    description: 'Explore the latest job listings, career openings, tech opportunities, and remote employment roles on WorldNewzs Jobs.',
    keywords: 'jobs, job search, career opportunities, employment, job openings, remote jobs, tech hiring',
    canonical: 'https://worldnewzs.in/jobs',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'jobs/post-job': {
    title: 'Post a Job – Hire Top Remote & Local Professionals',
    description: 'Submit your job postings to WorldNewzs Jobs board. Reach thousands of active job seekers, developers, designers, and marketers globally.',
    keywords: 'post a job, hire talent, job board posting, recruit remote workers, post jobs free',
    canonical: 'https://worldnewzs.in/jobs/post-job',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'privacy-policy': {
    title: 'Privacy Policy – Data Protection, Cookies & User Rights',
    description: 'WorldNewzs Privacy Policy outlines how we collect, use, and protect your personal information, cookies, and privacy rights under GDPR and CCPA.',
    keywords: 'privacy policy, cookies disclosure, user safety, GDPR compliance, CCPA rights',
    canonical: 'https://worldnewzs.in/privacy-policy',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'terms': {
    title: 'Terms & Conditions – User Agreement & Platform Rules',
    description: 'WorldNewzs Terms and Conditions outline user agreements, code of conduct, acceptable use, and terms of service.',
    keywords: 'terms of service, conditions of use, user agreement, legal policies',
    canonical: 'https://worldnewzs.in/terms',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'lifestyle': {
    title: 'Lifestyle News – Modern Living, Wellness & Fashion Culture',
    description: 'Explore curated articles on modern fashion, cultural shifts, mindful living, home design, and wellness trends on WorldNewzs.',
    keywords: 'lifestyle news, fashion trends, wellness, home design, culture, modern living',
    canonical: 'https://worldnewzs.in/lifestyle',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'education': {
    title: 'Education News – Academic Research, Universities & Career Guidance',
    description: 'Get the latest updates on academic programs, global learning tools, scholarship opportunities, and education policies on WorldNewzs.',
    keywords: 'education news, learning tools, career guidance, university news, academic studies',
    canonical: 'https://worldnewzs.in/education',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'opinion': {
    title: 'Opinion & Editorials – Diverse Perspectives on Global Affairs',
    description: 'Read thought-provoking viewpoints, editorial analysis, column pieces, and expert debates on pressing global events on WorldNewzs.',
    keywords: 'editorial news, opinions, expert analysis, viewpoint columns, political debate',
    canonical: 'https://worldnewzs.in/opinion',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'trending': {
    title: 'Trending News – Viral Stories, Pop Culture & Social Trends',
    description: 'Catch the pulse of the web with viral stories, social media highlights, popular memes, and internet culture updates on WorldNewzs.',
    keywords: 'trending news, viral stories, internet culture, popular trends, social media buzz',
    canonical: 'https://worldnewzs.in/trending',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'podcasts-videos': {
    title: 'Podcasts & Videos – Curated Audio & Visual News Reports',
    description: 'Stream our curated multimedia player featuring news podcasts, video explainers, expert interviews, and documentary clips on WorldNewzs.',
    keywords: 'news podcasts, video interviews, multimedia reports, video explainers, audio news',
    canonical: 'https://worldnewzs.in/podcasts-videos',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'local-news': {
    title: 'Local News – Regional Reporting, Civic Issues & City Events',
    description: 'Stay updated with regional politics, civic developments, municipal infrastructure, and community news on WorldNewzs Local.',
    keywords: 'local news, city reports, regional updates, municipal news, civic reporting',
    canonical: 'https://worldnewzs.in/local-news',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'movies': {
    title: 'Movies Database – Cinema Releases, Reviews & Box Office Ratings',
    description: 'Explore the Movies Database with trending cinema releases, critical film reviews, ratings, cast bios, and box office charts on WorldNewzs.',
    keywords: 'movies database, film reviews, movie ratings, box office trends, cinema releases',
    canonical: 'https://worldnewzs.in/movies',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'transportation': {
    title: 'Transportation – Route Planning, Cab Services & Transit Guides',
    description: 'Check transit configurations, cab listings, commute route timing, and transportation guides on WorldNewzs.',
    keywords: 'transportation routes, cab schedules, commute times, travel transit, public transit',
    canonical: 'https://worldnewzs.in/transportation',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'chatbot': {
    title: 'NewsBot AI Assistant – Real-Time News Search & Verification',
    description: 'Chat with our advanced AI news assistant on WorldNewzs. Ask questions, search verified archives, and get instant factual news summaries.',
    keywords: 'chatbot assistant, AI news bot, ask AI, news summaries, real-time news bot',
    canonical: 'https://worldnewzs.in/chatbot',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'amazon-products': {
    title: 'Deals Hub – Curated Product Savings & Buying Guides',
    description: 'Find curated shopping guides, verified discount coupons, and top direct Amazon product deals in the WorldNewzs Deals Hub.',
    keywords: 'amazon deals, coupon deals, product savings, shopping guide, discounted products',
    canonical: 'https://worldnewzs.in/amazon-products',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'disclaimer': {
    title: 'Disclaimer – Content Notice & Financial Disclaimers',
    description: 'WorldNewzs disclaimer covering news aggregation, third-party content, copyright attribution, financial notices, and informational terms.',
    keywords: 'disclaimer, editorial notice, terms of content, worldnewzs disclaimer, liability limits',
    canonical: 'https://worldnewzs.in/disclaimer',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'editorial-briefings': {
    title: 'Editorial Briefings – Investigative Journalism & Sector Analysis',
    description: 'Read expert editorial briefings and investigative deep-dive reports across global geopolitics, tech breakthroughs, finance, and health.',
    keywords: 'editorial briefings, in-depth journalism, news analysis, investigative reports',
    canonical: 'https://worldnewzs.in/editorial-briefings',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'editorial-guidelines': {
    title: 'Editorial Guidelines – Standards of Accuracy, Ethics & Transparency',
    description: 'Learn about WorldNewzs editorial guidelines, verification methodologies, journalistic ethics, correction policies, and source attribution.',
    keywords: 'editorial guidelines, journalistic ethics, fact-checking policy, news standards',
    canonical: 'https://worldnewzs.in/editorial-guidelines',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'trending-videos': {
    title: 'Trending Videos & Shorts – Curated Clips & Highlights',
    description: 'Watch viral trending video clips, breaking news shorts, insightful tech demonstrations, and sports highlights on WorldNewzs.',
    keywords: 'trending videos, news shorts, video highlights, viral clips, multimedia news',
    canonical: 'https://worldnewzs.in/trending-videos',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'play-games': {
    title: 'Play Games Online – Free Browser Games Arcade & Puzzles',
    description: 'Play interactive browser games online on WorldNewzs! Enjoy Retro Mario, Chess, Hit Goal, Snake Arena, and Daily Trivia Quizzes.',
    keywords: 'play games, free online games, browser games, retro games, chess, mario, arcade games',
    canonical: 'https://worldnewzs.in/play-games',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'polls-history': {
    title: 'Opinion Polls History – Public Sentiment Archive & Records',
    description: 'Review historical opinion polls and survey results. Track community consensus trends on politics, technology, economy, and sports over time.',
    keywords: 'polls history, past voting results, public sentiment archives, historical surveys',
    canonical: 'https://worldnewzs.in/polls-history',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'quiz-history': {
    title: 'Quiz History & Leaderboard – Trivia Scores & Rewards',
    description: 'View your trivia quiz attempt history, review past answers, check your earned coins, and inspect your global rank on the WorldNewzs leaderboard.',
    keywords: 'quiz history, trivia records, coin rewards, quiz score archive, leaderboard',
    canonical: 'https://worldnewzs.in/quiz-history',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  }
};

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function replaceMeta(htmlStr, propertyAttr, attrValue, newValue) {
  const regex1 = new RegExp(
    `(<meta\\s+[^>]*(?:name|property)=["']${attrValue}["'][^>]*content=)["'].*?["']`,
    'i'
  );
  if (regex1.test(htmlStr)) {
    return htmlStr.replace(regex1, `$1"${escapeHtml(newValue)}"`);
  }
  
  const regex2 = new RegExp(
    `(<meta\\s+[^>]*content=)["'].*?["']([^>]*(?:name|property)=["']${attrValue}["'])`,
    'i'
  );
  if (regex2.test(htmlStr)) {
    return htmlStr.replace(regex2, `$1"${escapeHtml(newValue)}"$2`);
  }
  
  const metaTag = propertyAttr === 'property' 
    ? `<meta property="${attrValue}" content="${escapeHtml(newValue)}" />`
    : `<meta name="${attrValue}" content="${escapeHtml(newValue)}" />`;
  return htmlStr.replace('</head>', `${metaTag}\n</head>`);
}

export default async function handler(req, res) {
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https: wss:; img-src * data: blob: android-webview-video-poster:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; frame-src 'self' https:; object-src 'none'; media-src * data: blob:;");

  const { id, page, jobSlug } = req.query;

  // Load Built index.html template from Vercel's output
  const pathsToTry = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'worldnewz_UI', 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(__dirname, '..', 'worldnewz_UI', 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, '..', 'index.html')
  ];

  let htmlTemplate = '';
  for (const p of pathsToTry) {
    try {
      if (fs.existsSync(p)) {
        htmlTemplate = fs.readFileSync(p, 'utf8');
        break;
      }
    } catch (err) {
      console.error(`Error reading index.html at ${p}:`, err);
    }
  }

  if (!htmlTemplate) {
    return res.status(500).send('Could not load base HTML template');
  }

  // Load fallback news database
  const fallbackNewsPaths = [
    path.join(process.cwd(), 'api', 'fallback_news.json'),
    path.join(process.cwd(), 'fallback_news.json'),
    path.join(__dirname, 'fallback_news.json'),
    path.join(__dirname, '..', 'api', 'fallback_news.json')
  ];
  let fallbackNews = [];
  for (const fp of fallbackNewsPaths) {
    try {
      if (fs.existsSync(fp)) {
        fallbackNews = JSON.parse(fs.readFileSync(fp, 'utf8'));
        break;
      }
    } catch (err) {
      // ignore
    }
  }

  let title = '';
  let description = '';
  let imageUrl = 'https://worldnewzs.in/og-image.png';
  let canonical = 'https://worldnewzs.in';
  let keywords = 'news, breaking news, latest headlines, WorldNewzs';
  let ogType = 'website';
  let articleJsonLd = null;
  let richFallbackBody = '';

  const activePage = page || 'home';

  const fetchArticlesWithFallback = async (endpoint, categoryFilter) => {
    const fullUrl = `https://worldnewz.onrender.com/api${endpoint}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(fullUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const results = data.results || data.articles || [];
        if (Array.isArray(results) && results.length > 0) {
          return results;
        }
      }
    } catch (e) {
      // fallback
    }
    if (categoryFilter && categoryFilter !== 'home') {
      const filtered = fallbackNews.filter(a => 
        a.category === categoryFilter || 
        (categoryFilter === 'science-health' && (a.category === 'science' || a.category === 'health'))
      );
      if (filtered.length > 0) return filtered;
    }
    return fallbackNews;
  };

  // Helper: Build Internal Link Hub
  const buildInternalLinkHub = () => {
    return `
      <section style="margin-top: 40px; padding: 25px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Explore WorldNewzs Categories & Utilities</h2>
        <p style="font-size: 0.95rem; color: #475569; margin-bottom: 16px;">
          Navigate through our diverse news pillars and interactive features:
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          <a href="/politics" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Politics</a>
          <a href="/technology" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Technology</a>
          <a href="/business" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Business</a>
          <a href="/science-health" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Science & Health</a>
          <a href="/sports" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Sports</a>
          <a href="/money" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Money</a>
          <a href="/weather" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Weather</a>
          <a href="/stocks" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Stocks</a>
          <a href="/badge-quiz" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Badge Quiz</a>
          <a href="/polls" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Polls</a>
          <a href="/jobs" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Jobs Board</a>
          <a href="/movies" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Movies</a>
          <a href="/transportation" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Transportation</a>
          <a href="/chatbot" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">AI Assistant</a>
          <a href="/amazon-products" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Deals & Shopping</a>
          <a href="/editorial-briefings" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Editorial Briefings</a>
          <a href="/play-games" style="padding: 6px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 0.9rem;">Play Games</a>
        </div>
      </section>
    `;
  };

  // Helper: Build FAQ Section
  const buildFaqSection = (faqs) => {
    if (!faqs || faqs.length === 0) return '';
    const items = faqs.map(faq => `
      <div style="margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
        <h3 style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 8px;">${escapeHtml(faq.q)}</h3>
        <p style="font-size: 0.98rem; line-height: 1.75; color: #334155; margin: 0;">${escapeHtml(faq.a)}</p>
      </div>
    `).join('');

    return `
      <section style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #e2e8f0;">
        <h2 style="font-size: 1.55rem; font-weight: 800; color: #c83a15; margin-bottom: 20px;">Frequently Asked Questions (FAQs)</h2>
        ${items}
      </section>
    `;
  };

  // Helper: Format Rich Article List
  const renderArticleListHtml = (articles) => {
    let html = '';
    const itemsToRender = (Array.isArray(articles) && articles.length > 0) ? articles.slice(0, 8) : fallbackNews.slice(0, 8);
    itemsToRender.forEach(article => {
      const artTitle = article.title || article.headline || 'Verified News Report';
      const artDesc = article.description || article.summary || 'Detailed analytical coverage and real-time updates from verified international journalism desks.';
      const artSlug = article.id || artTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const pubDate = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'August 21, 2026';
      html += `
        <article style="margin-bottom: 28px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 20px;">
          <h3 style="margin-top: 0; font-size: 1.32rem; font-weight: 700; line-height: 1.4;"><a href="/article/${artSlug}" style="color: #0f172a; text-decoration: none;">${escapeHtml(artTitle)}</a></h3>
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 8px;"><strong>Published:</strong> ${escapeHtml(pubDate)} | <strong>Category:</strong> ${escapeHtml(article.category || 'News')} | <strong>Source:</strong> ${escapeHtml(typeof article.source === 'string' ? article.source : (article.source?.name || 'Verified Wire'))}</p>
          <p style="line-height: 1.75; color: #334155; font-size: 0.98rem;">${escapeHtml(artDesc)}</p>
          <p style="line-height: 1.7; color: #475569; font-size: 0.92rem;">In-depth reporting underscores the multifaceted consequences of this development across public policy, economic forecasts, and community impact. Readers can inspect primary wire disclosures, factual timelines, and verified context.</p>
          <p><a href="/article/${artSlug}" style="color: #c83a15; font-weight: 700; text-decoration: none; font-size: 0.95rem;">Read Comprehensive Report &rarr;</a></p>
        </article>
      `;
    });
    return html;
  };

  // Case A: Home Page
  if (activePage === 'home') {
    title = 'WorldNewzs – Your World, Your News | Breaking Headlines & AI Briefings';
    description = 'Stay updated with the latest breaking news in politics, business, technology, health, sports, and world affairs with real-time AI summaries and verified analysis on WorldNewzs.';
    canonical = 'https://worldnewzs.in';

    const articles = await fetchArticlesWithFallback('/news/discover', 'home');
    const articlesHtml = renderArticleListHtml(articles);

    const homeFaqs = [
      {
        q: "How does WorldNewzs aggregate and verify daily breaking news?",
        a: "WorldNewzs continuously monitors verified RSS feeds, news wire APIs, and authoritative international journalism platforms including BBC, Reuters, AP News, Bloomberg, and Nature. Our automated processing engine extracts factual summaries, filters sensationalism, cross-verifies multiple reporting sources, and synthesizes key takeaways."
      },
      {
        q: "What is the difference between Top News and More News on WorldNewzs?",
        a: "Top News highlights the most critical, market-moving, and impactful global developments of the day with high-level executive summaries. More News provides comprehensive, category-by-category analytical deep dives into Politics, Technology, Business, Science, Health, Sports, and Personal Finance."
      },
      {
        q: "How often is the news updated on WorldNewzs?",
        a: "Our news feeds update continuously throughout the day with real-time indexing. Daily AI synthesis briefings are generated and published every morning to provide comprehensive sector roundups."
      },
      {
        q: "Are the opinion polls and trivia badge quizzes free to access?",
        a: "Yes, all interactive reader utilities on WorldNewzs—including the daily General Knowledge Badge Quiz, Opinion Polls, Stock Trackers, and Arcade Games—are 100% free and open to all readers globally."
      }
    ];

    richFallbackBody = `
      <h1>Latest Breaking News, Top Stories & Global Intelligence</h1>
      <p style="font-size: 1.1rem; line-height: 1.8; color: #334155; margin-bottom: 25px;">
        Welcome to WorldNewzs, your premier destination for factual, real-time news aggregation and in-depth editorial intelligence. In an era of rapid informational shifts and dispersed reporting, our mission is to deliver clarity, objective verification, and structured analytical reporting across global governance, financial markets, emerging technology, science discoveries, and cultural movements.
      </p>

      <!-- AI Top News Executive Briefing -->
      <section style="background: #fff8f6; border-left: 4px solid #c83a15; padding: 22px; margin-bottom: 30px; border-radius: 4px;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #c83a15; margin-top: 0;">Today's Top News AI Executive Briefing</h2>
        <p style="font-size: 1.05rem; line-height: 1.75; color: #1e293b; font-weight: 500;">
          Global equity indices demonstrated resilience today as major technology and energy leaders reported robust quarterly fundamentals. In international diplomacy, multilateral climate summits advanced new infrastructure frameworks, while breakthroughs in localized artificial intelligence models signal a decisive transition toward secure on-device processing.
        </p>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-top: 15px; margin-bottom: 8px;">Key Takeaways for Today:</h3>
        <ul style="margin-left: 20px; line-height: 1.7; color: #334155;">
          <li><strong>Economic Resilience:</strong> Central bank indicators point toward stabilizing inflation benchmarks, sparking optimism across equity and bond markets.</li>
          <li><strong>Technological Innovation:</strong> Researchers unveiled next-generation neural compression standards enabling complex reasoning models to execute locally on consumer smartphones without cloud latency.</li>
          <li><strong>Energy & Infrastructure:</strong> Historic legislative pacts commit substantial funding toward renewable grid modernization and cross-border clean transit networks.</li>
        </ul>
        <p style="font-size: 0.95rem; color: #64748b; margin-top: 12px; margin-bottom: 0;">
          <em>Context: Synthesized daily by WorldNewzs Editorial Intelligence Engine from verified primary wires.</em>
        </p>
      </section>

      <!-- AI More News Multi-Category Deep-Dive Hub -->
      <section style="margin-bottom: 35px;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 16px;">More News: Comprehensive Multi-Category Analysis</h2>
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 18px; border-radius: 6px;">
            <h3 style="color: #c83a15; margin-top: 0; font-size: 1.25rem;"><a href="/politics" style="color: #c83a15; text-decoration: none;">Politics & Geopolitics</a></h3>
            <p style="line-height: 1.7; color: #334155; margin-bottom: 0;">International diplomatic forums witnessed key agreements on cross-border data security and energy distribution networks. National parliamentary committees are reviewing comprehensive civil policy bills designed to modernize municipal voting mechanisms and bolster regional economic autonomy.</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 18px; border-radius: 6px;">
            <h3 style="color: #c83a15; margin-top: 0; font-size: 1.25rem;"><a href="/technology" style="color: #c83a15; text-decoration: none;">Technology & Artificial Intelligence</a></h3>
            <p style="line-height: 1.7; color: #334155; margin-bottom: 0;">Silicon hardware manufacturers unveiled novel 2-nanometer architecture roadmaps promising 30% greater energy efficiency for edge computing devices. Concurrently, open-source AI frameworks are introducing robust provenance cryptographic watermarking to safeguard digital integrity.</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 18px; border-radius: 6px;">
            <h3 style="color: #c83a15; margin-top: 0; font-size: 1.25rem;"><a href="/business" style="color: #c83a15; text-decoration: none;">Business & Global Markets</a></h3>
            <p style="line-height: 1.7; color: #334155; margin-bottom: 0;">Institutional investors expanded allocations into renewable utility infrastructure and advanced manufacturing funds. Corporate earnings across major logistics and supply chain operators showed stabilizing margins despite geopolitical freight adjustments.</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 18px; border-radius: 6px;">
            <h3 style="color: #c83a15; margin-top: 0; font-size: 1.25rem;"><a href="/science-health" style="color: #c83a15; text-decoration: none;">Science & Health Frontiers</a></h3>
            <p style="line-height: 1.7; color: #334155; margin-bottom: 0;">Longitudinal clinical trials reported significant cognitive longevity advantages associated with plant-forward Mediterranean dietary habits. In astrophysics, orbital space observatories recorded groundbreaking spectroscopic data from distant exoplanetary atmospheres.</p>
          </div>
        </div>
      </section>

      <!-- Latest Articles Grid -->
      <section style="margin-top: 30px;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 20px;">Curated Breaking Headlines & Stories</h2>
        ${articlesHtml}
      </section>

      ${buildFaqSection(homeFaqs)}
      ${buildInternalLinkHub()}
    `;
  }
  // Case B: Static, Interactive, and Category Pages
  else if (PAGE_METADATA[activePage]) {
    const meta = PAGE_METADATA[activePage];
    title = meta.title;
    description = meta.description;
    imageUrl = meta.ogImage || imageUrl;
    canonical = meta.canonical;
    keywords = meta.keywords || keywords;
    ogType = meta.ogType || ogType;

    let pageContent = '';

    // 1. Badge Quiz Page
    if (activePage === 'badge-quiz') {
      pageContent = `
        <h1>Daily General Knowledge & News Trivia Badge Quiz</h1>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #334155;">
          Challenge your intellect, test your factual awareness, and stay ahead of world events with the WorldNewzs Daily Badge Quiz! Our interactive trivia challenges span six core domains: global politics, technological breakthroughs, financial history, scientific discoveries, sports records, and world arts. Earn coins for accurate answers, maintain daily knowledge streaks, and unlock prestigious verifiable tier badges from Novice to Grandmaster.
        </p>
        
        <h2>How the Knowledge Badge Progression System Works</h2>
        <p style="line-height: 1.75; color: #334155;">
          Every completed trivia round evaluates your response accuracy and response speed to allocate score coins. As your cumulative knowledge score increases across consecutive challenges, you unlock verifiable tier badges:
        </p>
        <ul>
          <li><strong>Novice Scholar (Tier 1):</strong> Unlocked upon completing 5 daily trivia challenges. Confirms basic active news literacy across multiple categories.</li>
          <li><strong>Domain Specialist (Tier 2):</strong> Awarded for achieving an 85%+ accuracy rate in specific categories such as Silicon Technology, Macroeconomics, or Geopolitics.</li>
          <li><strong>Senior Fact-Finder (Tier 3):</strong> Earned by maintaining an unbroken 14-day daily quiz streak while ranking in the top 10% of monthly participant scores.</li>
          <li><strong>Grandmaster Analyst (Tier 4):</strong> The premier knowledge tier awarded exclusively to players ranking in the top 1% globally on our verified leaderboard.</li>
        </ul>

        <h2>The Cognitive Science of Daily Trivia Recall</h2>
        <p style="line-height: 1.75; color: #334155;">
          Neuroscience and pedagogical research demonstrate that active retrieval practice (testing yourself on newly acquired information) produces significantly higher long-term knowledge retention compared to passive reading. By participating in daily quizzes immediately after reviewing the news, readers convert ephemeral headlines into structured, permanent mental models of global current events.
        </p>

        <h2>Strategic Tips for Achieving Perfect Quiz Scores</h2>
        <p style="line-height: 1.75; color: #334155;">
          To maximize your coin earnings and leaderboard rank, make it a habit to read the WorldNewzs morning editorial briefings before starting the daily challenge. Pay close attention to dates, legislative names, economic percentages, and technological milestones mentioned across our pillar reporting.
        </p>

        <h2>Rules, Coin Multipliers & Fair Play Standards</h2>
        <p style="line-height: 1.75; color: #334155;">
          Each trivia question carries a base award of 10 coins. Answering within the first 5 seconds yields a 1.5x speed bonus. Sustaining a 7-day streak activates a 2x weekly bonus multiplier. To maintain community integrity, automated scripts and duplicate browser submissions are disqualified from global leaderboards.
        </p>

        ${buildFaqSection([
          { q: "How frequently is the WorldNewzs Badge Quiz refreshed with new questions?", a: "A fresh set of verified trivia questions covering breaking news and historical context is published every day at 00:00 UTC." },
          { q: "How are coin rewards, streaks, and leaderboard rankings calculated?", a: "Coins are calculated based on correct answers, with bonus multiplier points awarded for swift responses and consecutive daily streak milestones." },
          { q: "Can I review past quiz answers and detailed factual explanations?", a: "Yes, you can access your complete performance history, score breakdown, and answer explanations anytime on the Quiz History page." },
          { q: "Is registration mandatory to participate in the Badge Quiz?", a: "No, guests can play immediately. However, signing in enables permanent score synchronization, badge storage, and participation in the global community leaderboard." }
        ])}
      `;
    }
    // 2. Opinion Polls Page
    else if (activePage === 'polls') {
      pageContent = `
        <h1>Community Opinion Polls – Real-Time Public Sentiment</h1>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #334155;">
          Voice your perspective on today's most decisive questions with WorldNewzs Opinion Polls. From international monetary policy and artificial intelligence regulation to championship sports debates and civic governance, our non-partisan polling platform captures real-time global consensus.
        </p>

        <h2>Our Non-Partisan Polling Methodology & Neutrality Standards</h2>
        <p style="line-height: 1.75; color: #334155;">
          WorldNewzs is dedicated to maintaining absolute editorial neutrality in poll construction. Every survey question undergoes review to eliminate loaded adjectives, leading questions, and biased phrasing. Response options are balanced to represent diverse political, economic, and cultural viewpoints. Once you submit your vote, live aggregated percentage distributions and demographic trends are displayed instantly.
        </p>

        <h2>Why Real-Time Public Sentiment Analysis Matters</h2>
        <p style="line-height: 1.75; color: #334155;">
          In modern democratic societies and interconnected global markets, quantitative public sentiment indicators provide indispensable feedback on how technological disruptions and governmental policies resonate with citizens. Our historical poll archives serve as transparent, time-stamped records of public opinion across pivotal moments in history.
        </p>

        <h2>Data Integrity & Anti-Tampering Protections</h2>
        <p style="line-height: 1.75; color: #334155;">
          To prevent voting manipulation, sybil attacks, and automated bot spam, WorldNewzs employs multi-factor verification safeguards including rate limiting, session token validation, and IP anomaly detection while keeping individual voter identities 100% anonymous.
        </p>

        <h2>Historical Survey Archives & Civic Research</h2>
        <p style="line-height: 1.75; color: #334155;">
          Archived poll results provide researchers and civic analysts with valuable historical data reflecting public sentiment across major election cycles, monetary shifts, and global health initiatives. Explore our dedicated Polls History page to review long-term consensus trends.
        </p>

        ${buildFaqSection([
          { q: "Are WorldNewzs opinion polls anonymous and secure?", a: "Yes, all votes are strictly anonymous. We collect no personal tracking data, ensuring complete voter privacy while maintaining cryptographic vote integrity." },
          { q: "How long do active community polls remain open for voting?", a: "Daily pulse polls stay active for 48 hours, while major policy and economic surveys remain open for 7 days to ensure broad demographic reach." },
          { q: "Can historical poll trends and consensus data be cited for research?", a: "Yes, researchers, educators, and journalists may reference WorldNewzs poll results with attribution to worldnewzs.in." },
          { q: "How can readers propose new poll questions for the editorial desk?", a: "You can submit community poll suggestions directly through our Contact Us page for editorial review." }
        ])}
      `;
    }
    // 3. Stocks Market Page
    else if (activePage === 'stocks') {
      pageContent = `
        <h1>Stock Market Live – Real-Time Indices, Sector Trackers & Market Analysis</h1>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #334155;">
          Track live global equity indices, benchmark market movers, sector heatmaps, top gainers, losers, and macroeconomic indicators on the WorldNewzs Stock Market Live dashboard. Whether monitoring the Nifty 50, BSE Sensex, NASDAQ, S&P 500, or European bourses, our market intelligence desk delivers verified data points and analytical commentary.
        </p>

        <h2>Comprehensive Market Metrics We Monitor</h2>
        <ul>
          <li><strong>Benchmark Equity Indices:</strong> Real-time price tracking across Nifty 50, BSE Sensex, Dow Jones Industrial Average, S&P 500, NASDAQ Composite, and FTSE 100.</li>
          <li><strong>Sector Heatmaps:</strong> Comparative daily performance tracking across Banking & Financial Services, Information Technology, Energy, Healthcare, Automotive, and Consumer Goods.</li>
          <li><strong>Top Gainers & Losers:</strong> Continuous intraday ranking of leading market gainers and decliners categorized by trading volume and market capitalization.</li>
          <li><strong>Macroeconomic Data Points:</strong> Central bank interest rate decisions, CPI inflation figures, sovereign bond yield curves, and foreign institutional investor (FII/DII) fund flows.</li>
        </ul>

        <h2>Essential Investment Fundamentals for Retail Traders</h2>
        <p style="line-height: 1.75; color: #334155;">
          Long-term capital compounding relies on evaluating sound corporate balance sheets, Free Cash Flow (FCF) margins, return on equity (ROE), and disciplined asset allocation. By combining real-time data feeds with macroeconomic context, WorldNewzs equips readers with objective knowledge to navigate market volatility without emotional speculation.
        </p>

        <h2>Understanding Valuation Multiples in Volatile Markets</h2>
        <p style="line-height: 1.75; color: #334155;">
          Investors frequently analyze metrics like Price-to-Earnings (P/E), Enterprise Value to EBITDA (EV/EBITDA), and Debt-to-Equity ratios to assess whether equity sectors are trading at historical premiums or discounts. Our daily market commentary contextualizes these fundamental parameters within broader economic cycles.
        </p>

        <h2>Risk Disclosure & Financial Education Notice</h2>
        <p style="line-height: 1.75; color: #64748b; font-size: 0.95rem;">
          All stock prices, charts, and market summaries displayed on WorldNewzs are intended strictly for educational and informational purposes. WorldNewzs is not a registered financial advisory firm. Readers should consult a licensed financial advisor before executing investment transactions.
        </p>

        ${buildFaqSection([
          { q: "How frequently are stock market indices and equity prices updated?", a: "Market indicators and index charts update continuously during active trading hours with minimal network latency." },
          { q: "Does WorldNewzs provide paid stock tips or algorithmic trading advice?", a: "No, WorldNewzs does not offer stock recommendations, buy/sell tips, or paid investment advice. We provide objective financial news and data." },
          { q: "Where does WorldNewzs source its financial market data?", a: "Financial data is aggregated from verified exchange terminals, regulatory disclosures, and licensed economic data feeds." },
          { q: "Can I save customized stock watchlists on WorldNewzs?", a: "Yes, you can use our built-in Market Watchlist widget on the Discover page to monitor your preferred equities." }
        ])}
      `;
    }
    // 4. Jobs Board Page
    else if (activePage === 'jobs') {
      pageContent = `
        <h1>Jobs Board – Find Remote, Tech & Professional Career Opportunities</h1>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #334155;">
          Discover verified career openings, remote software roles, digital marketing positions, UI/UX design opportunities, and corporate executive vacancies on the WorldNewzs Jobs Board. Connect directly with hiring managers and forward-thinking enterprises offering remote, hybrid, and on-site employment worldwide.
        </p>

        <h2>Navigating the Modern Global Employment Landscape</h2>
        <p style="line-height: 1.75; color: #334155;">
          The global workforce has undergone a structural transformation toward distributed, remote-first, and asynchronous operations. High-growth technology firms, financial institutions, and creative agencies actively recruit candidates who demonstrate self-directed problem solving, strong asynchronous communication, and domain expertise. Our job curation system filters out low-quality listings to present verified, high-impact career paths.
        </p>

        <h2>Strategies for Crafting an Outstanding Job Application</h2>
        <ul>
          <li><strong>Quantify Your Achievements:</strong> Highlight measurable outcomes (e.g., 'reduced API latency by 45%', 'grew organic search traffic by 120%') rather than listing generic responsibilities.</li>
          <li><strong>Build a Public Proof of Work:</strong> Share live portfolio links, open-source GitHub contributions, design Figma case studies, or published research articles.</li>
          <li><strong>Tailor Your Value Proposition:</strong> Align your cover letter and experience with the specific pain points and technological stack of the hiring organization.</li>
        </ul>

        <h2>Mastering the Technical Interview Process</h2>
        <p style="line-height: 1.75; color: #334155;">
          Modern hiring evaluations place heavy emphasis on practical system design, live coding reviews, and cultural collaboration assessments. Candidates who prepare structured walkthroughs of past engineering architectural decisions consistently achieve higher placement rates.
        </p>

        <h2>Employer Posting & Talent Acquisition Solutions</h2>
        <p style="line-height: 1.75; color: #334155;">
          Recruiters and hiring managers can submit job listings directly through our Post a Job portal. Listings are syndicated across our reader network, reaching thousands of active developers, analysts, and creative professionals daily.
        </p>

        ${buildFaqSection([
          { q: "Is applying for jobs on WorldNewzs 100% free for candidates?", a: "Yes, candidates can search, review detailed job descriptions, and apply directly to employer portals with zero candidate fees." },
          { q: "How are job postings verified for legitimacy and safety?", a: "Our employment desk verifies employer domains, business registries, and career page authenticity to protect applicants from recruitment scams." },
          { q: "What industry sectors are represented on the WorldNewzs Jobs board?", a: "We feature positions across Full-Stack Engineering, Mobile Development, Cloud DevOps, Product Management, Digital Marketing, Data Science, and UI/UX Design." },
          { q: "How can companies post job openings on WorldNewzs?", a: "Employers can submit vacancies directly via the Post a Job page with instant listing options." }
        ])}
      `;
    }
    // 5. Amazon Products / Deals Page
    else if (activePage === 'amazon-products') {
      pageContent = `
        <h1>Deals Hub – Curated Product Savings, Buying Guides & Reviews</h1>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #334155;">
          Explore verified e-commerce discounts, handpicked shopping deals, and comprehensive consumer buying guides in the WorldNewzs Deals Hub. Our shopping editorial team monitors leading digital retail platforms around the clock to highlight genuine price drops on consumer electronics, smart home gadgets, productivity accessories, and lifestyle essentials.
        </p>

        <h2>Our Deal Verification & Price Tracking Standards</h2>
        <p style="line-height: 1.75; color: #334155;">
          In an online retail environment frequently cluttered with artificial discounts and inflated list prices, WorldNewzs applies rigorous vetting standards before featuring any product deal:
        </p>
        <ul>
          <li><strong>Historical Price Validation:</strong> We verify historical pricing averages to ensure every featured deal represents a genuine discount below normal retail levels.</li>
          <li><strong>Customer Review Vetting:</strong> Products must maintain a verified buyer rating of 4.0 stars or higher with substantiated user feedback.</li>
          <li><strong>Manufacturer Warranty:</strong> We prioritize items backed by official brand warranties, reliable customer support, and standard return policies.</li>
        </ul>

        <h2>Consumer Electronics & Smart Home Buying Guide</h2>
        <p style="line-height: 1.75; color: #334155;">
          When investing in premium electronics like noise-canceling headphones, 4K HDR displays, ergonomic mechanical keyboards, or automated robotic vacuums, prioritizing energy efficiency, repairability ratings, and long-term firmware support ensures maximum value per dollar spent.
        </p>

        <h2>Affiliate Advertising Transparency Disclosure</h2>
        <p style="line-height: 1.75; color: #64748b; font-size: 0.95rem;">
          WorldNewzs is a participant in the Amazon Services LLC Associates Program, an affiliate advertising initiative designed to provide a means for websites to earn advertising fees by linking to Amazon. When you click on product links and complete a purchase, we may receive a modest commission at no additional expense to you.
        </p>

        ${buildFaqSection([
          { q: "How frequently are product deals and coupon codes updated?", a: "Our deals desk updates active deals multiple times each day, immediately removing out-of-stock items and expired coupon promotions." },
          { q: "Are sponsored products clearly distinguished from editorial reviews?", a: "Yes, all affiliate and sponsored links are clearly labeled to ensure strict separation between commercial features and independent editorial reporting." },
          { q: "How can readers report an expired deal or request a product review?", a: "You can send product feedback or report pricing changes directly through our Contact Us page." }
        ])}
      `;
    }
    // 6. About Us Page
    else if (activePage === 'about') {
      pageContent = `
        <h1>About WorldNewzs – Our Editorial Mission, Ethics & Technology</h1>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #334155;">
          WorldNewzs is an independent digital news aggregation and analytical journalism platform established to bring clarity, factual integrity, and depth to modern global reporting. In a digital media ecosystem often characterized by sensationalism, partisan echo chambers, and algorithmic fragmentation, WorldNewzs curates and contextualizes breaking news from reputable global sources into objective, structured, and easily digestible briefings.
        </p>

        <h2>Our Core Journalistic Principles</h2>
        <ul>
          <li><strong>Factual Verification:</strong> We cross-reference multiple authoritative news wires (including BBC, Reuters, AP News, Bloomberg, and Nature) before publishing summaries.</li>
          <li><strong>Non-Partisan Neutrality:</strong> We present multiple perspectives on political, economic, and cultural developments, encouraging critical thinking and informed discourse.</li>
          <li><strong>Source Attribution:</strong> We strictly credit primary reporting organizations and provide clear external source links for transparency.</li>
          <li><strong>Reader Privacy:</strong> We uphold the highest standards of data security, cookie governance, and privacy compliance under GDPR and CCPA.</li>
        </ul>

        <h2>Our Technology Stack & AI Integration</h2>
        <p style="line-height: 1.75; color: #334155;">
          WorldNewzs leverages modern full-stack web engineering—including React, TypeScript, ASP.NET Core, PostgreSQL, and Google Gemini AI—to deliver real-time news updates, interactive trivia quizzes, community opinion polls, and sub-second page rendering across desktop and mobile devices.
        </p>

        <h2>Editorial Leadership & Governance</h2>
        <p style="line-height: 1.75; color: #334155;">
          Our newsroom desk consists of seasoned editors and software engineers dedicated to maintaining strict editorial standards. We operate free from external corporate influence, ensuring all syndicated analyses remain independent, transparent, and focused on public interest.
        </p>

        <h2>Commitment to Continuous Improvement</h2>
        <p style="line-height: 1.75; color: #334155;">
          We continuously update our curation algorithms and accessibility features to ensure seamless performance, high readability, and rapid delivery of factual journalism to readers worldwide.
        </p>

        ${buildFaqSection([
          { q: "Does WorldNewzs produce original reporting?", a: "WorldNewzs operates as an editorial curator and analytical synthesizer, aggregating verified reporting from authoritative international news organizations with original context and commentary." },
          { q: "Who owns and operates WorldNewzs?", a: "WorldNewzs is developed and operated by Ganesh CO., headquartered in Hyderabad, Telangana, India." },
          { q: "How can readers submit corrections or editorial feedback?", a: "You can submit correction notices or feedback directly to our editorial desk via email at editorial@worldnewzs.in or through our Contact Us page." }
        ])}
      `;
    }
    // 7. Privacy Policy Page
    else if (activePage === 'privacy-policy') {
      pageContent = `
        <h1>Privacy Policy – Data Protection, Cookies & User Rights</h1>
        <p style="font-size: 0.95rem; color: #64748b;"><strong>Last Updated: August 21, 2026</strong> | <strong>Effective Date: August 21, 2026</strong></p>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #334155;">
          At WorldNewzs (accessible at https://worldnewzs.in), one of our highest priorities is the privacy of our visitors. This Privacy Policy document outlines the types of information collected and recorded by WorldNewzs and how we utilize, protect, and process that data in compliance with the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
        </p>

        <h2>1. Information We Collect</h2>
        <p style="line-height: 1.75; color: #334155;">
          We collect personal information that you voluntarily provide to us when subscribing to our email newsletter, submitting feedback through our contact forms, participating in community polls, or creating user bookmarks. This information may include your name, email address, and user preferences.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p style="line-height: 1.75; color: #334155;">
          We use the information we collect to operate and maintain our website, deliver daily news summaries, provide interactive quiz and poll functionality, detect and prevent fraud, and analyze aggregate visitor traffic to enhance website performance and user experience.
        </p>

        <h2>3. Google AdSense & Third-Party Cookies</h2>
        <p style="line-height: 1.75; color: #334155;">
          WorldNewzs partners with third-party advertising vendors, including Google AdSense (Publisher ID: ca-pub-7547748414764075). Google uses cookies (such as the DoubleClick cookie) to serve relevant advertisements to users based on their visits to WorldNewzs and other sites across the Internet. You can opt out of personalized advertising at any time by visiting Google Ads Settings or aboutads.info.
        </p>

        <h2>4. Your Data Protection Rights Under GDPR & CCPA</h2>
        <p style="line-height: 1.75; color: #334155;">
          Under applicable data protection laws, you possess the right to request access to your personal data, request correction of inaccurate information, request erasure of your data, and object to data processing. WorldNewzs does not sell personal user information to third parties.
        </p>

        <h2>5. Data Retention & Security Safeguards</h2>
        <p style="line-height: 1.75; color: #334155;">
          We retain personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy. We implement industry-standard encryption protocols (HTTPS/TLS) and server-level access controls to safeguard your data against unauthorized access or disclosure.
        </p>

        ${buildFaqSection([
          { q: "Does WorldNewzs sell user data to third-party data brokers?", a: "No, WorldNewzs never sells, rents, or trades personal user data to third-party advertisers or brokers." },
          { q: "How can I manage or withdraw my cookie consent preferences?", a: "You can adjust your cookie settings at any time using our on-site Cookie Consent banner or through your browser preferences." },
          { q: "How do I request deletion of my newsletter subscription data?", a: "You can click the 'Unsubscribe' link at the bottom of any newsletter email or contact us at privacy@worldnewzs.in." }
        ])}
      `;
    }
    // 8. Contact Us Page
    else if (activePage === 'contact') {
      pageContent = `
        <h1>Contact Us – Get in Touch with WorldNewzs Editorial Desk</h1>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #334155;">
          We welcome your inquiries, news tips, feedback, and partnership proposals. Whether you are reporting a technical issue, requesting an editorial correction, or exploring media collaborations, our dedicated desk is ready to assist you.
        </p>

        <h2>Direct Contact Information</h2>
        <ul>
          <li><strong>General Editorial Desk:</strong> editorial@worldnewzs.in</li>
          <li><strong>Direct Publisher Support:</strong> ganeshkumard56@gmail.com</li>
          <li><strong>Office Location:</strong> WorldNewzs Headquarters, Ganesh CO., Hyderabad, Telangana, India</li>
          <li><strong>Support Hours:</strong> Monday – Friday: 9:00 AM – 6:00 PM (IST) | Saturday: 10:00 AM – 2:00 PM (IST)</li>
        </ul>

        <h2>Submitting News Tips & Editorial Corrections</h2>
        <p style="line-height: 1.75; color: #334155;">
          If you have identified a factual inaccuracy in one of our syndicated summaries or wish to submit a confidential news tip, please include the URL of the article, a description of the requested correction, and supporting documentation or authoritative source links. Our fact-checking team reviews all correction requests within 24 to 48 business hours.
        </p>

        <h2>Media Partnerships & Advertising Inquiries</h2>
        <p style="line-height: 1.75; color: #334155;">
          Organizations seeking editorial collaboration, content syndication, or verified brand sponsorship opportunities can reach our partnerships desk at partnerships@worldnewzs.in.
        </p>

        <h2>Technical Support & Bug Reporting</h2>
        <p style="line-height: 1.75; color: #334155;">
          For assistance regarding account access, interactive trivia leaderboard tracking, or reporting broken links, our technical engineering team responds promptly to help resolve site accessibility concerns.
        </p>

        ${buildFaqSection([
          { q: "What is the typical response turnaround time for contact inquiries?", a: "We aim to review and respond to all email inquiries within 24 to 48 business hours." },
          { q: "Can I submit guest editorial columns or opinion articles?", a: "Yes, guest column pitches can be sent to editorial@worldnewzs.in with the subject line 'Guest Editorial Submission'." },
          { q: "How do I report technical bugs or website rendering issues?", a: "Please include your browser type, device OS, and a screenshot of the issue when emailing support." }
        ])}
      `;
    }
    // 9. All News Category Pages
    else {
      const endpointMap = {
        'science-health': '/news/science-health',
        'sports': '/news/sports',
        'business': '/news/business',
        'technology': '/news/technology',
        'politics': '/news/politics',
        'money': '/news/money',
        'shopping': '/news/shopping',
        'travel': '/news/travel',
        'food': '/news/food',
        'entertainment': '/news/entertainment',
        'gaming': '/news/gaming',
        'stocks': '/news/stocks',
        'lifestyle': '/news/lifestyle',
        'education': '/news/education',
        'opinion': '/news/opinion',
        'trending': '/news/trending',
        'podcasts-videos': '/news/podcasts-videos',
        'local-news': '/news/local-news',
        'services': '/news/services',
        'cartoons': '/news/cartoons',
        'movies': '/movies/browse'
      };

      const endpoint = endpointMap[activePage] || `/news/search?category=${activePage}`;
      const articles = await fetchArticlesWithFallback(endpoint, activePage);
      const articlesHtml = renderArticleListHtml(articles);

      const categoryFaqs = [
        {
          q: `How often is the ${activePage} section updated on WorldNewzs?`,
          a: `Our automated indexing systems update the ${activePage} feed in real-time as breaking developments emerge from authoritative global publications.`
        },
        {
          q: `What primary sources are curated in the ${activePage} category?`,
          a: `We aggregate and verify reporting from established international journalism organizations, scientific journals, government registries, and specialized sector analysts.`
        },
        {
          q: `Can I share or bookmark ${activePage} articles for offline reading?`,
          a: `Yes, you can use our built-in Bookmarks tool to save stories and share verified summaries across social media platforms.`
        },
        {
          q: `How does WorldNewzs ensure factual accuracy in ${activePage} news?`,
          a: `Every story is cross-verified across multiple reporting wires to eliminate false claims and provide objective context before syndication.`
        }
      ];

      pageContent = `
        <h1>${escapeHtml(title)}</h1>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #334155; margin-bottom: 25px;">
          ${escapeHtml(description)}
        </p>

        <section style="background: #f8fafc; border-left: 4px solid #c83a15; padding: 22px; margin-bottom: 30px; border-radius: 4px;">
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-top: 0;">Editorial Overview & Sector Background</h2>
          <p style="line-height: 1.75; color: #334155;">
            The ${escapeHtml(activePage)} domain is experiencing unprecedented acceleration, shaped by evolving global standards, technical innovations, and shifting public expectations. Our editorial desk actively cross-references multiple authoritative wires to provide balanced, comprehensive coverage that contextualizes immediate headlines within broader structural trends.
          </p>
          <p style="line-height: 1.75; color: #334155;">
            Whether examining policy developments, economic ramifications, or cultural shifts, our goal is to empower readers with transparent, fact-checked reporting and actionable insights. Explore the curated stories and sector analyses below to stay ahead of the daily news cycle.
          </p>
          <p style="line-height: 1.75; color: #334155; margin-bottom: 0;">
            Our syndication architecture continuously incorporates reader engagement metrics, community poll feedback, and investigative briefings to expand reporting coverage and foster an informed, globally connected audience.
          </p>
        </section>

        <section style="margin-top: 25px;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 18px;">Latest Articles & Briefings in ${escapeHtml(activePage)}</h2>
          ${articlesHtml}
        </section>

        ${buildFaqSection(categoryFaqs)}
      `;
    }

    richFallbackBody = `
      ${pageContent}
      ${buildInternalLinkHub()}
    `;
  }
  // Case C: Job Details
  else if (jobSlug) {
    title = `Job Opening: ${jobSlug.replace(/-/g, ' ')} | WorldNewzs Jobs`;
    description = `Explore job requirements, company background, and application details for ${jobSlug.replace(/-/g, ' ')} on WorldNewzs Jobs.`;
    canonical = `https://worldnewzs.in/jobs/detail/${jobSlug}`;
    
    richFallbackBody = `
      <article>
        <h1>Job Opening: ${escapeHtml(jobSlug.replace(/-/g, ' '))}</h1>
        <p style="color: #64748b;">Verified Career Opportunity | WorldNewzs Jobs Board</p>
        <p style="line-height: 1.75; color: #334155;">
          This position has been verified by the WorldNewzs employment desk. Review the qualifications, compensation guidelines, and application links below to submit your resume directly to the hiring organization.
        </p>
        <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
          <p><strong>Status:</strong> Active & Accepting Applications</p>
          <p><a href="/jobs" style="color: #c83a15; font-weight: bold; text-decoration: none;">&larr; Back to all job openings</a></p>
        </div>
      </article>
      ${buildInternalLinkHub()}
    `;
  }
  // Case D: Single Article
  else if (id) {
    let article = fallbackNews.find(a => a.id === id) || fallbackNews[0];

    if (article) {
      title = article.headline || article.title;
      description = article.summary || article.description || '';
      imageUrl = article.urlToImage || article.imageUrl || imageUrl;
      canonical = `https://worldnewzs.in/article/${id}`;
      ogType = 'article';

      articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "description": description,
        "image": [imageUrl],
        "datePublished": article.publishedAt || new Date().toISOString(),
        "dateModified": article.publishedAt || new Date().toISOString(),
        "url": canonical,
        "articleSection": article.category || 'News',
        "inLanguage": "en-US",
        "publisher": {
          "@type": "Organization",
          "name": "WorldNewzs",
          "logo": {
            "@type": "ImageObject",
            "url": "https://worldnewzs.in/favicon.svg"
          }
        }
      };

      richFallbackBody = `
        <article>
          <h1 style="font-size: 2.2rem; margin-bottom: 10px; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 20px;">
            <strong>By ${escapeHtml(article.author || 'Editorial Desk')}</strong> | Published on: ${escapeHtml(article.publishedAt || new Date().toISOString().split('T')[0])} | Category: <a href="/${escapeHtml(article.category || 'news')}" style="color: #c83a15;">${escapeHtml(article.category || 'News')}</a>
          </p>
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 25px;" />
          <div style="font-size: 1.1rem; line-height: 1.8; color: #222; text-align: justify;">
            <p>${escapeHtml(description)}</p>
            <p>As developments surrounding this report continue to unfold, industry experts emphasize the importance of monitoring long-term policy adjustments and market reactions. WorldNewzs remains dedicated to delivering verified, transparent, and timely analysis to help our readers stay ahead of breaking global events.</p>
          </div>
        </article>
        ${buildInternalLinkHub()}
      `;
    }
  }

  if (!title) {
    title = 'WorldNewzs – Your World, Your News';
  }

  let html = htmlTemplate;

  // 1. Update Title tag (Fixed regex to match <title data-rh="true"> and all attributes)
  html = html.replace(/<title[^>]*>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // 2. Update Meta Description & Keywords
  html = replaceMeta(html, 'name', 'description', description);
  html = replaceMeta(html, 'name', 'keywords', keywords);

  // 3. Update Canonical link
  const canonicalRegex = /<link\s+[^>]*rel=["']canonical["'][^>]*href=["'].*?["']/i;
  if (canonicalRegex.test(html)) {
    html = html.replace(canonicalRegex, `<link rel="canonical" href="${escapeHtml(canonical)}"`);
  } else {
    html = html.replace('</head>', `<link rel="canonical" href="${escapeHtml(canonical)}" />\n</head>`);
  }

  // 4. Update Open Graph Meta Tags
  html = replaceMeta(html, 'property', 'og:title', title);
  html = replaceMeta(html, 'property', 'og:description', description);
  html = replaceMeta(html, 'property', 'og:image', imageUrl);
  html = replaceMeta(html, 'property', 'og:url', canonical);
  html = replaceMeta(html, 'property', 'og:type', ogType);

  // 5. Update Twitter Cards
  html = replaceMeta(html, 'name', 'twitter:title', title);
  html = replaceMeta(html, 'name', 'twitter:description', description);
  html = replaceMeta(html, 'name', 'twitter:image', imageUrl);

  // 6. Inject Schema if present
  if (articleJsonLd) {
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>\n</head>`);
  }

  // 7. Inject Rich Fallback Body into semantic-fallback-container
  if (richFallbackBody) {
    const fallbackContainerRegex = /<div id="semantic-fallback-container"[\s\S]*?<\/div>\s*<\/div>/i;
    if (fallbackContainerRegex.test(html)) {
      html = html.replace(
        fallbackContainerRegex,
        `<div id="semantic-fallback-container" style="padding: 24px; max-width: 900px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">\n${richFallbackBody}\n</div>\n</div>`
      );
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=43200');
  return res.status(200).send(html);
}
