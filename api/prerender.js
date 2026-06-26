import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGE_METADATA = {
  'badge-quiz': {
    title: 'Badge Quiz – Challenge Your Trivia Knowledge',
    description: 'Take the WorldNewzs daily trivia badge quiz! Answer trivia questions across sports, business, tech, history, and science to earn badges and coins.',
    keywords: 'trivia quiz, badge quiz, knowledge quiz, daily trivia, earn coins, WorldNewzs quiz',
    canonical: 'https://worldnewzs.in/badge-quiz',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'polls': {
    title: 'Opinion Polls – Speak Your Mind On Hot Topics',
    description: 'Participate in WorldNewzs daily opinion polls. Cast your vote on sports, politics, tech, and hot global topics, and check live voter percentages instantly.',
    keywords: 'opinion polls, public opinion, cast vote, voting polls, daily polls',
    canonical: 'https://worldnewzs.in/polls',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'politics': {
    title: 'Politics News – World & Local Geopolitics',
    description: 'Stay updated with global politics, government policies, elections, policy updates, and expert political analysis on WorldNewzs.',
    keywords: 'politics news, government policy, elections, geopolitical updates',
    canonical: 'https://worldnewzs.in/politics',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'technology': {
    title: 'Technology News – Latest AI, Tech & Gadget Reviews',
    description: 'Discover Silicon Valley breakthroughs, AI updates, budget phone launches, cybersecurity trends, and software reviews on WorldNewzs.',
    keywords: 'tech news, AI advancements, gadget launches, software reviews',
    canonical: 'https://worldnewzs.in/technology',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'business': {
    title: 'Business News – Stock Markets, Finance & Mergers',
    description: 'Latest financial news, stock market updates, startup funding, merger announcements, and economic trends on WorldNewzs.',
    keywords: 'business news, stock market, start-ups, economy',
    canonical: 'https://worldnewzs.in/business',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'science-health': {
    title: 'Science & Health News – Space, Medicine & Wellness',
    description: 'Stay informed with medical research breakthroughs, public health guidelines, space exploration news, and climate discoveries on WorldNewzs.',
    keywords: 'science news, medical research, health tips, climate science',
    canonical: 'https://worldnewzs.in/science-health',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'sports': {
    title: 'Sports News – Live Scores, Cricket & Football Updates',
    description: 'Get real-time sports results, cricket match updates, IPL scores, transfers, and rankings updates on WorldNewzs.',
    keywords: 'sports news, cricket scores, IPL schedule, football transfer',
    canonical: 'https://worldnewzs.in/sports',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'money': {
    title: 'Money & Finance – Personal Investments & Tax Updates',
    description: 'Learn personal finance management, tax-saving tips, investment strategies, and cryptocurrency trends on WorldNewzs.',
    keywords: 'personal finance, investment, tax-saving, crypto news',
    canonical: 'https://worldnewzs.in/money',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'weather': {
    title: 'Weather Forecast – Local & Global Temperature Updates',
    description: 'Check current weather forecasts, severe weather alerts, temperature indices, and regional climate reports on WorldNewzs.',
    keywords: 'weather forecast, temperature, climate alerts, local weather',
    canonical: 'https://worldnewzs.in/weather',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'shopping': {
    title: 'Shopping Deals – Latest Sales, Coupons & Product Reviews',
    description: 'Find online shopping discounts, promo codes, e-commerce product reviews, and shopping guides on WorldNewzs.',
    keywords: 'shopping deals, discount coupons, product reviews',
    canonical: 'https://worldnewzs.in/shopping',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'travel': {
    title: 'Travel Guide – Top Destinations, Tips & Bookings',
    description: 'Explore top travel destinations, packing advice, hotel search links, and budget travel guidelines on WorldNewzs.',
    keywords: 'travel guide, tourism, budget travel, hotel bookings',
    canonical: 'https://worldnewzs.in/travel',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'food': {
    title: 'Food & Recipes – Cooking Guides & Restaurant Reviews',
    description: 'Browse quick recipes, cooking hacks, kitchen guides, and honest restaurant reviews on WorldNewzs.',
    keywords: 'cooking recipes, restaurant reviews, food tips',
    canonical: 'https://worldnewzs.in/food',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'entertainment': {
    title: 'Entertainment News – Movies, Music & Celebrity Gossips',
    description: 'Keep up with movie releases, celebrity gossip, music charts, television shows, and pop culture on WorldNewzs.',
    keywords: 'entertainment news, movie reviews, celebrity gossip, music charts',
    canonical: 'https://worldnewzs.in/entertainment',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'services': {
    title: 'Online Services – Utilities & Digital Portals',
    description: 'Access digital tools, essential services lookup, utilities directories, and online portals on WorldNewzs.',
    keywords: 'online services, utility lookup, digital portals',
    canonical: 'https://worldnewzs.in/services',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'gaming': {
    title: 'Gaming News – Reviews, Guides & Esports Tournaments',
    description: 'Get reviews of new PC, console, and mobile game releases, gaming tips, and esports tournament news on WorldNewzs.',
    keywords: 'gaming news, game reviews, esports, cheats',
    canonical: 'https://worldnewzs.in/gaming',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'cartoons': {
    title: 'Cartoons & Editorial Satire',
    description: 'Daily political cartoons, comic strips, editorial illustrations, and light-hearted satire on WorldNewzs.',
    keywords: 'comic strips, political cartoons, editorial satire',
    canonical: 'https://worldnewzs.in/cartoons',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'stocks': {
    title: 'Stock Market Live – Real-time Nifty, Sensex & Stock Price Alerts',
    description: 'Live indices updates, stock price movements, top gainers/losers list, and stock market summaries on WorldNewzs.',
    keywords: 'stock prices, live indices, nifty 50, sensex index',
    canonical: 'https://worldnewzs.in/stocks',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'about': {
    title: 'About WorldNewzs – Our Editorial Mission',
    description: 'Learn about WorldNewzs, our team, our mission, and our editorial guidelines for transparent and objective news curation.',
    keywords: 'about worldnewzs, news aggregator mission, editorial staff',
    canonical: 'https://worldnewzs.in/about',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'contact': {
    title: 'Contact Us – Get in Touch with WorldNewzs',
    description: 'Contact the WorldNewzs team. Send us your feedback, report site issues, or submit news stories.',
    keywords: 'contact news aggregator, submit feedback, customer service',
    canonical: 'https://worldnewzs.in/contact',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'jobs': {
    title: 'Jobs – Find Your Next Career Opportunity',
    description: 'Explore the latest job listings, career openings, and remote employment opportunities on WorldNewzs.',
    keywords: 'jobs, job search, career opportunities, employment, job openings, remote jobs',
    canonical: 'https://worldnewzs.in/jobs',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'jobs/post-job': {
    title: 'Post a Job – Hire Remote & Local Talent',
    description: 'Submit your job postings to WorldNewzs Jobs board. Reach thousands of active job seekers, developers, designers, and marketers globally.',
    keywords: 'post a job, hire talent, job board posting, recruit remote workers, post jobs free',
    canonical: 'https://worldnewzs.in/jobs/post-job',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'privacy-policy': {
    title: 'Privacy Policy – WorldNewzs',
    description: 'WorldNewzs Privacy Policy outlines how we collect, use, and protect your personal information on our platform.',
    keywords: 'privacy policy, cookies disclosure, user safety',
    canonical: 'https://worldnewzs.in/privacy-policy',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
  'terms': {
    title: 'Terms & Conditions – WorldNewzs',
    description: 'WorldNewzs Terms and Conditions outline user agreements, code of conduct, and terms of service.',
    keywords: 'terms of service, conditions of use, user agreement',
    canonical: 'https://worldnewzs.in/terms',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  }
};

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function convertMarkdownToHtml(text) {
  if (!text) return '';
  
  const blocks = text.split(/\n\n+/);
  return blocks.map(block => {
    let trimmed = block.trim();
    if (!trimmed) return '';
    
    // Headings
    if (trimmed.startsWith('### ')) {
      return `<h3 style="font-size: 1.4rem; font-weight: 700; margin-top: 30px; margin-bottom: 15px; color: #c83a15;">${escapeHtml(trimmed.substring(4))}</h3>`;
    }
    if (trimmed.startsWith('## ')) {
      return `<h2 style="font-size: 1.6rem; font-weight: 800; margin-top: 30px; margin-bottom: 15px; color: #c83a15;">${escapeHtml(trimmed.substring(3))}</h2>`;
    }
    if (trimmed.startsWith('# ')) {
      return `<h1 style="font-size: 2.0rem; font-weight: 800; margin-top: 30px; margin-bottom: 15px; color: #c83a15;">${escapeHtml(trimmed.substring(2))}</h1>`;
    }
    
    // Lists
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const items = trimmed.split(/\n[*+-]\s+/);
      const listItemsHtml = items.map(item => {
        const itemText = item.replace(/^[*+-]\s+/, '');
        return `<li style="margin-bottom: 8px;">${parseInlineMarkdownHtml(itemText)}</li>`;
      }).join('');
      return `<ul style="margin-left: 20px; margin-bottom: 20px;">${listItemsHtml}</ul>`;
    }
    
    // Regular paragraph
    return `<p style="margin-bottom: 20px; text-align: justify; line-height: 1.8;">${parseInlineMarkdownHtml(trimmed)}</p>`;
  }).join('\n');
}

function parseInlineMarkdownHtml(text) {
  let html = escapeHtml(text);
  
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, linkText, linkUrl) => {
    const isExternal = linkUrl.startsWith('http');
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${linkUrl}" style="color: #c83a15; font-weight: 600; text-decoration: underline;"${targetAttr}>${linkText}</a>`;
  });
  
  return html;
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
  // Set CSP and security headers immediately for all serverless HTML responses
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.googletagmanager.com https://static.hotjar.com https://pagead2.googlesyndication.com https://adservice.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://partner.googleadservices.com https://*.adtrafficquality.google; connect-src 'self' https://accounts.google.com https://worldnewz.onrender.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://*.hotjar.com wss://*.hotjar.com https://*.hotjar.io wss://*.hotjar.io https://*.adtrafficquality.google https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net; img-src * data: blob: android-webview-video-poster:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' data: https://fonts.gstatic.com https://static.hotjar.com; frame-src 'self' https://accounts.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://vars.hotjar.com https://*.hotjar.com; object-src 'none'; media-src * data: blob:;");

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
    path.join(__dirname, '..', 'api', 'fallback_news.json'),
    path.join(__dirname, 'fallback_news.json')
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

  // Static content fallback declarations for policy and about pages
  const PRIVACY_POLICY_HTML = `
    <h1>Privacy Policy</h1>
    <p style="font-size: 0.95rem; color: #555;"><strong>Last Updated: June 20, 2026</strong> | <strong>Effective Date: June 20, 2026</strong></p>
    <p>Welcome to WorldNewzs. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at ganeshkumard56@gmail.com.</p>
    
    <h3>1. Information We Collect</h3>
    <p>We collect personal information that you voluntarily provide to us when registering at the Express interest in obtaining information about us or our products and services, when participating in activities on the website or otherwise contacting us.</p>
    <p>The personal information that we collect depends on the context of your interactions with us and the website, the choices you make and the products and features you use. The personal information we collect can include the following: name, email address, contact data, credentials, and social media login data.</p>
    
    <h3>2. How We Use Your Information</h3>
    <p>We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
    <p>We use the information we collect or receive: to facilitate account creation and logon process, to send you marketing and promotional communications, to send administrative information to you, to post testimonials, to deliver targeted advertising, and to request feedback.</p>
    
    <h3>3. Google AdSense & Third-Party Cookies</h3>
    <p>We partner with third-party advertising vendors, including Google, to serve ads when you visit our website. Google uses cookies to serve ads based on your prior visits to our website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.</p>
    <p>You may opt out of personalized advertising by visiting Google's Ads Settings or by visiting aboutads.info. We use Google AdSense (Publisher ID: ca-pub-7547748414764075) and Google Analytics (Measurement ID: G-JD24Y5Y78Z) on our website.</p>
    
    <h3>4. Data Retention & Privacy Rights</h3>
    <p>Under GDPR and CCPA, you have specific rights regarding your personal information, including the right to access, rectify, delete, restrict processing, and opt-out of the sale of your personal data. To exercise these rights, please contact us. We do not sell your personal data to third parties. We retain your data only for as long as necessary to fulfill user requests and comply with legal audits.</p>
  `;

  const TERMS_HTML = `
    <h1>Terms and Conditions</h1>
    <p style="font-size: 0.95rem; color: #555;"><strong>Last Updated: June 20, 2026</strong></p>
    <p>Welcome to WorldNewzs. These terms and conditions outline the rules and regulations for the use of WorldNewzs's Website, located at https://worldnewzs.in.</p>
    
    <h3>1. Intellectual Property Rights</h3>
    <p>Other than the content you own, under these Terms, WorldNewzs and/or its licensors own all the intellectual property rights and materials contained in this Website. All rights are reserved. You are granted limited license only for purposes of viewing the material contained on this Website.</p>
    <p>We aggregate news headlines, summaries, and images from independent third-party sources. All aggregated content remains the property of their respective copyright owners. If you believe your copyrighted work has been aggregated in a way that constitutes copyright infringement, please contact us immediately.</p>
    
    <h3>2. Restrictions & Prohibitions</h3>
    <p>You are specifically restricted from all of the following: publishing any Website material in any other media, selling, sublicensing and/or otherwise commercializing any Website material, publicly performing and/or showing any Website material, using this Website in any way that is or may be damaging to this Website, or using this Website in any way that impacts user access to this Website.</p>
    
    <h3>3. Disclaimer of Warranties & Limitation of Liability</h3>
    <p>This Website is provided "as is," with all faults, and WorldNewzs expresses no representations or warranties, of any kind related to this Website or the materials contained on this Website. In no event shall WorldNewzs, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract.</p>
  `;

  const ABOUT_HTML = `
    <h1>About WorldNewzs</h1>
    <p>WorldNewzs is a premium, real-time news aggregator delivering the latest breaking stories and in-depth analyses across a diverse range of topics, including technology, business, politics, health, and sports. Our platform is designed to provide readers with a comprehensive, objective, and well-rounded perspective on current events.</p>
    
    <h3>Our Mission</h3>
    <p>At WorldNewzs, our mission is to empower global citizens with accurate, timely, and relevant information. In an era of information overload and fragmented reporting, we strive to bring order and clarity to the daily news cycle. We curate headlines, summaries, and links from reputable international and regional news organizations, ensuring that our readers have access to diverse viewpoints and factual reporting.</p>
    
    <h3>Editorial Guidelines & Integrity</h3>
    <p>We do not produce original reporting or conduct independent journalism. Instead, we act as a trusted curator, applying strict filters to ensure the quality and credibility of the sources we aggregate. Our automated systems and editorial team work continuously to verify source authority, monitor content quality, and prevent the spread of misleading or sensationalized information. We value transparency and strictly attribute all aggregated content to its original publishers.</p>
    
    <h3>Our Core Values</h3>
    <ul>
      <li><strong>Accuracy:</strong> We prioritize factual correctness and source verification above all else.</li>
      <li><strong>Diversity:</strong> We display news from multiple perspectives to encourage critical thinking.</li>
      <li><strong>User Privacy:</strong> We protect our visitors' personal data and respect their cookie preferences.</li>
      <li><strong>Technical Innovation:</strong> We leverage modern web technologies to deliver a fast, secure, and user-friendly experience.</li>
    </ul>
  `;

  const CONTACT_HTML = `
    <h1>Contact Us</h1>
    <p>We value your feedback, inquiries, and suggestions. Whether you want to report a technical issue, submit a news tip, request a correction, or explore business partnerships, our team is ready to assist you.</p>
    
    <h3>Email Inquiries</h3>
    <p>For general inquiries, feedback, or support, please email us at:<br />
    <strong>ganeshkumard56@gmail.com</strong></p>
    <p>For editorial concerns, copyright issues, or takedown requests, please email us at:<br />
    <strong>editorial@worldnewzs.in</strong></p>
    
    <h3>Physical Address & Office</h3>
    <p>WorldNewzs Headquarters<br />
    Ganesh CO.<br />
    Hyderabad, Telangana, India</p>
    
    <h3>Support Hours</h3>
    <p>Our online support and editorial desk are active during the following hours:<br />
    Monday to Friday: 9:00 AM – 6:00 PM (IST)<br />
    Saturday: 10:00 AM – 2:00 PM (IST)<br />
    Sunday: Closed</p>
    <p>We aim to respond to all email inquiries within 24 to 48 business hours. Thank you for your support and interest in WorldNewzs.</p>
  `;

  let title = '';
  let description = '';
  let imageUrl = 'https://worldnewzs.in/og-image.png';
  let canonical = 'https://worldnewzs.in';
  let keywords = 'news, breaking news, latest headlines, WorldNewzs';
  let ogType = 'website';
  let articleJsonLd = null;
  let richFallbackBody = '';

  const activePage = page || 'home';

  // Helper function to fetch with a timeout and fall back to local JSON
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
      console.warn(`Fetch to ${fullUrl} failed or timed out: ${e.message}. Using fallback news.`);
    }
    // Filter local fallback news
    if (categoryFilter) {
      return fallbackNews.filter(a => 
        a.category === categoryFilter || 
        (categoryFilter === 'science-health' && (a.category === 'science' || a.category === 'health'))
      );
    }
    return fallbackNews;
  };

  // Fetch keywords from backend daily SEO API
  const fetchKeywordsWithFallback = async (category) => {
    const fullUrl = `https://worldnewz.onrender.com/api/seo/keywords/${category.toLowerCase()}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(fullUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.metaDesc) {
          return {
            metaDesc: data.metaDesc,
            primary: Array.isArray(data.primary) ? data.primary : (typeof data.primary === 'string' ? JSON.parse(data.primary) : []),
            longtail: Array.isArray(data.longtail) ? data.longtail : (typeof data.longtail === 'string' ? JSON.parse(data.longtail) : []),
            trending: Array.isArray(data.trending) ? data.trending : (typeof data.trending === 'string' ? JSON.parse(data.trending) : [])
          };
        }
      }
    } catch (e) {
      console.warn(`Fetch keywords for ${category} failed: ${e.message}`);
    }
    return null;
  };

  // Generate unique, deterministic background text based on title, category, and date
  const generateUniqueBackdropText = (articleTitle, category, dateStr) => {
    const date = dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'recently';
    const cleanTitle = articleTitle.replace(/[|:-].*$/, '').trim();
    
    const intros = [
      `The recent developments surrounding "${cleanTitle}" mark a significant milestone in the ${category} landscape. As observers examine the nuances of this event, it becomes increasingly clear that the implications extend far beyond the immediate headlines.`,
      `As news of "${cleanTitle}" continues to unfold, industry experts and analysts are closely examining the broader context of this situation. This event, occurring in the ${category} sector, highlights key trends that have been developing over several months.`,
      `With the announcement of "${cleanTitle}" on ${date}, the ${category} community has experienced a notable shift. Understanding the background of these events requires looking at the structural dynamics that govern this domain.`
    ];

    const bodies = [
      `In recent years, the ${category} sphere has been characterized by rapid innovation and shifting regulatory frameworks. Stakeholders are forced to adapt to volatile market conditions, technological updates, and changing public expectations. The circumstances detailed in this report reflect these overarching challenges, emphasizing the need for robust strategic planning and transparent communication among all involved parties.`,
      `Historically, topics like "${cleanTitle}" have triggered extensive debates regarding compliance, public trust, and technological efficiency. As new guidelines emerge globally, organization leaders are re-evaluating their operations to remain competitive and socially responsible. This ongoing transition underscores the importance of objective coverage and thorough analysis.`,
      `Furthermore, public interest in ${category} developments has reached historic levels, driven by digital connectivity and immediate information sharing. This heightened awareness means that every action, decision, or announcement is scrutinized by a global audience, forcing a pivot toward higher standards of accountability and expertise.`
    ];

    const conclusions = [
      `Moving forward, our editorial team at WorldNewzs will continue to track the aftermath of "${cleanTitle}" and provide updated reports as new details emerge. We remain committed to delivering clear, verified, and objective insights to help our readers navigate these complex issues.`,
      `As the situation surrounding "${cleanTitle}" stabilizes, the long-term impact on the ${category} ecosystem will become more apparent. Observers should watch for subsequent policy statements and stakeholder responses in the coming weeks.`,
      `In conclusion, the details emerging from this ${category} report serve as a reminder of how interconnected modern global systems have become. Stay tuned to WorldNewzs for further updates and expert commentary on this evolving story.`
    ];

    const titleSum = cleanTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const introIndex = titleSum % intros.length;
    const bodyIndex = (titleSum + 1) % bodies.length;
    const conclusionIndex = (titleSum + 2) % conclusions.length;

    const detailParagraph = `When analyzing "${cleanTitle}" in detail, one must consider how this fits into the historical timeline of ${category} advancements. Over the past decade, several similar events have paved the way for the current scenario, showing that progress is rarely linear. Industry reports suggest that while the initial reaction to such news is often speculative, the structural changes that follow tend to be permanent, reshaping consumer habits and corporate policies alike.`;

    return `<h3>Editorial Analysis & Category Background</h3>\n<p>${intros[introIndex]}</p>\n\n<p>${bodies[bodyIndex]}</p>\n\n<p>${detailParagraph}</p>\n\n<p>${conclusions[conclusionIndex]}</p>`;
  };

  // Case A: Pre-render static pages
  if (activePage === 'home') {
    title = 'WorldNewzs – Your World, Your News';
    description = 'Stay updated with the latest news in sports, business, technology, health, and more.';
    keywords = 'news, breaking news, latest news, sports news, business news, technology news, health news, world news, daily news, WorldNewzs';
    canonical = 'https://worldnewzs.in';

    const articles = await fetchArticlesWithFallback('/news/discover');
    let articlesHtml = '';
    articles.slice(0, 10).forEach(article => {
      const artTitle = article.title || article.headline;
      const artDesc = article.description || article.summary || '';
      const artSlug = article.id || artTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      articlesHtml += `
        <article style="margin-bottom: 30px; border-bottom: 1px dashed #ddd; padding-bottom: 20px;">
          <h2 style="margin-top: 0; font-size: 1.4rem; font-weight: 700;"><a href="/article/${artSlug}" style="color: #111; text-decoration: none;">${escapeHtml(artTitle)}</a></h2>
          <p style="font-size: 0.85rem; color: #777; margin-bottom: 10px;">Published on: ${escapeHtml(article.publishedAt)} | Category: ${escapeHtml(article.category || 'News')} | Source: ${escapeHtml(typeof article.source === 'string' ? article.source : (article.source?.name || 'News'))}</p>
          <p style="line-height: 1.6; color: #333;">${escapeHtml(artDesc)}</p>
          <p><a href="/article/${artSlug}" style="color: #c83a15; font-weight: bold; text-decoration: none;">Read Full Article &rarr;</a></p>
        </article>
      `;
    });

    richFallbackBody = `
      <h1>Latest Breaking News & Global Headlines</h1>
      <p style="margin-bottom: 30px; color: #555; font-size: 1.1rem; line-height: 1.6;">
        Welcome to WorldNewzs, your premier source for comprehensive, real-time news aggregation. We gather, verify, and organize breaking updates and factual analyses across technology, finance, politics, health, and sports. Stay informed with daily insights from trusted global publishers.
      </p>
      <section>
        ${articlesHtml}
      </section>
    `;
  }
  else if (PAGE_METADATA[activePage]) {
    const meta = PAGE_METADATA[activePage];
    title = meta.title;
    description = meta.description;
    imageUrl = meta.ogImage || imageUrl;
    canonical = meta.canonical;
    keywords = meta.keywords || keywords;
    ogType = meta.ogType || ogType;

    // Fetch daily dynamic SEO keywords from backend
    const dynamicKeywords = await fetchKeywordsWithFallback(activePage);
    if (dynamicKeywords) {
      description = dynamicKeywords.metaDesc || description;
      
      const allKeywordsList = [
        ...dynamicKeywords.primary,
        ...dynamicKeywords.longtail,
        ...dynamicKeywords.trending
      ].filter(Boolean);
      
      if (allKeywordsList.length > 0) {
        keywords = allKeywordsList.join(', ');
      }
    }

    let contentHtml = '';

    if (activePage === 'privacy-policy') {
      contentHtml = PRIVACY_POLICY_HTML;
    } else if (activePage === 'terms') {
      contentHtml = TERMS_HTML;
    } else if (activePage === 'about') {
      contentHtml = ABOUT_HTML;
    } else if (activePage === 'contact') {
      contentHtml = CONTACT_HTML;
    } else {
      // Category page
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
        'stocks': '/news/stocks'
      };
      
      const endpoint = endpointMap[activePage] || `/news/search?category=${activePage}`;
      const articles = await fetchArticlesWithFallback(endpoint, activePage);
      let articlesHtml = '';
      
      articles.slice(0, 10).forEach(article => {
        const artTitle = article.title || article.headline;
        const artDesc = article.description || article.summary || '';
        const artSlug = article.id || artTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        articlesHtml += `
          <article style="margin-bottom: 30px; border-bottom: 1px dashed #ddd; padding-bottom: 20px;">
            <h2 style="margin-top: 0; font-size: 1.4rem; font-weight: 700;"><a href="/article/${artSlug}" style="color: #111; text-decoration: none;">${escapeHtml(artTitle)}</a></h2>
            <p style="font-size: 0.85rem; color: #777; margin-bottom: 10px;">Published on: ${escapeHtml(article.publishedAt)} | Source: ${escapeHtml(typeof article.source === 'string' ? article.source : (article.source?.name || 'News'))}</p>
            <p style="line-height: 1.6; color: #333;">${escapeHtml(artDesc)}</p>
            <p><a href="/article/${artSlug}" style="color: #c83a15; font-weight: bold; text-decoration: none;">Read Full Article &rarr;</a></p>
          </article>
        `;
      });

      contentHtml = `
        <h1>${escapeHtml(title)}</h1>
        <p style="margin-bottom: 30px; color: #555; font-size: 1.1rem; line-height: 1.6;">
          Explore current, verified articles and editorial briefings covering ${escapeHtml(activePage)} on WorldNewzs. We curate reports from top agencies to give you a well-rounded and objective view of the latest updates.
        </p>
        <section>
          ${articlesHtml || '<p>No articles currently available in this category.</p>'}
        </section>
      `;
    }

    richFallbackBody = contentHtml;
  }
  // Case C: Pre-render dynamic job posting
  else if (jobSlug) {
    try {
      const response = await fetch(`https://worldnewz.onrender.com/api/news/jobs/detail/${encodeURIComponent(jobSlug)}`);
      if (response.ok) {
        const job = await response.json();
        if (job) {
          title = `${job.title} at ${job.company_name}`;
          description = `${job.title} job opening at ${job.company_name} in ${job.location}. ${job.remote ? 'Remote work available.' : ''} Read details and apply.`;
          canonical = `https://worldnewzs.in/jobs/detail/${job.slug}`;
          ogType = 'website';
          keywords = (Array.isArray(job.tags) ? job.tags.join(', ') : '') || 'jobs, career, hiring';
          
          richFallbackBody = `
            <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
              <h1 style="font-size: 2.2rem; margin-bottom: 5px;">${escapeHtml(job.title)}</h1>
              <h2 style="font-size: 1.4rem; color: #555; margin-bottom: 20px;">at ${escapeHtml(job.company_name)} | ${escapeHtml(job.location)}</h2>
              <div style="margin-bottom: 20px;">
                ${job.remote ? '<span style="background: #e6f4ea; color: #137333; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; margin-right: 10px;">Remote</span>' : ''}
                ${job.isLocal ? '<span style="background: #e8f0fe; color: #1a73e8; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 0.85rem;">Direct</span>' : ''}
              </div>
              <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 1.1rem; line-height: 1.8; color: #333;">
                ${job.description}
              </div>
              <div style="margin-top: 30px; text-align: center;">
                <p><strong>Every Job and Job posting coming under arbeitnow.com</strong></p>
                <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #137333; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Apply for this Job &rarr;</a>
              </div>
            </article>
          `;
        }
      }
    } catch (err) {
      console.error('Error pre-rendering job detail:', err);
    }
  }
  // Case B: Pre-render dynamic article
  else if (id) {
    const cleanQuery = id.split('-').join(' ');
    const backendUrl = `https://worldnewz.onrender.com/api/news/search?query=${encodeURIComponent(cleanQuery)}&pageSize=1`;

    let article = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const response = await fetch(backendUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          article = data.results[0];
        }
      }
    } catch (error) {
      console.warn('Error fetching article metadata for pre-render, using local fallback:', error);
    }

    // Attempt local fallback lookup if backend lookup failed
    if (!article && fallbackNews.length > 0) {
      article = fallbackNews.find(a => a.id === id) || fallbackNews[0];
    }

    if (article) {
      title = article.headline || article.title;
      description = article.summary || article.description || '';
      imageUrl = article.urlToImage || article.imageUrl || imageUrl;
      canonical = `https://worldnewzs.in/article/${id}`;
      ogType = 'article';
      keywords = (Array.isArray(article.tags) ? article.tags.join(', ') : '') || keywords;

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
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonical
        }
      };

      let bodyText = '';
      try {
        const fullContentUrl = `https://worldnewz.onrender.com/api/news/full-content?url=${encodeURIComponent(article.url)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&category=${encodeURIComponent(article.category || 'News')}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const fullContentRes = await fetch(fullContentUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (fullContentRes.ok) {
          const fullContentData = await fullContentRes.json();
          if (fullContentData && fullContentData.success && Array.isArray(fullContentData.content)) {
            bodyText = fullContentData.content.join('\n\n');
          }
        }
      } catch (err) {
        console.warn('Error fetching full content in pre-render:', err);
      }

      if (!bodyText) {
        bodyText = article.description || article.summary || '';
      }

      if (bodyText.split(' ').length < 600) {
        const uniqueBackground = generateUniqueBackdropText(title, article.category || 'News', article.publishedAt);
        bodyText += "\n\n" + uniqueBackground;
      }

      richFallbackBody = `
        <article>
          <h1 style="font-size: 2.2rem; margin-bottom: 10px; line-height: 1.3;">${escapeHtml(title)}</h1>
          <p style="font-size: 0.9rem; color: #666; margin-bottom: 20px;">
            <strong>By ${escapeHtml(article.author || 'Editorial Staff')}</strong> | Published on: ${escapeHtml(article.publishedAt)} | Category: ${escapeHtml(article.category || 'News')}
          </p>
          ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 25px;" />` : ''}
          <div style="font-size: 1.1rem; line-height: 1.8; color: #222; text-align: justify;">
            ${convertMarkdownToHtml(bodyText)}
          </div>
        </article>
      `;
    }
  }

  // If neither matches or fetch failed, serve index.html untouched
  if (!title) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).send(htmlTemplate);
  }

  let html = htmlTemplate;

  // 1. Update Title tag
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)} | WorldNewzs</title>`);

  // 2. Update Description & Keywords
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
  html = replaceMeta(html, 'property', 'og:title', `${title} | WorldNewzs`);
  html = replaceMeta(html, 'property', 'og:description', description);
  html = replaceMeta(html, 'property', 'og:image', imageUrl);
  html = replaceMeta(html, 'property', 'og:url', canonical);
  html = replaceMeta(html, 'property', 'og:type', ogType);

  // 5. Update Twitter Cards Meta Tags
  html = replaceMeta(html, 'name', 'twitter:title', `${title} | WorldNewzs`);
  html = replaceMeta(html, 'name', 'twitter:description', description);
  html = replaceMeta(html, 'name', 'twitter:image', imageUrl);
  html = replaceMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = replaceMeta(html, 'name', 'twitter:site', '@WorldNewzs');

  // 5b. Inject image preload for LCP optimization
  if (imageUrl) {
    html = html.replace('</head>', `<link rel="preload" as="image" href="${escapeHtml(imageUrl)}" fetchpriority="high" />\n</head>`);
  }

  // 6. Inject Schema if present
  if (articleJsonLd) {
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>\n</head>`);
  }

  // 7. Replace the semantic fallback container with dynamic rich fallback
  if (richFallbackBody) {
    const customPrerenderBody = `
      <header style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center;">
            <img src="/logo-transparent.svg" alt="WorldNewzs Logo" width="40" height="40" style="margin-right: 10px;" />
            <span style="font-size: 1.8rem; font-weight: 800; letter-spacing: 1px; color: #c83a15;">WORLDNEWZS</span>
          </div>
          <form action="/search" method="GET" style="margin: 10px 0; display: flex; gap: 5px;">
            <input type="text" name="q" placeholder="Search news..." aria-label="Search" style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px;" />
            <button type="submit" style="padding: 6px 12px; background-color: #c83a15; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Search</button>
          </form>
        </div>
        <nav style="margin-top: 15px;">
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 15px; font-weight: bold;">
            <li><a href="/" style="color: #333; text-decoration: none;">Home</a></li>
            <li><a href="/politics" style="color: #333; text-decoration: none;">Politics</a></li>
            <li><a href="/technology" style="color: #333; text-decoration: none;">Technology</a></li>
            <li><a href="/business" style="color: #333; text-decoration: none;">Business</a></li>
            <li><a href="/science-health" style="color: #333; text-decoration: none;">Science & Health</a></li>
            <li><a href="/sports" style="color: #333; text-decoration: none;">Sports</a></li>
            <li><a href="/money" style="color: #333; text-decoration: none;">Money</a></li>
            <li><a href="/weather" style="color: #333; text-decoration: none;">Weather</a></li>
            <li><a href="/shopping" style="color: #333; text-decoration: none;">Shopping</a></li>
            <li><a href="/travel" style="color: #333; text-decoration: none;">Travel</a></li>
            <li><a href="/food" style="color: #333; text-decoration: none;">Food</a></li>
            <li><a href="/entertainment" style="color: #333; text-decoration: none;">Entertainment</a></li>
            <li><a href="/gaming" style="color: #333; text-decoration: none;">Gaming</a></li>
            <li><a href="/stocks" style="color: #333; text-decoration: none;">Stocks</a></li>
          </ul>
        </nav>
      </header>

      <div style="background-color: #fff8f6; border-left: 4px solid #c83a15; padding: 12px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 0.9rem; color: #555;">
          <strong>Cookie Notice:</strong> We use cookies to optimize site features, deliver personalized ads via Google AdSense, and track visitor analytics. By continuing to browse, you agree to our use of cookies.
        </p>
      </div>

      <main>
        ${richFallbackBody}
      </main>

      <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 0.9rem;">
        <div style="margin-bottom: 15px; display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
          <a href="/about" style="color: #666;">About Us</a> |
          <a href="/contact" style="color: #666;">Contact Us</a> |
          <a href="/privacy-policy" style="color: #666;">Privacy Policy</a> |
          <a href="/terms" style="color: #666;">Terms & Conditions</a>
        </div>
        <div style="margin-bottom: 15px; display: flex; justify-content: center; gap: 15px;">
          <a href="https://www.youtube.com/@ganeshkumar56" target="_blank" rel="noopener noreferrer" style="color: #c83a15; font-weight: bold;">YouTube</a>
          <a href="https://x.com/ganeshkumard1" target="_blank" rel="noopener noreferrer" style="color: #c83a15; font-weight: bold;">X (Twitter)</a>
          <a href="https://www.facebook.com/profile.php?id=61589266599006" target="_blank" rel="noopener noreferrer" style="color: #c83a15; font-weight: bold;">Facebook</a>
          <a href="https://www.linkedin.com/in/ganesh-kumar-devarasetty-b4743621/recent-activity/all/" target="_blank" rel="noopener noreferrer" style="color: #c83a15; font-weight: bold;">LinkedIn</a>
          <a href="https://www.instagram.com/ganeshkumard12/" target="_blank" rel="noopener noreferrer" style="color: #c83a15; font-weight: bold;">Instagram</a>
        </div>
        <p>&copy; 2026 WorldNewzs. All rights reserved. Powered by Ganesh CO.</p>
      </footer>
    `;

    html = html.replace(
      /<div id="semantic-fallback-container"[\s\S]*?<\/div>/i,
      `<div id="semantic-fallback-container" style="padding: 20px; max-width: 800px; margin: 0 auto; font-family: sans-serif;">\n${customPrerenderBody}\n</div>`
    );
  }

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=450');
  return res.status(200).send(html);
}
