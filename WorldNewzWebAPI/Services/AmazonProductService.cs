using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;
using System.Text;

namespace WorldNewzWebAPI.Services
{
    public class AmazonProductService
    {
        private readonly WorldNewsDbContext _context;
        private readonly string _associateTag;

        public AmazonProductService(WorldNewsDbContext context, IConfiguration config)
        {
            _context = context;
            // Fetch secure Associate Tag from environment variable or appsettings config
            _associateTag = Environment.GetEnvironmentVariable("AMAZON_ASSOCIATE_TAG") 
                             ?? config["AmazonSettings:AssociateTag"] 
                             ?? "ganeshd12-21";
        }

        /// <summary>
        /// Retrieves all Amazon products, converting their product URLs to affiliate links containing the secure tag.
        /// </summary>
        public async Task<List<AmazonProduct>> GetAffiliateProductsAsync()
        {
            // Seed and ensure default products are synchronized in database
            await EnsureDefaultProductsSeededAsync();

            var products = await _context.AmazonProducts
                .OrderByDescending(p => p.LastUpdated)
                .ToListAsync();

            // Transform URLs on the fly to inject the tracking tag safely
            foreach (var product in products)
            {
                product.ProductUrl = BuildAffiliateLink(product.ProductUrl, product.Asin);
                product.ImageUrl = EnsureAbsoluteImageUrl(product.ImageUrl);
            }

            return products;
        }

        /// <summary>
        /// Simulates daily updates by slightly adjusting prices/reviews and shuffling featured products to look fresh every day.
        /// </summary>
        public async Task RefreshDailyDealsAsync()
        {
            await EnsureDefaultProductsSeededAsync();

            var products = await _context.AmazonProducts.ToListAsync();
            var random = new Random();

            foreach (var product in products)
            {
                // Slightly fluctuate prices (+/- 1% to 3%) to simulate live market price updates
                decimal percentChange = (decimal)(random.NextDouble() * 0.04 - 0.02); // -2% to +2%
                decimal priceDiff = product.Price * percentChange;
                product.Price = Math.Round(product.Price + priceDiff, 2);

                // Ensure price does not exceed original price and stays positive
                if (product.Price >= product.OriginalPrice)
                {
                    product.Price = product.OriginalPrice * 0.85m; // 15% discount minimum
                }
                if (product.Price <= 0)
                {
                    product.Price = 199.00m;
                }

                // Increment reviews count to show social activity
                product.ReviewCount += random.Next(1, 15);
                product.LastUpdated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            Console.WriteLine("[AmazonProductService] Successfully ran daily deals refresh simulation.");
        }

        /// <summary>
        /// Manually inserts or updates a product. Automatically parses ASIN from Amazon URL if needed.
        /// </summary>
        public async Task<AmazonProduct> SaveProductAsync(AmazonProduct productDto)
        {
            if (string.IsNullOrWhiteSpace(productDto.Asin) && !string.IsNullOrWhiteSpace(productDto.ProductUrl))
            {
                productDto.Asin = ParseAsin(productDto.ProductUrl);
            }

            if (string.IsNullOrWhiteSpace(productDto.Asin))
            {
                throw new ArgumentException("ASIN could not be determined. Please provide a valid ASIN or Amazon product URL.");
            }

            var existing = await _context.AmazonProducts.FirstOrDefaultAsync(p => p.Asin == productDto.Asin);
            productDto.ImageUrl = EnsureAbsoluteImageUrl(productDto.ImageUrl);

            if (existing != null)
            {
                existing.Title = productDto.Title;
                existing.Description = productDto.Description;
                existing.ImageUrl = productDto.ImageUrl;
                existing.Price = productDto.Price;
                existing.OriginalPrice = productDto.OriginalPrice;
                existing.Rating = productDto.Rating;
                existing.ReviewCount = productDto.ReviewCount;
                existing.Category = productDto.Category;
                existing.ProductUrl = productDto.ProductUrl;
                existing.LastUpdated = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return existing;
            }
            else
            {
                productDto.LastUpdated = DateTime.UtcNow;
                _context.AmazonProducts.Add(productDto);
                await _context.SaveChangesAsync();
                return productDto;
            }
        }

        /// <summary>
        /// Resolves an Amazon product URL by extracting ASIN, looking up the database, 
        /// and falling back to a structured generator if the product doesn't exist yet.
        /// </summary>
        public async Task<AmazonProduct> ParseProductUrlAsync(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                throw new ArgumentException("Product URL cannot be empty.");
            }

            // 1. Resolve any short URLs to get the full destination Amazon link
            string resolvedUrl = await GetRedirectUrlAsync(url.Trim());
            string asin = ParseAsin(resolvedUrl);
            
            // Deterministic ASIN fallback based on URL hash if no ASIN is found
            if (string.IsNullOrEmpty(asin))
            {
                using (var md5 = System.Security.Cryptography.MD5.Create())
                {
                    var hashBytes = md5.ComputeHash(Encoding.UTF8.GetBytes(resolvedUrl));
                    var hashStr = Convert.ToBase64String(hashBytes);
                    var cleanHash = new string(hashStr.Where(char.IsLetterOrDigit).ToArray()).ToUpper();
                    asin = cleanHash.Substring(0, Math.Min(10, cleanHash.Length)).PadRight(10, 'A');
                }
            }

            // 2. Check if product already exists in database
            var existing = await _context.AmazonProducts.FirstOrDefaultAsync(p => p.Asin == asin);
            if (existing != null)
            {
                return existing;
            }

            // 3. Scrape real product details from the Amazon page
            var scraped = await ScrapeAmazonPageAsync(resolvedUrl);

            // Default fallbacks if scraping gets blocked (CAPTCHA)
            string displayTitle = "Premium Amazon Verified Product";
            string description = "Grab this exclusive high-rated deal verified by the WorldNewzs Shopping desk. Click Grab Deal to view pricing and availability on Amazon India.";
            string category = "Shopping";
            decimal price = 999.00m;
            decimal originalPrice = 1999.00m;
            double rating = 4.5;
            int reviewCount = 1250;

            string lowerUrl = resolvedUrl.ToLower();
            if (lowerUrl.Contains("phone") || lowerUrl.Contains("mobile") || lowerUrl.Contains("samsung"))
            {
                displayTitle = "Samsung Galaxy 5G Flagship Smartphone";
                description = "High-performance smartphone featuring advanced camera array, high-refresh AMOLED display, and all-day battery life.";
                category = "Electronics";
                price = 39999.00m;
                originalPrice = 49999.00m;
            }
            else if (lowerUrl.Contains("laptop") || lowerUrl.Contains("computer") || lowerUrl.Contains("dell") || lowerUrl.Contains("hp"))
            {
                displayTitle = "High Performance Thin & Light Laptop";
                description = "Premium lightweight laptop with fast processor, massive storage, and long-lasting battery. Ideal for students and professionals.";
                category = "Electronics";
                price = 45999.00m;
                originalPrice = 59999.00m;
            }
            else if (lowerUrl.Contains("speaker") || lowerUrl.Contains("soundbar") || lowerUrl.Contains("audio"))
            {
                displayTitle = "Bluetooth Wireless Stereo Speaker";
                description = "Ultra-portable waterproof speaker delivering rich bass, clear highs, and up to 12 hours of playtime.";
                category = "Electronics";
                price = 1999.00m;
                originalPrice = 3999.00m;
            }
            else if (lowerUrl.Contains("watch") || lowerUrl.Contains("smartwatch"))
            {
                displayTitle = "Smart Fitness Watch with Heart Rate Monitor";
                description = "Track steps, sleep, workouts, and receive notifications. Waterproof, durable design with sleek touchscreen interface.";
                category = "Gadgets";
                price = 2499.00m;
                originalPrice = 4999.00m;
            }

            string finalTitle = string.IsNullOrWhiteSpace(scraped.Title) ? displayTitle : scraped.Title;
            string finalCategory = string.IsNullOrWhiteSpace(scraped.Category) ? category : scraped.Category;

            string finalImageUrl = await GenerateAndSaveAIProductImageAsync(asin, finalTitle, finalCategory, scraped.ImageUrl);

            // Create new product object
            var newProduct = new AmazonProduct
            {
                Asin = asin,
                Title = finalTitle,
                Description = string.IsNullOrWhiteSpace(scraped.Description) ? description : scraped.Description,
                ImageUrl = finalImageUrl,
                Price = scraped.Price > 0 ? scraped.Price : price,
                OriginalPrice = scraped.OriginalPrice > 0 ? scraped.OriginalPrice : (scraped.Price > 0 ? scraped.Price * 1.25m : originalPrice),
                Rating = rating,
                ReviewCount = reviewCount,
                Category = finalCategory,
                ProductUrl = BuildAffiliateLink(resolvedUrl, asin),
                LastUpdated = DateTime.UtcNow
            };

            // 4. Save/Store the product in Amazon Deals Store (Db Store) so it displays on page
            _context.AmazonProducts.Add(newProduct);
            await _context.SaveChangesAsync();

            return newProduct;
        }

