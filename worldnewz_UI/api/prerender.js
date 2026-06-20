import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  // Regex to match <meta ... name/property="value" ... content="content" ...> or vice versa
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
  
  // If not found, append before </head>
  const metaTag = propertyAttr === 'property' 
    ? `<meta property="${attrValue}" content="${escapeHtml(newValue)}" />`
    : `<meta name="${attrValue}" content="${escapeHtml(newValue)}" />`;
  return htmlStr.replace('</head>', `${metaTag}\n</head>`);
}

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).send('Article ID / Slug is required');
  }

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

  if (!article) {
    // If article is not found or backend is offline, serve index.html as is
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).send(htmlTemplate);
  }

  const title = article.headline || article.title;
  const description = article.summary || article.description || '';
  const imageUrl = article.urlToImage || article.imageUrl || 'https://worldnewzs.in/og-image.png';
  const canonical = `https://worldnewzs.in/article/${id}`;
  const category = article.category || 'News';

  let html = htmlTemplate;

  // 1. Update Title tag
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)} | WorldNewzs</title>`);

  // 2. Update Description
  html = replaceMeta(html, 'name', 'description', description);

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
  html = replaceMeta(html, 'property', 'og:type', 'article');

  // 5. Update Twitter Cards Meta Tags
  html = replaceMeta(html, 'name', 'twitter:title', `${title} | WorldNewzs`);
  html = replaceMeta(html, 'name', 'twitter:description', description);
  html = replaceMeta(html, 'name', 'twitter:image', imageUrl);
  html = replaceMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = replaceMeta(html, 'name', 'twitter:site', '@WorldNewzs');

  // 6. Inject Article Specific JSON-LD Schema
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "description": description,
    "image": [imageUrl],
    "datePublished": article.publishedAt || new Date().toISOString(),
    "dateModified": article.publishedAt || new Date().toISOString(),
    "url": canonical,
    "articleSection": category,
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

  html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLdSchema)}</script>\n</head>`);

  // 7. Inject article content semantic fallback in body (so bots read actual text in body before React mounts)
  const bodyArticleFallback = `
    <div id="fallback-article-content" style="display: none;">
      <article>
        <h1>${escapeHtml(title)}</h1>
        <p><strong>Published on:</strong> ${escapeHtml(article.publishedAt)}</p>
        <p><strong>Category:</strong> ${escapeHtml(category)}</p>
        <p><strong>Source:</strong> ${escapeHtml(typeof article.source === 'string' ? article.source : (article.source?.name || 'News'))}</p>
        <div class="summary">${escapeHtml(description)}</div>
      </article>
      <nav>
        <p>Return to <a href="/">WorldNewzs Home</a> or browse <a href="/${escapeHtml(category.toLowerCase())}">${escapeHtml(category)} News</a>.</p>
      </nav>
    </div>
  `;
  html = html.replace('<body>', `<body>\n${bodyArticleFallback}`);

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=450');
  return res.status(200).send(html);
}
