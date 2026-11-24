export default async function handler(req, res) {
  const backendUrl = 'https://worldnewz.onrender.com/news-sitemap.xml';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const response = await fetch(backendUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const xml = await response.text();
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=900');
      return res.status(200).send(xml);
    }
  } catch (error) {
    console.error('Error fetching dynamic news sitemap:', error);
  }
  
  // Fallback XML sitemap if backend is asleep/down
  const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>https://worldnewzs.in</loc>
    <news:news>
      <news:publication>
        <news:name>WorldNewzs</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date().toISOString()}</news:publication_date>
      <news:title>WorldNewzs - Breaking News and Latest Headlines</news:title>
    </news:news>
  </url>
</urlset>`;
  
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).send(fallbackXml);
}