        private async Task<string> GetRedirectUrlAsync(string url)
        {
            if (string.IsNullOrWhiteSpace(url)) return url;

            // Resolve if url is a known short URL redirect or if it does not contain direct DP paths
            bool isDirectAmazonUrl = url.Contains("/dp/") || url.Contains("/gp/product/");
            bool isKnownRedirectDomain = url.Contains("amzn.to") || 
                                         url.Contains("t.co") || 
                                         url.Contains("link.amazon") || 
                                         url.Contains("amzn.in") || 
                                         url.Contains("amazon.co.in") || 
                                         url.Contains("amazon.com");

            if (isDirectAmazonUrl && !isKnownRedirectDomain)
            {
                return url;
            }

            try
            {
                using (var handler = new System.Net.Http.HttpClientHandler { AllowAutoRedirect = true })
                using (var client = new System.Net.Http.HttpClient(handler))
                {
                    client.Timeout = TimeSpan.FromSeconds(10);
                    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                    
                    using (var response = await client.GetAsync(url, System.Net.Http.HttpCompletionOption.ResponseHeadersRead))
                    {
                        var finalUri = response.RequestMessage?.RequestUri?.ToString();
                        if (!string.IsNullOrEmpty(finalUri))
                        {
                            return finalUri;
                        }
                    }
                }
            }
            catch { }

            return url;
        }

