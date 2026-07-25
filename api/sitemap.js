export default async function handler(req, res) {
  const backendUrl = 'https://worldnewz.onrender.com/sitemap.xml';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const response = await fetch(backendUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const xml = await response.text();
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=1800');
      return res.status(200).send(xml);
    }
  } catch (error) {
    console.error('Error fetching dynamic sitemap:', error);
  }
  
  // Fallback to static routes sitemap
  const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://worldnewzs.in</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/politics</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/technology</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/business</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/science-health</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/sports</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/money</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/weather</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/shopping</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/travel</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/food</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/entertainment</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/services</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/gaming</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/cartoons</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/stocks</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/polls</loc><changefreq>hourly</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/about</loc><changefreq>monthly</changefreq><priority>0.5</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/contact</loc><changefreq>monthly</changefreq><priority>0.5</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/privacy-policy</loc><changefreq>yearly</changefreq><priority>0.3</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/terms</loc><changefreq>yearly</changefreq><priority>0.3</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/amazon-products</loc><changefreq>daily</changefreq><priority>0.9</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://worldnewzs.in/chatbot</loc><changefreq>daily</changefreq><priority>0.8</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
</urlset>`;
  
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).send(fallbackXml);
}
