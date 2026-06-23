import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGE_METADATA = {
  'home': {
    title: 'WorldNewzs – Your World, Your News',
    description: 'Stay updated with the latest news in sports, business, technology, health, and more on WorldNewzs, a premium news aggregator.',
    keywords: 'news, breaking news, latest news, sports news, business news, technology news, health news, world news, daily news, WorldNewzs',
    canonical: 'https://worldnewzs.in',
    ogImage: 'https://worldnewzs.in/og-image.png',
    ogType: 'website'
  },
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

export default async function handler(req, res) {
  const { id, page } = req.query;

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

  let title = '';
  let description = '';
  let imageUrl = 'https://worldnewzs.in/og-image.png';
  let canonical = 'https://worldnewzs.in';
  let keywords = 'news, breaking news, latest headlines, WorldNewzs';
  let ogType = 'website';
  let articleJsonLd = null;
  let bodyFallback = '';

  // Case A: Pre-render static/category page
  if (page && PAGE_METADATA[page]) {
    const meta = PAGE_METADATA[page];
    title = meta.title;
    description = meta.description;
    imageUrl = meta.ogImage || imageUrl;
    canonical = meta.canonical;
    keywords = meta.keywords || keywords;
    ogType = meta.ogType || ogType;

    // Fetch daily dynamic SEO keywords from backend
    const dynamicKeywords = await fetchKeywordsWithFallback(page);
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

    const newsCategories = [
      'home', 'politics', 'technology', 'business', 'science-health',
      'sports', 'money', 'gaming', 'cartoons', 'entertainment',
      'lifestyle', 'education', 'opinion', 'trending', 'podcasts-videos',
      'local-news', 'services', 'shopping', 'travel', 'food'
    ];

    let articlesListHtml = '';
    if (newsCategories.includes(page)) {
      let fetchUrl = 'https://worldnewz.onrender.com/api/news/discover?pageSize=8';
      if (page !== 'home') {
        fetchUrl = `https://worldnewz.onrender.com/api/news/${page}?pageSize=8`;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(fetchUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const articles = data.articles || data.results || [];
          if (articles && articles.length > 0) {
            articlesListHtml = articles.map(art => {
              const artId = art.id || art.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              const artTitle = art.headline || art.title || '';
              const artSummary = art.summary || art.description || '';
              const artSource = typeof art.source === 'string' ? art.source : (art.source?.name || '');
              const artDate = art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : '';
              return `
                <article style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                  <h3><a href="/article/${artId}">${escapeHtml(artTitle)}</a></h3>
                  <p style="font-size: 0.85rem; color: #666; margin: 5px 0;">
                    ${artSource ? `Source: ${escapeHtml(artSource)} | ` : ''} 
                    ${artDate ? `Published: ${escapeHtml(artDate)}` : ''}
                  </p>
                  <p style="margin: 5px 0;">${escapeHtml(artSummary)}</p>
                </article>
              `;
            }).join('');
          }
        }
      } catch (err) {
        console.error(`Error fetching category ${page} articles:`, err);
      }
    }

    bodyFallback = `
      <div id="semantic-fallback-container" style="padding: 20px; max-width: 800px; margin: 0 auto; font-family: sans-serif;">
        <main>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
          ${articlesListHtml ? `
            <section style="margin-top: 30px;">
              <h2>Latest Stories</h2>
              ${articlesListHtml}
            </section>
          ` : `
            <p>Read the latest about ${escapeHtml(title)} and take part in interactive elements on WorldNewzs.</p>
          `}
        </main>
      </div>
    `;
  }
  // Case B: Pre-render dynamic article
  else if (id) {
    const cleanQuery = id.split('-').join(' ');
    const backendUrl = `https://worldnewz.onrender.com/api/news/search?query=${encodeURIComponent(cleanQuery)}&pageSize=1`;

    let article = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(backendUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          article = data.results[0];
        }
      }
    } catch (error) {
      console.error('Error fetching article metadata for pre-render:', error);
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
        "author": {
          "@type": "Person",
          "name": article.author || (typeof article.source === 'string' ? article.source : (article.source?.name || "WorldNewzs Editorial Desk")),
          "url": "https://worldnewzs.in/about"
        },
        "publisher": {
          "@type": "Organization",
          "name": "WorldNewzs",
          "logo": {
            "@type": "ImageObject",
            "url": "https://worldnewzs.in/logo.svg"
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

      bodyFallback = `
        <div id="semantic-fallback-container" style="padding: 20px; max-width: 800px; margin: 0 auto; font-family: sans-serif;">
          <article>
            <h1>${escapeHtml(title)}</h1>
            <p style="font-size: 0.9rem; color: #555; margin: 10px 0;">
              <strong>Published:</strong> ${escapeHtml(article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Recent')} | 
              <strong>Category:</strong> ${escapeHtml(article.category || 'News')} | 
              <strong>Author/Source:</strong> ${escapeHtml(article.author || (typeof article.source === 'string' ? article.source : (article.source?.name || 'WorldNewzs Editorial Desk')))}
            </p>
            ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 25px;" />` : ''}
            <div style="font-size: 1.1rem; line-height: 1.8; color: #222; text-align: justify; white-space: pre-wrap;">
              ${bodyText}
            </div>
          </article>
        </div>
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

  // 6. Inject Schema if present
  if (articleJsonLd) {
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>\n</head>`);
  }

  // 7. Inject Body Fallback
  if (bodyFallback) {
    const fallbackRegex = /<div id="semantic-fallback-container"[\s\S]*?<\/div>/i;
    if (fallbackRegex.test(html)) {
      html = html.replace(fallbackRegex, bodyFallback);
    } else {
      html = html.replace('<body>', `<body>\n${bodyFallback}`);
    }
  }

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=450');
  return res.status(200).send(html);
}