        private async Task<(string Title, string Description, string ImageUrl, decimal Price, decimal OriginalPrice, string Category)> ScrapeAmazonPageAsync(string url)
        {
            try
            {
                using (var handler = new System.Net.Http.HttpClientHandler 
                { 
                    AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate 
                })
                using (var client = new System.Net.Http.HttpClient(handler))
                {
                    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                    client.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
                    client.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.5");
                    
                    var html = await client.GetStringAsync(url);
                    
                    // Parse Title
                    string title = string.Empty;
                    var titleMatch = System.Text.RegularExpressions.Regex.Match(html, @"<span\s+id=""productTitle""[^>]*>\s*([^<]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                    if (titleMatch.Success)
                    {
                        title = System.Net.WebUtility.HtmlDecode(titleMatch.Groups[1].Value.Trim());
                    }
                    else
                    {
                        var titleTagMatch = System.Text.RegularExpressions.Regex.Match(html, @"<title>([^<]+)</title>", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                        if (titleTagMatch.Success)
                        {
                            title = System.Net.WebUtility.HtmlDecode(titleTagMatch.Groups[1].Value.Replace("Buy ", "").Replace(" Online at Low Prices in India - Amazon.in", "").Trim());
                        }
                    }

                    // Parse Image
                    string imageUrl = string.Empty;
                    var imageMatch = System.Text.RegularExpressions.Regex.Match(html, @"<meta\s+property=""og:image""\s+content=""([^""]+)""", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                    if (imageMatch.Success)
                    {
                        imageUrl = imageMatch.Groups[1].Value.Trim();
                    }
                    else
                    {
                        var imageMatch2 = System.Text.RegularExpressions.Regex.Match(html, @"id=""landingImage""[^>]*src=""([^""]+)""", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                        if (imageMatch2.Success)
                        {
                            imageUrl = imageMatch2.Groups[1].Value.Trim();
                        }
                    }

                    // Parse Description
                    string description = string.Empty;
                    var descMatch = System.Text.RegularExpressions.Regex.Match(html, @"<meta\s+name=""description""\s+content=""([^""]+)""", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                    if (descMatch.Success)
                    {
                        description = System.Net.WebUtility.HtmlDecode(descMatch.Groups[1].Value.Trim());
                    }
                    
                    if (string.IsNullOrEmpty(description) || description.Contains("Amazon.in"))
                    {
                        var descMatch2 = System.Text.RegularExpressions.Regex.Match(html, @"<meta\s+property=""og:description""\s+content=""([^""]+)""", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                        if (descMatch2.Success)
                        {
                            description = System.Net.WebUtility.HtmlDecode(descMatch2.Groups[1].Value.Trim());
                        }
                    }

                    // Parse Price
                    decimal price = 0;
                    decimal originalPrice = 0;
                    var priceMatch = System.Text.RegularExpressions.Regex.Match(html, @"""priceAmount"":([\d\.]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                    if (priceMatch.Success)
                    {
                        decimal.TryParse(priceMatch.Groups[1].Value, out price);
                    }
                    else
                    {
                        var priceMatch2 = System.Text.RegularExpressions.Regex.Match(html, @"<span\s+class=""a-price-whole"">([\d,]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                        if (priceMatch2.Success)
                        {
                            decimal.TryParse(priceMatch2.Groups[1].Value.Replace(",", ""), out price);
                        }
                    }

                    // Original Price (MRP)
                    var mrpMatch = System.Text.RegularExpressions.Regex.Match(html, @"<span\s+class=""a-price\s+a-text-price""[^>]*>.*?<span\s+class=""a-offscreen"">₹\s*([\d,]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.Singleline);
                    if (mrpMatch.Success)
                    {
                        decimal.TryParse(mrpMatch.Groups[1].Value.Replace(",", ""), out originalPrice);
                    }

                    // Categorize based on keywords
                    string category = "Shopping";
                    string combinedText = (title + " " + description).ToLower();
                    if (combinedText.Contains("phone") || combinedText.Contains("mobile") || combinedText.Contains("galaxy") || combinedText.Contains("iphone"))
                    {
                        category = "Electronics";
                    }
                    else if (combinedText.Contains("speaker") || combinedText.Contains("soundbar") || combinedText.Contains("earbuds") || combinedText.Contains("headphone"))
                    {
                        category = "Electronics";
                    }
                    else if (combinedText.Contains("watch") || combinedText.Contains("smartwatch") || combinedText.Contains("fitness"))
                    {
                        category = "Gadgets";
                    }
                    else if (combinedText.Contains("cooker") || combinedText.Contains("pan") || combinedText.Contains("kitchen") || combinedText.Contains("kettle"))
                    {
                        category = "Kitchen & Home";
                    }
                    else if (combinedText.Contains("cushion") || combinedText.Contains("decor") || combinedText.Contains("curtain") || combinedText.Contains("bed"))
                    {
                        category = "Home & Decor";
                    }

                    return (title, description, imageUrl, price, originalPrice, category);
                }
            }
            catch
            {
                return (string.Empty, string.Empty, string.Empty, 0, 0, "Shopping");
            }
        }

        /// <summary>
        /// Helper to parse ASIN from standard Amazon URLs
        /// </summary>
        public string ParseAsin(string url)
        {
            if (string.IsNullOrWhiteSpace(url)) return string.Empty;

            // Common patterns: amazon.in/dp/ASIN, amazon.in/gp/product/ASIN
            try
            {
                var uri = new Uri(url);
                var segments = uri.AbsolutePath.Split('/');
                for (int i = 0; i < segments.Length; i++)
                {
                    if ((segments[i].Equals("dp", StringComparison.OrdinalIgnoreCase) || 
                         segments[i].Equals("product", StringComparison.OrdinalIgnoreCase)) && 
                        i + 1 < segments.Length)
                    {
                        var potentialAsin = segments[i + 1].Trim();
                        if (potentialAsin.Length == 10)
                        {
                            return potentialAsin;
                        }
                    }
                }
            }
            catch { /* Fallback to regex */ }

            // Regex fallback for 10-character alphanumeric ASINs
            var match = System.Text.RegularExpressions.Regex.Match(url, @"/(?:dp|gp/product)/([A-Z0-9]{10})", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (match.Success)
            {
                return match.Groups[1].Value;
            }

            return string.Empty;
        }

        /// <summary>
        /// Helper to build an affiliate link on the fly using the secure Associate Tag
        /// </summary>
        private string BuildAffiliateLink(string rawUrl, string asin)
        {
            // If the raw URL is already a custom short link (like amzn.to), preserve it
            if (!string.IsNullOrWhiteSpace(rawUrl) && (rawUrl.Contains("amzn.to") || rawUrl.Contains("t.co")))
            {
                return rawUrl;
            }

            // Construct direct product affiliate link using Amazon India domain
            string cleanAsin = string.IsNullOrWhiteSpace(asin) ? "B0BY8MCQ9S" : asin.Trim();
            return $"https://www.amazon.in/dp/{cleanAsin}?tag={_associateTag}&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl";
        }

        private string EnsureAbsoluteImageUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60";
            }

            url = url.Trim();

            // If it's already an absolute URL or local self-hosted image path, return it directly
            if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
                url.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
                url.StartsWith("/images/", StringComparison.OrdinalIgnoreCase))
            {
                return url;
            }

            // If it's just the Amazon image ID/filename, prefix it
            return $"https://images-eu.ssl-images-amazon.com/images/I/{url}";
        }

        private string GetLocalImagesDirectory()
        {
            string[] pathsToTry = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "worldnewz_UI", "public", "images"),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "worldnewz_UI", "public", "images"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "worldnewz_UI", "public", "images"),
                "C:\\WorldNewz\\worldnewz_UI\\public\\images"
            };

            foreach (var p in pathsToTry)
            {
                try
                {
                    var fullPath = Path.GetFullPath(p);
                    if (Directory.Exists(fullPath))
                    {
                        return fullPath;
                    }
                }
                catch { }
            }
            
            return "C:\\WorldNewz\\worldnewz_UI\\public\\images";
        }

        private string CleanProductTitleForPrompt(string title)
        {
            if (string.IsNullOrWhiteSpace(title)) return "product";

            // 1. Take the first segment before common separators
            string firstSegment = title.Split(new[] { ',', '-', '|', '(', '[', ':', ';' }, StringSplitOptions.RemoveEmptyEntries)[0];

            // 2. Keep only letters, digits, and spaces
            var sb = new System.Text.StringBuilder();
            foreach (char c in firstSegment)
            {
                if (char.IsLetterOrDigit(c) || char.IsWhiteSpace(c))
                {
                    sb.Append(c);
                }
            }

            string clean = sb.ToString().Trim();

            // 3. Limit to first 7 words
            var words = clean.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            if (words.Length > 7)
            {
                clean = string.Join(" ", words.Take(7));
            }

            return clean;
        }

        private async Task<string> GenerateAndSaveAIProductImageAsync(string asin, string title, string category, string scrapedImageUrl)
        {
            try
            {
                string cleanTitle = CleanProductTitleForPrompt(title);
                string prompt = $"A professional studio product photo of {cleanTitle}, clean white studio background, neutral natural lighting, high resolution, commercial photography";
                string encodedPrompt = Uri.EscapeDataString(prompt);
                
                string pollinationUrl = $"https://image.pollinations.ai/prompt/{encodedPrompt}?width=600&height=600&nologo=true&seed={System.Random.Shared.Next(1, 100000)}";
                
                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(15);
                    byte[] imageBytes = await client.GetByteArrayAsync(pollinationUrl);
                    
                    if (imageBytes != null && imageBytes.Length > 5000)
                    {
                        try
                        {
                            string imagesDir = GetLocalImagesDirectory();
                            if (!Directory.Exists(imagesDir))
                            {
                                Directory.CreateDirectory(imagesDir);
                            }
                            
                            string fileName = $"{asin}.png";
                            string localPath = Path.Combine(imagesDir, fileName);
                            await File.WriteAllBytesAsync(localPath, imageBytes);
                        }
                        catch { /* Ignore background file system writing errors */ }
                        
                        return pollinationUrl;
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"AI Image Generation failed: {ex.Message}");
            }

            return GetDynamicProductImage(title, category, scrapedImageUrl);
        }

        private string GetDynamicProductImage(string title, string category, string scrapedImageUrl)
        {
            if (!string.IsNullOrWhiteSpace(scrapedImageUrl) && 
                (scrapedImageUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
                 scrapedImageUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase)) &&
                !scrapedImageUrl.Contains("amazon-placeholder") && 
                !scrapedImageUrl.Contains("a-smile-logo"))
            {
                return EnsureAbsoluteImageUrl(scrapedImageUrl);
            }

            string lowerTitle = (title ?? "").ToLower();
            
            if (lowerTitle.Contains("cylinder") || lowerTitle.Contains("gas") || lowerTitle.Contains("stove") || lowerTitle.Contains("lpg"))
            {
                return "/images/gas_cylinder.png";
            }
            if (lowerTitle.Contains("kurta") || lowerTitle.Contains("kurti") || lowerTitle.Contains("saree") || lowerTitle.Contains("suit") || lowerTitle.Contains("clothing") || lowerTitle.Contains("dress") || lowerTitle.Contains("women"))
            {
                return "/images/kurta_set.png";
            }
            if (lowerTitle.Contains("phone") || lowerTitle.Contains("mobile") || lowerTitle.Contains("samsung") || lowerTitle.Contains("iphone"))
            {
                if (lowerTitle.Contains("16e"))
                {
                    return "/images/iphone_16e.png";
                }
                return "/images/galaxy_phone.png";
            }
            if (lowerTitle.Contains("cube") || lowerTitle.Contains("cubelelo") || lowerTitle.Contains("toy") || lowerTitle.Contains("puzzle"))
            {
                return "/images/cubelelo_cube.png";
            }
            if (lowerTitle.Contains("lamp") || lowerTitle.Contains("aurora") || lowerTitle.Contains("speaker") || lowerTitle.Contains("projector"))
            {
                return "/images/galaxy_lamp.png";
            }
            if (lowerTitle.Contains("cooker") || lowerTitle.Contains("pot") || lowerTitle.Contains("instant pot"))
            {
                return "/images/pressure_cooker.png";
            }
            if (lowerTitle.Contains("toran") || lowerTitle.Contains("bandanwar") || lowerTitle.Contains("decor") || lowerTitle.Contains("door hanging"))
            {
                return "/images/toran_decor.png";
            }
            if (lowerTitle.Contains("piggy") || lowerTitle.Contains("bank") || lowerTitle.Contains("money box"))
            {
                return "/images/piggy_bank.png";
            }

            if (category.Equals("Electronics", StringComparison.OrdinalIgnoreCase))
            {
                return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60";
            }
            if (category.Equals("Home Appliances", StringComparison.OrdinalIgnoreCase) || category.Equals("Kitchen & Home", StringComparison.OrdinalIgnoreCase))
            {
                return "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=60";
            }
            if (category.Equals("Gadgets", StringComparison.OrdinalIgnoreCase))
            {
                return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60";
            }
            if (category.Equals("Home & Decor", StringComparison.OrdinalIgnoreCase))
            {
                return "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=60";
            }
            
            return "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60";
        }

        /// <summary>
        /// Seeds and synchronizes default high-converting product deals in Amazon India
        /// </summary>
        private async Task EnsureDefaultProductsSeededAsync()
        {
            var seedData = new List<AmazonProduct>
            {
                new AmazonProduct
                {
                    Asin = "B0FDQKGB28",
                    Title = "Samsung Galaxy Watch8 (40mm, LTE, Graphite) with 3nm Processor | Dual GPS | Sapphire Glass & Armor Aluminum | 5ATM & IP68 | BP, ECG, IHRN & Vascular Load Monitoring | Anti-oxidant Index",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://images-na.ssl-images-amazon.com/images/P/B0FDQKGB28.01.LZZZZZZZ.jpg",
                    Price = 24999.0m,
                    OriginalPrice = 31248.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0FDQKGB28?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FMDL81GS",
                    Title = "OnePlus Nord Buds 3r TWS Earbuds up to 54 Hours Playback, 2-mic Clear Calls, 3D Spatial Audio, AI Translation, 12.4mm Drivers, Dual-Device Connectivity, 47ms Low Latency - Ash Black",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://images-na.ssl-images-amazon.com/images/P/B0FMDL81GS.01.LZZZZZZZ.jpg",
                    Price = 1999.0m,
                    OriginalPrice = 2498.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0FMDL81GS?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GX94B58L",
                    Title = "vivo X300 FE 5G (Urban Olive, 12GB RAM, 256GB Storage) with No Cost EMI/Additional Exchange Offers",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://images-na.ssl-images-amazon.com/images/P/B0GX94B58L.01.LZZZZZZZ.jpg",
                    Price = 86999.0m,
                    OriginalPrice = 108748.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0GX94B58L?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GHQVR1N8",
                    Title = "vivo V70 5G (Passion Red, 8GB RAM, 256GB Storage) with No Cost EMI/Additional Exchange Offers",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://images-na.ssl-images-amazon.com/images/P/B0GHQVR1N8.01.LZZZZZZZ.jpg",
                    Price = 53999.0m,
                    OriginalPrice = 67498.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0GHQVR1N8?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FNWRZSC5",
                    Title = "Samsung Galaxy Tab S10 Lite with AI [Smartchoice], S Pen in-Box, 27.7 cm (10.9 Inch) Display, Object Eraser, 90Hz Refresh Rate, IP42 Rating, 6GB RAM, 128GB Storage, Wi-Fi + 5G Tablet, Gray",
                    Description = "Check out this top-rated education product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61CEEuPRM9L._SL1500_.jpg",
                    Price = 35999.0m,
                    OriginalPrice = 44998.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Education",
                    ProductUrl = "https://www.amazon.in/dp/B0FNWRZSC5?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GW85JTBN",
                    Title = "ASUS TUF A15, AMD Ryzen 7 170, RTX 3050-4GB, 16GB RAM (Upgradeable), 512GB SSD, FHD, 15.6'(39.6 cm),Windows 11 Home,Graphite Black, 2.3 Kg, FA506NCQ-HN006W, Gaming Laptop",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71fiRY278BL._SL1500_.jpg",
                    Price = 70990.0m,
                    OriginalPrice = 88737.5m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0GW85JTBN?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GRTWJ7PS",
                    Title = "Sharp 1.37 Ton 3 star, New Star Rated, Split AC (4 Way Swing, 100% copper, Hi-Tech Inverter Compressor, 7-1 Convertible, Turbo cool, Dust filter, AH-SI17V3B-GCN, White)",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61NANabKaRL._SL1000_.jpg",
                    Price = 33990.0m,
                    OriginalPrice = 42487.5m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0GRTWJ7PS?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FL2D9SLV",
                    Title = "ECOVACS DEEBOT N30 Plus White 2 in 1 Robot Vacuum & Mop, New Launch, Bagless Eco-Friendly Multi-Cyclone Auto Empty Station, 10000 Pa Suction, 5200mAh Battery, Covers 3500+sq ft, Zero Tangle 2.0",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/6166RQH8dIL._SL1500_.jpg",
                    Price = 32998.0m,
                    OriginalPrice = 41247.5m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0FL2D9SLV?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B08JHVPP19",
                    Title = "Amazon Brand - Symbol Women Cotton Stretch Regular Fit Round Neck Half Sleeve T-Shirt (Available in Plus Sizes)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71CmSn+uLZL._SL1500_.jpg",
                    Price = 569.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B08JHVPP19?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FR9T55MX",
                    Title = "Vedix Keshamrut Herbs Infused Ayurvedic Hair Oil With Bhringraj, Amla & Rosemary I Control Hair Fall & Boost Hair Growth I 16+ Whole Herbs, Leaves & Flowers I For Men & Women I No Mineral Oils & Chemicals (200ml)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61ROh33PBuL._SL1080_.jpg",
                    Price = 547.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FR9T55MX?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0C281C231",
                    Title = "BonKaso Climb Easy 5 Step Heavy Duty Steel Folding Climbing Ladder for Home, Home & Office – with Safety Lock, Anti-Slip Wide Durable Plastic Steps, Support Handle & Tool Tray (Orange & Black)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81+guVWHIJL._SL1500_.jpg",
                    Price = 2748.0m,
                    OriginalPrice = 3435.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0C281C231?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FTXJD848",
                    Title = "ODISHAHANDLOOM Sambalpuri Pure Cotton Handloom Saree, Traditional Ikat Pattern, Red and Green, Without Blouse",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61L0MQ4gXiL._SL1500_.jpg",
                    Price = 2699.0m,
                    OriginalPrice = 3373.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FTXJD848?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GRFXD7RF",
                    Title = "Bombay Musk Mountain Mist Luxury Car Perfume | Long Lasting Car Fragrance & Car Freshener | Alcohol Free & Plant Based | 60+ Days | 200+ Sprays | Perfume for Car",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51pmD0gFGoL._SL1080_.jpg",
                    Price = 329.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GRFXD7RF?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B08W8QQLWD",
                    Title = "Nutricook Smart Pot 2 Stainless Steel 6 QT (5.7L), 1000W 9-in-1 Instant Programmable Electric Pressure Cooker, Slow Cooker, Rice Cooker, Steamer, Sauté Pot, Sous Vide, Smart Lid, 2-Year Warranty",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61YwpwVzRSL._SL1500_.jpg",
                    Price = 7999.0m,
                    OriginalPrice = 9998.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B08W8QQLWD?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CV7J49TQ",
                    Title = "Amazon Brand - Presto! Active Wash Detergent Powder | 8 Kg | Tough On Stains | Gentle On Fabrics | Colour-Safe | Refreshing Fragrance | Machine And Hand Wash",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61hx-ExBRhL._SL1500_.jpg",
                    Price = 449.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0CV7J49TQ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B093CMF5X8",
                    Title = "beAAtho® Verona Mesh Mid-Back Ergonomic Desk Office Chair with Tilting Mechanism, Comfortable Seat, and Revolving Heavy Duty Metal Base | Ideal for Work from Home & Study (Black)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/815HZT0n4TL._SL1500_.jpg",
                    Price = 3264.0m,
                    OriginalPrice = 4080.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B093CMF5X8?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B00JD8EA1U",
                    Title = "Classic Mosquito Net for King Size Bed | 30 GSM Polyester Fine Mesh | Foldable Pop Up Machardani for Double Bed | 360° Mosquito & Insect Protection | Washable & Reusable | Blue",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61IOb4Nu6AL._SL1080_.jpg",
                    Price = 948.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B00JD8EA1U?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GZGY1823",
                    Title = "Itel Zeno 200 (Meteor Titanium, 4 GB RAM, 128 GB Storage) | 6.75' HD+ Display | 120 Hz Dynamic Refresh Rate | IP65 Dust & Water Resistance | 13 MP Camera | 5000 mAh Battery | Charger in Box",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/617iVkfLv5L._SL1500_.jpg",
                    Price = 9699.0m,
                    OriginalPrice = 12123.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0GZGY1823?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0F9X6J9TX",
                    Title = "ASUS ROG Strix G16, AMD Ryzen 9 8940HX, Gaming Laptop(RTX 5060-8GB/115W TGP/16GB/1TB /2.5K QHD+/16'/240Hz/90WHrs/Windows 11/M365 Basic (1Year)*/Office Home 2024/Eclipse Gray/2.5 Kg) G614PM-S5046WS",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://images-na.ssl-images-amazon.com/images/P/B0F9X6J9TX.01.LZZZZZZZ.jpg",
                    Price = 169990.0m,
                    OriginalPrice = 212487.5m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0F9X6J9TX?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GPQCZDDR",
                    Title = "Clarity Labs | MUSCLE RELIEF SOAP | (Pack of 4) | THERAPEUTIC & RELAXING | Epsom Salt | Magnesium chloride | Peppermint Oil | Camphor Oil | Anti Bacterial | Anti Odor | Reduces Post Workout Soreness & Stiffness",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61XmD6mBjCL._SL1254_.jpg",
                    Price = 347.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0GPQCZDDR?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B09RNDHW8G",
                    Title = "Homerz Diwan Set of 5 Cushion and 2 Bolster, Cushion Size- 16 x 16 inch, Bolster Size- 15 x 30 inch, Vacuum Pack (Diwan Set (5 Cushion+2 Bolster))",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71KmY1pyATL._SL1500_.jpg",
                    Price = 1599.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B09RNDHW8G?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DG8YQJPH",
                    Title = "EUME 100% Aluminium Cabin Trolley Bag Small for Travelling 50cm | Durable High-End 8 Silentrun 360 Degree Spinner Wheels | Premium Trolley Bag Small for Travel (Black with Black Wheels)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61b4TcFcV2L._SL1500_.jpg",
                    Price = 19999.0m,
                    OriginalPrice = 24998.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0DG8YQJPH?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B094NQYG66",
                    Title = "V-Guard Victo Geyser 25 Litre Water Heater",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://images-na.ssl-images-amazon.com/images/P/B094NQYG66.01.LZZZZZZZ.jpg",
                    Price = 999.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B094NQYG66?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CCTJW69W",
                    Title = "Cat Bed Cave Dome Hideaway Tent House for Indoor Cats",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://images-na.ssl-images-amazon.com/images/P/B0CCTJW69W.01.LZZZZZZZ.jpg",
                    Price = 999.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0CCTJW69W?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GJDHGSJ1",
                    Title = "Pregnancy Pillow for Sleeping with Belly Support Set of 2",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://images-na.ssl-images-amazon.com/images/P/B0GJDHGSJ1.01.LZZZZZZZ.jpg",
                    Price = 999.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0GJDHGSJ1?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0B68G4F1S",
                    Title = "AMATA Eagle Solid Wood 3 Seater Sofa Cum Bed Camel Suede velevt Fabric with Two Cushions Perfect for Home Living Office Room and Guests (Camel, Medium)(3 Years Warranty)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51gBITE6F6L._SL1080_.jpg",
                    Price = 17498.0m,
                    OriginalPrice = 21872.5m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0B68G4F1S?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FCCC6G9N",
                    Title = "STITCHNEST Quilted Velvet Sofa Cover with Tassels – 70x60 Inch, Beige & Blue Chevron Pattern, Soft & Premium, Washable Sofa Protector for 3-Seater",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71PGSn2aPmL._SL1350_.jpg",
                    Price = 998.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0FCCC6G9N?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GH7FM3ZR",
                    Title = "Everflame Marvel 4 Burner Gas Stove | 2mm Heavy Steel Body | 6G Brass Burners | Manual Ignition | Italian SABAF Valve | 5 Years Warranty (Body & Burners) + 2 Years Comprehensive + Doorstep Service",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/712OsBIXynL._SL1500_.jpg",
                    Price = 10476.0m,
                    OriginalPrice = 13095.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0GH7FM3ZR?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B07Q7C4Q45",
                    Title = "Scalpe Pro Daily Anti-Dandruff Shampoo | Removes Dandruff from Source | Prevents Itching & Irritation | Scalpe Science | Climbazole Formulation | Dermatologically Tested | For Women & Men | 100ml",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51PbtcW9nML._SL1001_.jpg",
                    Price = 185.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B07Q7C4Q45?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CTSSKJ7N",
                    Title = "Avimee Herbal Scalptone Hair Growth Serum | Scientifically Proven Formula | Enriched with Nansyl & Green Tea Extract | For Hair Growth & Hair Fall Reduction | 25 ml",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61kUghTCwUL._SL1080_.jpg",
                    Price = 624.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0CTSSKJ7N?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0C86CMCPQ",
                    Title = "The Indus Valley Stainless Steel Idli Maker/Momo Maker/Multi Kadai/Steamer Set|Large, 5 Plates, 2 Idli|2 Dhokla|1 Steamer|29Cm/11.3 Inch, 4.2Ltr, 2.5Kg|3-Layer Thick Bottom|Induction Friendly",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71LdwSEEF5L._SL1500_.jpg",
                    Price = 2198.0m,
                    OriginalPrice = 2747.5m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0C86CMCPQ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FSDMLT2M",
                    Title = "Casaliving Ella RHS 5- to 6-Person Sofa L Shape Sofa Set for Living Room (Dark Grey & Grey) Premium Fabric Sofa",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71LufBvWsuL._SL1500_.jpg",
                    Price = 27499.0m,
                    OriginalPrice = 34373.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0FSDMLT2M?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0F9TBPW1F",
                    Title = "ROYALSCOUT Men's Cotton Polyester Blend Solid Regular Fit Full Sleeve Short Kurta | Ethnic, Lightweight Summer Kurta for Daily & Occasion Use",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71cwBIDss5L._SL1500_.jpg",
                    Price = 795.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0F9TBPW1F?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B071CMQ6N2",
                    Title = "YouBella Jewellery Bracelets for Women Stylish Rose Gold Plated Crystal Bracelet Bangle Jewellery for Girls and Women",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71P8z0DrFRL._SL1500_.jpg",
                    Price = 163.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B071CMQ6N2?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DCJSVN1Z",
                    Title = "GRENARO P10 Wireless Mic for YouTube, 3-Level Adjustable Noise Cancellation Wireless Microphone,Professional Wireless Mike for Recording, Ideal for Video Recording and Content Creators",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71o4U01-QpL._SL1500_.jpg",
                    Price = 1998.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0DCJSVN1Z?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FK2ZF5F8",
                    Title = "Seznik Jewellery Thermal Labels – 14.3mm x 100mm, Waterproof, Non Tearable, Direct Thermal, 150 Labels/Roll, for 2 to 4 Inch Printers, White, for Jewellery Tagging, 750 Labels",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61BsN6XL8jL._SL1500_.jpg",
                    Price = 546.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0FK2ZF5F8?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B07NVSV868",
                    Title = "Amul India Twilight Tryst Dark Chocolate, 125gm",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61+RHxzhNqL._SL1200_.jpg",
                    Price = 115.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B07NVSV868?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0D322VFFV",
                    Title = "Tedibar Moisturising Baby Bathing Bar with Skin Friendly PH|100% Soap Free|Prevents Dryness & Rashes|Dermatologically Tested 75gm x Pack of 6",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81jS4lwa2iL._SL1500_.jpg",
                    Price = 994.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0D322VFFV?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CXDQWYQP",
                    Title = "Godrej aer O – Hanging Car Air Freshener – Assorted Pack of 3 (22.5g) | Gel Lasts up to 30 days | Car Accessories",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71J1Pf6Qq9L._SL1500_.jpg",
                    Price = 250.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0CXDQWYQP?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GDQZHH8B",
                    Title = "Amayra Women's Pure Cotton Printed A-Line Kurta Set with Palazzo Pants & Dupatta- Ethnic Wear",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81-q-szqX1L._SL1500_.jpg",
                    Price = 997.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GDQZHH8B?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0G4DJ4PVQ",
                    Title = "Arayna Women’s Cotton Printed Kurta Set with Palazzo Pants and Dupatta | Ethnic Straight Kurta",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81otXBoExEL._SL1500_.jpg",
                    Price = 999.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0G4DJ4PVQ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FB9GQX6F",
                    Title = "Pistaa's Women's Pure Cotton Anarkali Floral Printed Kurta with Palazzo & Dupatta Set",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71eCJM812ML._SL1500_.jpg",
                    Price = 1899.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FB9GQX6F?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FWRFGC3N",
                    Title = "Leriya Fashion Kurta Sets for Woman | Kurti Set for Woman | Anarkali Suit for Women | White Kurta Set for Women with Dupatta | Traditional Anarkali Salwar Suit for Party Outfits Kurtis",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61mm1msPxaL._SL1500_.jpg",
                    Price = 799.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FWRFGC3N?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B07NRR7TKD",
                    Title = "H&B Jute Bags Combo- Jute Lunch Bags Combo - Spiral",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/91wveqqhlJL._SL1500_.jpg",
                    Price = 426.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B07NRR7TKD?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0B2F8XS9L",
                    Title = "Babique Dog Plush Soft Toy Cute Kids Animal Home Decor Boys/Girls/Baby (25 cm, White)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/41Z37AWyjHL._SL1024_.jpg",
                    Price = 163.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0B2F8XS9L?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FB46QM2X",
                    Title = "Sukkhi Charming AD Diamonds Studded Floral Choker Necklace with Danlge Earrings Maangtikka Jewellery Set for Women & Girls",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71Lo2RqdZKL._SL1500_.jpg",
                    Price = 316.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0FB46QM2X?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CC61X519",
                    Title = "JIALTO 1 Pcs Bathroom Accessories - Multipurpose Aluminium Bathroom Shelf for Wall | Self-Adhesive Wall Mounted Bathroom Organiser Without Drill | 1 Pcs Black Bathroom Shelf | Bathroom Rack (Black)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71jJGw5om4L._SL1500_.jpg",
                    Price = 299.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0CC61X519?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0G6LYSKJD",
                    Title = "Lenovo IdeaCentre AIO Intel Core i5-13420H 24' FHD (24GB RAM/512GB SSD/Win11/Microsoft 365 Basic + Office Home 2024/3Wx2 Harman/Wireless EOS Keyboard & Mouse,Grey) All-in-One Desktop",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71uw44iKKfL._SL1500_.jpg",
                    Price = 81490.0m,
                    OriginalPrice = 101862.5m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0G6LYSKJD?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0H6FC8RV5",
                    Title = "SHOPNORY Women's Cotton Chikankari Print Straight Kurti with Pant andMulmul Dupatta Set",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71goiotii1L._SL1500_.jpg",
                    Price = 1699.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0H6FC8RV5?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FCSMTJF7",
                    Title = "Carrito, Women Wedge Heels Thong Sandals | Comfortable Flats | Comfort Orthopaedic Sandals for Girls| Doctor Slippers/Flip-Flops | Arch Support & Stylish Block Heel Cushion | Casual Lightweight Anti-Skid Sole| Slip-on | Pump and Mule Sandals | Ultra-Cushioned Shock Absorbing Footbed | Open Toe & Toe Separator Style | Women Daily Use Formal | Platform Ladies Flat Wear Footwear",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61xP2soBsNL._SL1500_.jpg",
                    Price = 899.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FCSMTJF7?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0C862R9VF",
                    Title = "Lifelong LLKS03 Foldable Kick Skating Cycle| Skate Scooter for Kids(Max User Weight: 50Kg) Kids Scooter (Pink, Blue)",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61xr-fzqcxL._SL1500_.jpg",
                    Price = 899.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0C862R9VF?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GWJKKQ8V",
                    Title = "Mehta Originals Women's Cotton Embroidery Anarkali Kurti and Pant with Dupatta Set",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61F70sIdVoL._SL1280_.jpg",
                    Price = 799.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GWJKKQ8V?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
            };

            bool changed = false;
            var validAsins = new HashSet<string>(seedData.Select(s => s.Asin), StringComparer.OrdinalIgnoreCase);
            var existingDbProducts = await _context.AmazonProducts.ToListAsync();

             // Seed data check and initialization only. User-submitted products are preserved.

            foreach (var seed in seedData)
            {
                var existing = await _context.AmazonProducts.FirstOrDefaultAsync(p => p.Asin == seed.Asin);
                if (existing == null)
                {
                    seed.LastUpdated = DateTime.UtcNow;
                    _context.AmazonProducts.Add(seed);
                    changed = true;
                }
                else
                {
                    // Ensure the values are correct if they differ (e.g. title or productUrl updated)
                    if (existing.ProductUrl != seed.ProductUrl || 
                        existing.Title != seed.Title || 
                        existing.Description != seed.Description || 
                        existing.ImageUrl != seed.ImageUrl ||
                        existing.Category != seed.Category)
                    {
                        existing.Title = seed.Title;
                        existing.Description = seed.Description;
                        existing.ImageUrl = seed.ImageUrl;
                        existing.Price = seed.Price;
                        existing.OriginalPrice = seed.OriginalPrice;
                        existing.Rating = seed.Rating;
                        existing.ReviewCount = seed.ReviewCount;
                        existing.Category = seed.Category;
                        existing.ProductUrl = seed.ProductUrl;
                        existing.LastUpdated = DateTime.UtcNow;
                        changed = true;
                    }
                }
            }

            if (changed)
            {
                await _context.SaveChangesAsync();
            }
        }
    }
}
