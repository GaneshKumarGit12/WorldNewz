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
                new AmazonProduct
                {
                    Asin = "B0C3D2DP11",
                    Title = "Skillmatics Quiet Cloth Book for Toddlers – Soft Sensory Activity Book with 11 Interactive Daily Tasks, Learning Toys for Kids Ages 18 Months to 4 Years, Multicolor",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71v7MjuPTQL._SL1500_.jpg",
                    Price = 999.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0C3D2DP11?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FNDDRLZ2",
                    Title = "Smartivity DIY Solar System Kit | Gear-Driven Working Model of Planets | Birthday Gift for Boys & Girls 8-14 YearsI Build, Rotate & Explore Astronomy | Learn Solar System & Science Facts",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81O6JmZrl3L._SL1500_.jpg",
                    Price = 996.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0FNDDRLZ2?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B09KPMVV7Z",
                    Title = "Wembley Foosball Football Table Soccer Game Board for Adults Kids Boys and Girls Indoor Sport with Medium Stand 6 Rows with 6 Handles,18 Players, 2 Ball - Wooden",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71W9Y+sJKGL._SL1500_.jpg",
                    Price = 2136.0m,
                    OriginalPrice = 2670.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B09KPMVV7Z?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0D2RN7XVW",
                    Title = "Smartivity My First Science Experiment Kit for Kids 6-8-10-12-14 Years I 50+ Amazing Science Experiments | Birthday Gift for Boys & Girls | Educational Toy for Kids 6,7,8,9,10,11,12 Years Old",
                    Description = "Check out this top-rated education product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71xsiwc82uL._SL1500_.jpg",
                    Price = 484.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Education",
                    ProductUrl = "https://www.amazon.in/dp/B0D2RN7XVW?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CNT56SFG",
                    Title = "Nutricook Steami X 24L Black (Steam + Air Fryer Oven) with 10-in-1 functions like Steam Cook, Steam Roast, Air Fry, Bake, Sterilize & more. Steam + Convection technology, 2200W power, 2-year warranty",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/712l2NOAUoL._SL1500_.jpg",
                    Price = 22999.0m,
                    OriginalPrice = 28748.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0CNT56SFG?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B08S7MCNKT",
                    Title = "Kuvings B1700 Dark Silver Cold Press Juicer for Home with Attachments, All-in-1 Juicer for Fruits, Vegetables & Nut Milk, Smoothie & Sorbet, Patented JMCS Technology 10% More Juice, 12 Yrs Warranty",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71I534VIPiL._SL1500_.jpg",
                    Price = 27999.0m,
                    OriginalPrice = 34998.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B08S7MCNKT?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B084KYJ1CV",
                    Title = "Prestige 5 Litre Stainless Steel Deluxe Alpha Svachh Outer Lid Deep Pressure Pan Cooker | 10Y Warranty | Deep Lid for Spillage Control | TRIPLY Base | GRS | Gas & Induction Compatible | ISI",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51b3IHLTcdL._SL1200_.jpg",
                    Price = 2874.0m,
                    OriginalPrice = 3592.5m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B084KYJ1CV?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GSZ8H487",
                    Title = "Midea 8 Kg 5 Star Fully Automatic Front Load Washing Machine with Inverter Motor, Self Clean Drum Technology, 15 Wash Programs (MFG17W80B/T-IND, Titanium Grey)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/711-Oj7j1aL._SL1500_.jpg",
                    Price = 23490.0m,
                    OriginalPrice = 29362.5m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0GSZ8H487?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0B3JT1FPG",
                    Title = "TEX-RO Kitchen Trolley with Wheels | 5-Layer Metal Vegetable Basket Stand & Kitchen Storage Rack | Multipurpose Kitchen Organizer for Onion Potato Storage (Black)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81E+IQQ4dmL._SL1500_.jpg",
                    Price = 2931.0m,
                    OriginalPrice = 3663.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0B3JT1FPG?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0C6H1Z1XM",
                    Title = "NATURE PRIME 100% Natural&Crunchy Premium Whole Cashews 1 Kg (W320) Nutritious&Delicious Nuts, Premium Kaju Nuts|Gluten Free|Source Of Minerals&Vitamins|Dry Fruits (Jar Pack) (Packing May Differ)",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71v8UCDrg1L._SL1500_.jpg",
                    Price = 918.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0C6H1Z1XM?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B01MU1CMWO",
                    Title = "Farm Naturelle 100% Pure & Unrefined Cold Pressed White Sesame (Gingelly) Oil – 1L (Pack of 2) | Kolhu/Kacchi Ghani/Chekku | Natural Daily Cooking Oil | Chemical-Free | Rich Aroma & Flavour",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81LsP3x4A9L._SL1500_.jpg",
                    Price = 888.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B01MU1CMWO?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CVN8G65P",
                    Title = "NESCAFE Roastery | Premium Imported Coffee | Dark Roast | Crafted by Master Roasters |Elevate your Coffee Experience | Rich & Intense Taste | 95g Tin (New Launch) Can",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61nk-qQ0MbL._SL1500_.jpg",
                    Price = 600.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0CVN8G65P?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0B4KM9X8F",
                    Title = "MYFITNESS Peanut Butter High Protein Dark Chocolate Spread Crispy 1kg | Added Whey Protein | 31g Protein for Muscle Building | 8g Fiber | Pre & Post-Workout Snacks | Cholesterol Free | Zero Trans Fat",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61chplSvsWL._SL1300_.jpg",
                    Price = 483.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0B4KM9X8F?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B07F91JF1R",
                    Title = "Amazon Brand - Vedaka Olive Pomace Oil | 2 L | Contains MUFA | Ideal for Frying, Roasting & Baking | Cooking Oil for Daily Use | No Artificial & No Added Preservatives",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61k8y0WR-oL._SL1500_.jpg",
                    Price = 899.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B07F91JF1R?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FDKRVFYL",
                    Title = "Nobero Women’s Graphic Printed T-Shirt | Regular Fit 180 GSM Cotton Tee for Women | Comfortable Round Neck Casual Wear",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51aYUDu-d8L._SL1080_.jpg",
                    Price = 499.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FDKRVFYL?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0G7GXRRGM",
                    Title = "United Colors of Benetton Women Tshirt",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61kRc1TuDqL._SL1500_.jpg",
                    Price = 709.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0G7GXRRGM?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DRP2HKM8",
                    Title = "Reifica 100% Pure Cotton Printed Half Sleeve Oversized Tshirts for Women Combo Pack of 2",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/612+MjCrSCL._SL1440_.jpg",
                    Price = 1599.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DRP2HKM8?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0D2GLFVVX",
                    Title = "Marks & Spencer Women Jeans",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61bXxi0FqiL._SL1500_.jpg",
                    Price = 2249.0m,
                    OriginalPrice = 2811.25m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0D2GLFVVX?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0H2S4RWR9",
                    Title = "Flying Machine Women's Flared Fit Jeans| Solid | High Rise | Stretchable | Jeans for Woman",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81eV3JWAhtL._SL1500_.jpg",
                    Price = 1559.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0H2S4RWR9?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FGJ5SSYW",
                    Title = "Metro Women's Double Strap Block Heeled Sandals",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61iCGx57PtL._SL1500_.jpg",
                    Price = 1233.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0FGJ5SSYW?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FN7KN3LH",
                    Title = "Gufrina Women’s Abstract Printed Button Down Shirt with Mandarin Collar and Above Elbow Sleeve Relaxed Fit Top",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81YexWLn5yL._SL1500_.jpg",
                    Price = 415.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FN7KN3LH?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DGF2MNBG",
                    Title = "THE HEALING STORE 6-Piece Kansa Solid Dinner Set|Matte Finish|1 Plate (11.5' Thali),2 Bowls,1 Glass,1 Sweet Dish Plate,1 Spoon | Bronze Kansa Dinner Set 6 Shine Polish Finish (eaching Design)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81MVPhgzAJL._SL1500_.jpg",
                    Price = 4514.0m,
                    OriginalPrice = 5642.5m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0DGF2MNBG?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0F1MZB7N3",
                    Title = "Talking, Rechargeable, Electronic Flash Cards Learning Toy, 110+ Interactive Double Sided Montessori Cards for 2–5 Year Old Boys, Educational Toy for 3 Year Old, Birthday Gift for Kids",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/616NTnG7nbL._SL1500_.jpg",
                    Price = 283.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0F1MZB7N3?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0C9TVJVSQ",
                    Title = "Horse Bridle, Harness, Durable for Horse Nylon Race Horse Bridle with Export Quality bit (Blue)",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51zy-0D8zvL._SL1200_.jpg",
                    Price = 949.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0C9TVJVSQ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CBPHPXG1",
                    Title = "Florida All Season Ultra Soft Baby Blanket Pack of 2 | Kids AC Blanket, Flannel Wrapper & Travel Blanket for Newborn to 6 Years (110x150 cm)",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/91qqC8iGYoL._SL1500_.jpg",
                    Price = 929.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0CBPHPXG1?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DRS8ZQ9P",
                    Title = "HydraMax 360W Portable Blender 700ml | 22,000 RPM | 6000mAh Battery (35+ Blends) | 6 Stainless Blades | Fast Charging | BPA-Free | Waterproof | Multi-Purpose for Smoothies, Shakes & Baby Food",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71FJjCkr+WL._SL1500_.jpg",
                    Price = 2421.0m,
                    OriginalPrice = 3026.25m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0DRS8ZQ9P?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DH4JYX6L",
                    Title = "Original Black Narmadeshwar 2 Inch Shivling, Lingam, Shiva Lingam & 4 Inch Jaladhari, Yoni Base, Lingam Holder, Shivling Stand for Home Puja",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61lnkysWIqL._SL1024_.jpg",
                    Price = 900.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0DH4JYX6L?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FWRCG2Y5",
                    Title = "Tem Dao & Dun Icon Men’s Perfume Set | SRK Edition | Woody, Spicy & Oud Eau de Parfum | 2 x 50ml Long-Lasting EDP | Premium Fragrance Combo by Fiori Perfumes",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61k8s3W-eAL._SL1080_.jpg",
                    Price = 569.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FWRCG2Y5?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DZX98QT3",
                    Title = "F LINE - TOBACCO VANILLE - Eau De Parfum 100ml for Men | Warm Tobacco, vanilla, tonka bean, dried fruits & woody | Long-Lasting | STRONG PROJECTION & HIGH CONCENTRATION | Premium Essential Oil-Based Perfume",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71QOumr+duL._SL1254_.jpg",
                    Price = 809.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DZX98QT3?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GXZGNFV1",
                    Title = "MAZRA Mosquito Killer Machine Mosquito Killer USB Powered Bug Zapper Mosquito Lamp for Home Electric LED Lamp Indoor/Outdoor Mosquito Trap Machine",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61LDm0jhpoL._SL1478_.jpg",
                    Price = 284.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0GXZGNFV1?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GQBYMB2X",
                    Title = "Multipurpose ABS Laser Level Line Tool Kit | Standard Cross | leveler Beam with Metric Rulers 8ft/2.5M for Picture Hanging cabinets Tile Walls (Black)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71jVKK6yjqL._SL1500_.jpg",
                    Price = 417.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0GQBYMB2X?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0H4HFNRX9",
                    Title = "Avatar Leak-Proof, BPA-Free for Pre & Post-Workout 700 ml Tritan Shaker (Pack of 1, Black)",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61Ob6lI9dsL._SL1500_.jpg",
                    Price = 474.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0H4HFNRX9?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DJH69GKX",
                    Title = "FILO HEVIS Men's Self Cord Polyster Regular fit Textured Casual Shirt.",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61KpSDD-hOL._SL1012_.jpg",
                    Price = 759.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DJH69GKX?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DQQ58TY7",
                    Title = "NoStrain Men's EVA Slippers - Ultra-Cushioned Comfort Chappal for Man | Lightweight Rubber Slippers for Men | Anti-Skid Bathroom Slipper & Daily Wear Flip Flops",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/610EakbGlhL._SL1500_.jpg",
                    Price = 719.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DQQ58TY7?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FFSQ8M7P",
                    Title = "Stylish Blue Printed Floral Midi Dress for Women Anarkali Kurti Cotton Dress for Women- Flared Western Style Dress ||Western Frocks for Women Size s-3xl",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/810f8wtD2oL._SL1500_.jpg",
                    Price = 474.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FFSQ8M7P?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B01AC9G656",
                    Title = "WOW Life Science Apple Cider Vinegar 750ml | Organic Himalayan Apples | Mother of Vinegar with Probiotics | Unfiltered & Unpasteurized | For Weight Management, Reduced Bloating, Healthy Skin & Hair",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61K4JVeJk1L._SL1080_.jpg",
                    Price = 388.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B01AC9G656?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0H6K7PXT9",
                    Title = "AUSK Oversized T-Shirt for Womens || Graphic Front Printed Loose fit Womens Tshirt",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71T2Ds1VL-L._SL1500_.jpg",
                    Price = 799.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0H6K7PXT9?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GZVK81MN",
                    Title = "CHOSEN® TINTENSE® Tinted Sunscreen SPF 50 PA++++ | T1 (Bisque) | In-Vivo Tested | Lightweight Lotion | No White Cast | Broad Spectrum | Sweat Proof | With Hyaluronic acid & Beet extracts | Unisex, For All Skin Types | 40ml",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/41ZAbUO40wL._SL1080_.jpg",
                    Price = 1035.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0GZVK81MN?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0BMXCMP7T",
                    Title = "TAOCOCO Recliner Protector,1 Seater Armchair Slipcovers,Waterproof Recliner Slipcovers,Recliner Covers with Pockets,Anti Slip Reclining Sofa Covers,Arm Chair Covers for Pets/Dogs/Kids(Chocolate)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71Due0+JYoL._SL1500_.jpg",
                    Price = 1899.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0BMXCMP7T?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0D7J2VLDZ",
                    Title = "SBT Instruments Light & Optics Physics Lab Kit | 12 Acrylic Lenses with Ray Box (1, 3 & 5 Beam Modes) | Red Light Source Educational Set for Class 9–12 | Optics Experiment Kit with Carrying Bag",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/717oeW2l09L._SL1500_.jpg",
                    Price = 2649.0m,
                    OriginalPrice = 3311.25m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0D7J2VLDZ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0D9PDS3F7",
                    Title = "Parshutara Premium Kashmiri Garlic 200g | Snow Mountain Single Clove Garlic | High Allicin | Immunity & Energy Booster | Ayurvedic Natural Superfood | Strong Aroma | Handpicked & Chemical-Free",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61UQ5jeteNL._SL1350_.jpg",
                    Price = 349.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0D9PDS3F7?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DGQRZF7L",
                    Title = "exploralearn Ultimate Resin Art Kit - DIY Coaster Kit with 200 gm Epoxy Resin and silicone moulds - Comprehensive Resin Art Materials - Mica, Glitters and Flakes|Resin Art Kit for beginners|Multicolor",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81avBrDzF4L._SL1500_.jpg",
                    Price = 549.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0DGQRZF7L?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B096SSY867",
                    Title = "HARP® Green Shade Net 50% UV Stabilized – Sun & UV Protection for Greenhouse, Household, Nursery & Agriculture | Multipurpose Agro Netting | 1.5 m x 50 m (5 ft x 165 ft)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/719vKIyzcNL._SL1069_.jpg",
                    Price = 1892.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B096SSY867?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DMMCD7S3",
                    Title = "Noir's Premium Hazelnut Cappuccino Pods | Rich Dairy Creamer with Smoothy Hazelnut Flavor | Velvety Frothy Finish | Dolce Gusto Compatible Pods | Pack of 10",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51SSsVBN08L._SL1024_.jpg",
                    Price = 474.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0DMMCD7S3?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GHZB77S1",
                    Title = "Demon Slayer Kyojuro Rengoku Wooden Katana Sword, 104cm Premium Bamboo Anime Flame Hashira Cosplay Replica with Display Stand",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71GC1dgJrtL._SL1016_.jpg",
                    Price = 1844.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0GHZB77S1?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0D3VBVHF4",
                    Title = "castanea Glass Water Bottle with Leak-Proof Airtight Stainless Steel Lid for Water, Smoothie, Juices - Reusable Travel Glass Drinking Fridge Bottles - 1000ml (3)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51b2P0VYD-L._SL1000_.jpg",
                    Price = 736.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0D3VBVHF4?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FLK9WLZL",
                    Title = "AYUDH 25.6V 100AH Lithium Ferro Phosphate (LiFePO4) Inverter Battery, Solar Compatible, 5 Years Warranty, Smart Bluetooth Connectivity",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51-Kyhoh6VL._SL1500_.jpg",
                    Price = 36100.0m,
                    OriginalPrice = 45125.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0FLK9WLZL?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FP4YN39V",
                    Title = "RAD LVNG Cold Brew Coffee Grande | 350g Soy Wax Scented Candle | 45hr+ Burn | Gel Wax Cubes | Silicone Lid | Hand-Poured | Coffee, Cocoa, Vanilla | Gifting & Home Decor",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61Skvbd0+eL._SL1500_.jpg",
                    Price = 1044.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FP4YN39V?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GJRMYMPV",
                    Title = "Clip and Go Strap for Phone with Wallet Crossbody, Phone Strap with Zippered Wallet, Adjustable Anti Theft Cellphone Lanyard for Women, Cellphone Chain Accessories",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71ET5u98MiL._SL1500_.jpg",
                    Price = 569.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0GJRMYMPV?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0BY4XW79R",
                    Title = "Velocity Optics - Riding Sports Sunglass | Driving Clear Vision | Car Driving | Bike Riding Glasses (SG/VG781/D1)",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61QzfSdN0OL._SL1254_.jpg",
                    Price = 999.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0BY4XW79R?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CLS4DGF3",
                    Title = "Pure Cotton Lungi for Men, Premium Ethnicwear for Men | Blue Checkered Lungi | Hem Stitched Premium Single Dhoti | 100% Cotton Mundu (1.90 x 1.28 Meters)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61+QbXhT31L._SL1080_.jpg",
                    Price = 811.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0CLS4DGF3?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GFWR3ZRL",
                    Title = "IPL Hair Removal Device for Women & Men, At-Home Painless Permanent Hair Reduction Machine for Face, Legs, Underarms & Body, Safe & Easy Use",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51oz2ZfQYZL._SL1254_.jpg",
                    Price = 1599.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0GFWR3ZRL?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FFGFCFYQ",
                    Title = "Acrylic Windshield Cabinet for Digital Jewellery Scale – Dustproof Protective Cover for Precision Weighing, Transparent Display Case",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61N7UvjV3KL._SL1254_.jpg",
                    Price = 1540.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0FFGFCFYQ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CX9DDG3F",
                    Title = "Cotton Colors Silk Blouse Piece Material for Women, Unstitched (1 Meter Each) - Navratri, Durga Puja, Oti Bharan, Ugadi Special",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51xRSF9Sw9L._SX342_.jpg",
                    Price = 1187.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0CX9DDG3F?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DF1TYYB8",
                    Title = "Handmade Natural Cotton Dining Table Placemats | Heat Resistant Dining Table Place Mats for Kitchen Coffee Center Table & Eating Areas (Beige & White, 6 Pcs Placemats with 1 Runner(14'x72')",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/711RKIUxCgL._SL1500_.jpg",
                    Price = 616.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DF1TYYB8?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FML3XVBW",
                    Title = "Women's Hosiery Cotton Full Length Camisole Long Inner Wear Slip-Kurti Petticoat Nighty Pack of 2 Pc",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51wC8YeJsyL._SL1024_.jpg",
                    Price = 569.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FML3XVBW?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DS9L1HN1",
                    Title = "Activated Charcoal Powder (400g) | Coconut Shell-Based, Teeth Whitening, Detox & Skin Care, Food-Grade, Vegan, Chemical-Free",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61SGSlFTMWL._SL1024_.jpg",
                    Price = 268.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0DS9L1HN1?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B071158GLC",
                    Title = "Fashion Bizz Handcrafted Kamdhenu Cow Statue with Calf for Home Decor Gifting and Decorative Cow with Calf (19cmx12cmx15cm)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81i9IMfem9S._SL1500_.jpg",
                    Price = 949.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B071158GLC?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0F3V3HMNL",
                    Title = "100% Bamboo Large Bath Towel | Buttery Soft, Ultra-Absorbent, Lightweight, Anti-Microbial, Hypoallergenic, Quick Dry | Suitable for Daily use, Travel, Gym, Swimming (Beige Stripe)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61ir8uwK2OL._SL1200_.jpg",
                    Price = 899.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0F3V3HMNL?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GZVZJ7VQ",
                    Title = "Mosquito Net for Double Bed, 6.5x6.5 Feet 30 GSM Premium Double Bed Machardani, Strong and Durable, PVC Coated Tent Type, Foldable, Corrosion Resistant, King Size (White-Blue)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61Vs2hrDWNL._SL1280_.jpg",
                    Price = 569.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0GZVZJ7VQ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0H1VZLD5B",
                    Title = "Triple Strength Omega 3 Fish Oil capsules 2500mg | 900mg EPA & 600mg DHA with Vitamin D, E & K | Heart, Brain, Immunity, Bone & Metabolism Support | Lab Tested | 60 Softgels",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61UItoIpNTL._SL1254_.jpg",
                    Price = 749.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0H1VZLD5B?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FPBMMPQ3",
                    Title = "Sakha pola for Women Original – Bengali Sankha Pola Bangles Set – Wedding Red & White Bangles, Lahathi, Loha Badhano, Acrylic Plastic Bangles, Calcutta Chura, Size 2.6/2.8",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51mbNmfqHPL._SL1080_.jpg",
                    Price = 783.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0FPBMMPQ3?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0F9F67NYQ",
                    Title = "DigitalMantra bal krishna paper posters for pregnant women | krishna poster | laddu gopal poster | religious posters Multicolor 12 x 18 Inches (Pack of 4)",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71Ke+SbG1rL._SL1500_.jpg",
                    Price = 234.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0F9F67NYQ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GZHD9WXK",
                    Title = "iGluzCompatible with Vivo V70 / Vivo V70 Elite Camera Lens Protector (1 Pack) | Premium 9H Tempered Glass Camera Guard | Ultra Clear HD | Scratch Resistant | Case Friendly Fit | Bubble Free Easy Installation",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61yZ9ra8zpL._SL1200_.jpg",
                    Price = 284.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0GZHD9WXK?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GGTRM654",
                    Title = "Climbing Rose Seeds, All Season Everbloom Hybrid, Multicolour Flowers for Home Garden, 80+ Seeds",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/91WM0Tlq4uL._SL1500_.jpg",
                    Price = 151.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0GGTRM654?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0BXF58RQ2",
                    Title = "Casa Rica islamic muslim ayatul kursi mashaallah photo frame painting wall hanging for wall 18'x 30' inch set of 5 mdf laser cut (FGA 001)",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81Xb3sAFUOL._SL1500_.jpg",
                    Price = 474.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0BXF58RQ2?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FTZJ4YNB",
                    Title = "EazyPick | Reusable & Interdental Plastic Toothpicks | Eco-Friendly | Daily Oral Care & Hygiene | Fresh Breath | Long Lasting | Easy to Clean | Useful for Crowns, Braces, Implants | Pocket & Travel Friendly (Pastel Colors - 2 Packs)",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61G1rwIZaDL._SL1500_.jpg",
                    Price = 560.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0FTZJ4YNB?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FR9KCY6F",
                    Title = "SPADES Sipper Stainless Steel Water Bottle 500ml | BPA-Free Leakproof Bottle | Black & Silver Matte Finish | Gym, Travel & Office Use | Pack of 1",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61KMpSKB7hL._SL1500_.jpg",
                    Price = 217.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0FR9KCY6F?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FYY9YBYK",
                    Title = "DIY School Ribbon Hair Band for Kids and Girls Set of 2 - White and Black",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/41mtPwwyznL._SY355_PIbundle-2,TopRight,0,0_AA355SH20_.jpg",
                    Price = 182.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0FYY9YBYK?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DF7Z3X9S",
                    Title = "Handloom Cotton Contrast Linen Blend Bhagalpuri Saree",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51qhcMQWqQL._SX342_.jpg",
                    Price = 806.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DF7Z3X9S?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GKHP7VP5",
                    Title = "Women Soft Viscose Rayon Palazzo Pants Straight Wide Leg Relaxed Fit with Drawstring Flared Lounge Palazzo Pant",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/41UYXMEuKJL._SX342_.jpg",
                    Price = 445.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GKHP7VP5?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DVCBX593",
                    Title = "dockstreet Straight Wide fit Long Length Cotton Shorts for Men/Trending Multi Pocket Style, Relaxed Casual Shorts for Men",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51S-mZLbt9L._SL1280_.jpg",
                    Price = 278.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DVCBX593?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0D9KXBTSM",
                    Title = "dockstreet Women's/Unisex ONESOPEN Bottom Drawstring Pure Cotton Stretchable Baggy Jogger Pant",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61NAWX-6V9L._SL1066_.jpg",
                    Price = 358.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0D9KXBTSM?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GTMD6W3V",
                    Title = "MOKOSH Women’s Silk Embroidery Peplum Kurta Sharara with Dupatta | Anarkali Kurta Set | Sweetheart Neck Full Sleeve Ethnic Suit | 3 Piece Outfit | Indian Kurta Outfit With Sharara",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51CeB8RaIrL._SL1280_.jpg",
                    Price = 1364.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GTMD6W3V?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0F9WBXW4N",
                    Title = "INDO ERA Women's Straight Linen Floral Printed Kurta & Pant with Dupatta Set | Kurta Sets For Woman",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71Huqmjl9oL._SL1500_.jpg",
                    Price = 1899.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0F9WBXW4N?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GG459CD4",
                    Title = "ANNI Designer Women's Viscose Blend Straight Printed Kurta with Palazzo | Elbow Length Sleeve Kurti Set | Close Neck with Back Slit | Soft Comfortable Fabric | 2 Piece Outfit",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51CaJuDIWiL._SL1152_.jpg",
                    Price = 499.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GG459CD4?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FZC7WBQ6",
                    Title = "Pinkmint Women Short Kurti | Cotton Blend Printed Tunic Top | Trendy Casual Top | Casual & Office Wear Ethnic Top for Jeans",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81b9vWBNBAL._SL1500_.jpg",
                    Price = 399.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FZC7WBQ6?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DJJG3GTJ",
                    Title = "Pinkmint Printed Kurti for Women's ll Straight Kurtis for Women's ll Stylished Kurti (Pack of 6)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71u27hitOCL._SX342_.jpg",
                    Price = 999.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DJJG3GTJ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DK1Z5F45",
                    Title = "Pinkmint Women's Printed Kurti for Women's Round Neck Straight Kurti for Women (Pack of 6 | Avaiable in Plus Size)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71M0jkePrJL._SX342_.jpg",
                    Price = 949.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DK1Z5F45?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FZ45F1G2",
                    Title = "Arayna Women’s Cotton Printed Kurta Set with Pants & Dupatta – 3/4 Sleeve | Elegant Ethnic Wear",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/819MxR2cJOL._SL1500_.jpg",
                    Price = 899.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FZ45F1G2?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DNSMRPXQ",
                    Title = "Pinkmint Women's Printed Kurti for Women's Round Neck Straight Kurti for Women (Pack of 5 | Avaiable in Plus Size)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61EmQlJLx6L._SX342_.jpg",
                    Price = 849.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DNSMRPXQ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GSJPFBJ2",
                    Title = "rytras Women Pure Cotton Printed A-Line Kurta Sets with Palazzos|Kurti Set for Woman|Cord Set for Women Cotton",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71g77aGD5DL._SL1500_.jpg",
                    Price = 699.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GSJPFBJ2?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FRN7JNB9",
                    Title = "Arayna Women’s Pure Cotton Floral Kurta Set with Pants & Dupatta | Embroidered V-Neck Ethnic Suit",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81Oau4eEuQL._SL1500_.jpg",
                    Price = 999.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FRN7JNB9?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FBMGY5ZV",
                    Title = "SKYLEE Silk Blend Weaving and Embroidery Lace Straight Kurta Set with Dupatta",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71MyTP6sOpL._SL1500_.jpg",
                    Price = 839.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FBMGY5ZV?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0C9Q2KLJX",
                    Title = "Shiv Textiles Kurta Pant Set with Dupatta for Women",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61ZY8DRsr2L._SL1440_.jpg",
                    Price = 819.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0C9Q2KLJX?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GQ49CC1V",
                    Title = "HELLCAT Floral Brown Women Dress|New Trending Dress for Women|Western 3/4 Sleeve A-line",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61VMz5yfhJL._SL1500_.jpg",
                    Price = 899.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GQ49CC1V?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GC7DTLKR",
                    Title = "Leriya Fashion Kurta Sets for Woman | Printed Jaipuri Ajrakh Kurta Set With Dupatta for Women | Kurti Set for Woman | Anarkali Suit for Women | Traditional Anarkali Salwar Suit for Party Outfits Kurtis",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71woijRAruL._SL1500_.jpg",
                    Price = 899.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GC7DTLKR?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CXSSWBF7",
                    Title = "feranoid Angrakha Sleeveless Wrap Around Dress",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81eCD9S3zOL._SL1440_.jpg",
                    Price = 854.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0CXSSWBF7?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DVZ8M49N",
                    Title = "eightone Women Floral Print Cotton Midi Dress, Short Sleeve, White with Yellow and Red Flowers, A-Line Fit",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61ug-Nud0hL._SL1500_.jpg",
                    Price = 545.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DVZ8M49N?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0G58XXL1V",
                    Title = "HELLCAT Womens Floral Printed Olive Shoulder Straps Dress | Western A-Line V Neck Midi Dress for Womens",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71v5A0fyvcL._SL1500_.jpg",
                    Price = 899.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0G58XXL1V?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CM8DCJZ7",
                    Title = "7Threads Women Fashion Vest",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51yK7V3TNYL._SY445_.jpg",
                    Price = 347.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0CM8DCJZ7?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0D5YNC787",
                    Title = "Plain Cotton Slub Straight Dress Kurti for Ladies Girls - Combo Pack of 2 Grey & Peach Color",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61nDqMXvzzL._SL1500_.jpg",
                    Price = 474.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0D5YNC787?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0F9YRWVPQ",
                    Title = "Naixa Women's Chanderi Embroidered Flared Kurta with Pant and Dupatta Sets (NX-762)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61lgdfCbtoL._SL1440_.jpg",
                    Price = 1449.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0F9YRWVPQ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DYDNKF21",
                    Title = "Naixa Women's Rayon Embroidered Straight Kurta with Pant and Dupatta Sets (Available in Plus Size) (NX-696)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71j8AaFRZdL._SL1500_.jpg",
                    Price = 898.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DYDNKF21?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DF2TVTKB",
                    Title = "Titan Essence Classic Wall Clock with White Dial & Case, Silent Sweep, Model W0094PA01 | 30 cm x 30 cm",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81BM-UQajlL._SL1500_.jpg",
                    Price = 1292.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0DF2TVTKB?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0BLCM1BQD",
                    Title = "Vilvah Milk Drops Brightening Serum | Fades Dark Spots, Treats Hyperpigmentation & Evens Skin Tone | Hyaluronic Acid & Alpha Arbutin Serum for Women & Men | Suitable for All Skin Types | 20ml",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/41jRw8o93eL._SL1000_.jpg",
                    Price = 544.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0BLCM1BQD?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DQ4X4L4D",
                    Title = "Wild Stone 4 Ultra Sensual and 4 Forest Spice Combo for Men, Pack of 8 (100gm each)",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71R9yEvRVCL._SL1500_.jpg",
                    Price = 220.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0DQ4X4L4D?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B07SD1XPJB",
                    Title = "UV Doux Silicone Sunscreen Gel SPF 50 PA+++|India’s No.1 Dermatologist Recommended Brand|Invitro,In-Vivo Tested|UVA/UVB Protection, Benzene Free|No White Cast |Oily & Acne-Prone Skin |100 g",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51InaMoxZ4L._SL1080_.jpg",
                    Price = 1365.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B07SD1XPJB?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GQXJVNY5",
                    Title = "Vedix Keshamrut Ayurvedic Herb-Infused Hair Oil | Pack of 3 | Herb-Infused Hair Oil | 16+ Whole Herbs, No Mineral Oil | Controls hair fall & boosts growth | For women & men",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/8118JURUiIL._SL1500_.jpg",
                    Price = 1096.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0GQXJVNY5?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B07CJXFLQ7",
                    Title = "Selsun Abbott Suspension Anti Dandruff Shampoo for Men and Women, Clears Away Dandruff Flakes, Relieves From Excessive Oil, Relieves From Dandruff Related Itching- 120 ml",
                    Description = "Check out this top-rated education product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51-RLrdi0ML._SL1080_.jpg",
                    Price = 392.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Education",
                    ProductUrl = "https://www.amazon.in/dp/B07CJXFLQ7?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DXVVR6J2",
                    Title = "Vilvah Face Brightening Combo | Milk Powder Face Wash (50g) & Milk Drops Brightening Serum (20ml) | Brightens Skin, Evens Tone & Fades Dark Spots | Controls Excess Oil & Reduces Blackheads | For All Skin Types, Unisex",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/510K3FXamtL._SL1080_.jpg",
                    Price = 911.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0DXVVR6J2?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0C1G7JY5D",
                    Title = "Fixderma Shadow Sunscreen SPF 50+ Gel for Oily Skin | Sunscreen for Body & Face | Broad Spectrum Protection from UVA & UVB | For Women & Men | Non Greasy & Water Resistant - 40gm",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61Pkpvy9LwL._SL1200_.jpg",
                    Price = 277.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0C1G7JY5D?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B096MNYLWS",
                    Title = "The Derma Co 10% Vitamin C Face Serum with 5% Niacinamide, Powered by Deep Penetration Formula™ | Fades Dark Spots | Reduces Pigmentation | Boosts Collagen | Brightens Skin | All Skin Types | 30 ml",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/618ninTUjSL._SL1080_.jpg",
                    Price = 628.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B096MNYLWS?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0BK1HQZD4",
                    Title = "HAMMONDS FLYCATCHER Genuine Leather Belt for Men, Premium Leather Belt with Auto Lock mechanism, Mens Belt Leather Branded with Slide Lock for Everyday Wear",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81o6-yqS+5L._SL1500_.jpg",
                    Price = 889.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0BK1HQZD4?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B097MR5L9H",
                    Title = "Hammonds Flycatcher Genuine Leather Office Bag for Men, Laptop Bag for 15.6 Inch Laptop, Adjustable Strap, Multi Compartments, Trolley Strap, 1 Year Warranty - Brown",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81nNiogZ0uL._SL1500_.jpg",
                    Price = 5889.0m,
                    OriginalPrice = 7361.25m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B097MR5L9H?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B07PVQ9YXJ",
                    Title = "HAMMONDS FLYCATCHER Genuine Leather Office Bag for Men, 2in1 New Brown Laptop Bag for Men, Fits 15.6' Laptop, Adjustable Strap, Multi Compartments Ideal for Office, Travel, Daily Use, 1 Year Warranty",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81eNAdetfuL._SL1500_.jpg",
                    Price = 6559.0m,
                    OriginalPrice = 8198.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B07PVQ9YXJ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B083M1MGSG",
                    Title = "HAMMONDS FLYCATCHER Genuine Leather Office Bag for Men, Premium 15.6 Inch Laptop Bag for Men, Multi Compartments & Adjustable Strap, Ideal for Office, Travel, Daily Use - 1 Year Warranty - Black",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71JmQ5ThI+L._SL1500_.jpg",
                    Price = 5219.0m,
                    OriginalPrice = 6523.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B083M1MGSG?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DRVSXG4M",
                    Title = "Kamiliant Polypropylene KAM Hard Shell 8 Wheels Spinner Suitcase Might DW SP68CM MIL.OLV,Brown, Medium",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71Ik6+C2KYL._SL1500_.jpg",
                    Price = 2295.0m,
                    OriginalPrice = 2868.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DRVSXG4M?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B01M71S2UG",
                    Title = "HAMMONDS FLYCATCHER Genuine Leather Office Bag for Men, Stylish 15.6 Inch Laptop Bag for Men, Multi Compartments, Adjustable Strap - 1 Year Warranty - Ideal for Office, Travel, Daily Use - Brown",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/8101WFmSIpL._SL1500_.jpg",
                    Price = 3869.0m,
                    OriginalPrice = 4836.25m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B01M71S2UG?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CWS3V8QN",
                    Title = "Portronics My Buddy K11 Metal Laptop Stand with 360° Rotation, Height & Angle Adjustable, Foldable Design, Improves Air Flow, Carbon Steel Body, 10 kg Max Weight for Laptops & MacBook (Black)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61i05gGBl3L._SL1500_.jpg",
                    Price = 1099.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0CWS3V8QN?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CW2VHDS4",
                    Title = "HP GK400F Mechanical Gaming Keyboard,dust & Spill Resistant,RGB Backlit Keys,Metal Panel,Full-Sized Keyboard Design",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61rq1YS1XVL._SL1500_.jpg",
                    Price = 1549.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0CW2VHDS4?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0D2XJG7HS",
                    Title = "Parx Men Regular Fit Solid Pattern Cotton Polyester Blend Half Sleeve Polo Neck Casual T-Shirt",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/51jAEh+SfiL._SL1500_.jpg",
                    Price = 552.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0D2XJG7HS?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GJDS2WB5",
                    Title = "GODFREY Half Cotton Polo T Shirt for Man with Pocket - Regular Fit Mens Collar Tshirt",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71j8cNdaMiL._SL1500_.jpg",
                    Price = 638.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GJDS2WB5?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GDQQV42Z",
                    Title = "LEOTUDE Men’s Oversize Graphic Printed Combo Pack of 3 T-Shirt | Round Neck Half Sleeve T-Shirt for Men's (Combo : Pack of 3)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71uHXP5j6IL._SL1500_.jpg",
                    Price = 798.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GDQQV42Z?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FRMRNYVH",
                    Title = "BULLMER Trendy Regular Fit Cotton Blend Printed Casual Half Sleeve Shirt for Men | Stylish Mens Casual Shirts | Shirts for Men",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71LaTYRrOQL._SL1500_.jpg",
                    Price = 659.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FRMRNYVH?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DWSHZV9F",
                    Title = "Lymio Polo T Shirt for Men || T Shirt for Man || Collar T Shirt Style Men (Packs Also Available) (Polo-59-62)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71faeST1ckL._SL1500_.jpg",
                    Price = 399.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0DWSHZV9F?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FB3TVW27",
                    Title = "SANE ORIGINALS Half Sleeve Polo T-Shirt for Men with Pocket || Stripe Collar and Pocket T-Shirt for Men Half Sleeves",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71RgYJrw2iL._SL1500_.jpg",
                    Price = 521.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FB3TVW27?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0B73DJD8J",
                    Title = "STELLERS Men's Premium Printed Polo T-Shirt | Wrinkle Free | Quick Dry | Breathable | Stretchable | Regular Fit",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/91OquzlLPJL._SL1500_.jpg",
                    Price = 799.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0B73DJD8J?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0F9T4G2YQ",
                    Title = "Lymio Polo T Shirt for Men || T Shirt for Man || Collar T Shirt Style Men (Packs Also Available) (Polo-51-54)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61pTsX9t3WL._SL1500_.jpg",
                    Price = 749.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0F9T4G2YQ?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FV36BV1Z",
                    Title = "Amazon Brand - Symbol Men's Cotton Rich Solid Polo Tshirt | Collar Tshirts | Half Sleeves | Plain-Regular Fit (Available in Plus Sizes and Combo Pack of 2)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71piaanc3fL._SL1500_.jpg",
                    Price = 839.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FV36BV1Z?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0BTYVNFF2",
                    Title = "Parent Men Breathable Pouch Men Underwear Packs Mesh Boxer Briefs | Dots | Pack of 3",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/614Ti36wkjL._SL1024_.jpg",
                    Price = 552.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0BTYVNFF2?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0F7J2H8F2",
                    Title = "Ayurveda Jamun Seed Powder, 500 gm | For Diabetes, Herbal Supplement",
                    Description = "Check out this top-rated shopping product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61lhDNXJkML._SL1254_.jpg",
                    Price = 275.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Shopping",
                    ProductUrl = "https://www.amazon.in/dp/B0F7J2H8F2?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0H2SHZ166",
                    Title = "Honeycomb Wall Sconce Set of 2, 3 Color Modes | Metal & Acrylic Hexagon Wall Lights, Pair for Bedroom, Living Room, Hallway, 8W LED, Warm/Neutral/Cool",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71h0i98im+L._SL1254_.jpg",
                    Price = 949.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0H2SHZ166?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GKPJZJ6V",
                    Title = "Vacuum Storage Bags with Electric Air Pump, 4 Pack Small Vacuum Seal Bags for Clothing, Space Saver Vacuum Storage Bags for Blanket, Duvets, Pillows, Comforters",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71Z787L97wL._SL1254_.jpg",
                    Price = 499.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0GKPJZJ6V?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0F2JPQ8BV",
                    Title = "Clear Airtight Glass Milk, Juice & Water Bottle with Leak Proof Lid for Refrigerator, Set of 2, 1000ml (Transparent)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/614oFG24txL._SL1500_.jpg",
                    Price = 878.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0F2JPQ8BV?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0D6YLZQ9V",
                    Title = "Bleaching Powder 10 KG Pack",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/91YKA+n-M3L._SL1500_.jpg",
                    Price = 854.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0D6YLZQ9V?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0DK7KBXYM",
                    Title = "Silverglow Apple Stainless Steel Silver Dinner Set of 6 pcs, Pure-Silver Plated Luxury dinnerware Set, Ideal for Home, Restaurant, Gifting, Wedding, Hotel, Restaurant, Traditional thali Set",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/618ajPTV73L._SL1500_.jpg",
                    Price = 2137.0m,
                    OriginalPrice = 2671.25m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0DK7KBXYM?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0GTYDFFDH",
                    Title = "Portable Personal Blender Bottle – USB Rechargeable Smoothie Maker with Travel Lid, Powerful Mini Juicer for Fruits & Vegetables, BPA-Free, Easy Clean (Multicolour, Juicer Mixer Blende)",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71+Q6Yhp4ML._SL1500_.jpg",
                    Price = 939.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0GTYDFFDH?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0FGQKFN3K",
                    Title = "100% Pure Cotton Jaipuri Bedsheet with Pillow Covers | Soft & Breathable Fabric | Traditional Floral Print | Cotton Bedsheet (Peach, Single)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/A1GXeNW0+BL._SL1500_.jpg",
                    Price = 392.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0FGQKFN3K?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B083VDZ8T4",
                    Title = "Sandpuppy Coldstrap - Reusable Cold Ice Pack | Ice pack for Injury And Muscle Soreness Pain Relief | Ice pack for Knees, Back, Shoulder, Hip, Neck, Ankle| Long Lasting|With Stretch Band to Enhance Fit and Comfort.",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71BLzYWjLML._SL1500_.jpg",
                    Price = 598.0m,
                    OriginalPrice = 1999.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B083VDZ8T4?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0CP3RM6NV",
                    Title = "TAOCOCO 100% Waterproof Loveseat Recliner Covers Reversible, Brown | Dual Recliner Protector with Leg Straps, Washable 2 Seat Reclining Sofa Slipcover with Storage Pocket for Pets & Kids",
                    Description = "Check out this top-rated kitchen & home product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71afK6InU1L._SL1500_.jpg",
                    Price = 2374.0m,
                    OriginalPrice = 2967.5m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B0CP3RM6NV?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0H7CS34CB",
                    Title = "Khadi Essential Cotton Gadda Mattress | Double Bed | 72x36x5 Inch | 100% Pure Cotton Fabric | Reversible | All Season Breathable | Soft & Firm | (Single)",
                    Description = "Check out this top-rated lifestyle product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/71UWuThhFRL._SL1254_.jpg",
                    Price = 2279.0m,
                    OriginalPrice = 2848.75m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Lifestyle",
                    ProductUrl = "https://www.amazon.in/dp/B0H7CS34CB?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
                },
                new AmazonProduct
                {
                    Asin = "B0F3X825PN",
                    Title = "Aqua X pure Black water Purifier with Smart LED Indicators | RO+UV+UF+ Alkaline Technology |12 Stages Purification | 20 LPH Purification | Advanced High TDS Membrane |1 Year Warranty.",
                    Description = "Check out this top-rated electronics product verified by our team. High-quality details, actual product images, and best-value discount pricing.",
                    ImageUrl = "https://m.media-amazon.com/images/I/61N0FefjeYL._SL1080_.jpg",
                    Price = 4560.0m,
                    OriginalPrice = 5700.0m,
                    Rating = 4.4,
                    ReviewCount = 1420,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0F3X825PN?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
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
