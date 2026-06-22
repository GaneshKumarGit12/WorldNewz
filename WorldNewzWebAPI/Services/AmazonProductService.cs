using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

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
            // Seed defaults if table is empty
            if (!await _context.AmazonProducts.AnyAsync())
            {
                await SeedDefaultProductsAsync();
            }

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
            if (!await _context.AmazonProducts.AnyAsync())
            {
                await SeedDefaultProductsAsync();
                return;
            }

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
                return "https://via.placeholder.com/600x400?text=Amazon+Product";
            }

            url = url.Trim();

            // If it's already an absolute URL, return it
            if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
                url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                return url;
            }

            // If it's just the Amazon image ID/filename, prefix it
            return $"https://images-eu.ssl-images-amazon.com/images/I/{url}";
        }

        /// <summary>
        /// Seeds default high-converting product deals in Amazon India
        /// </summary>
        private async Task SeedDefaultProductsAsync()
        {
            var seedData = new List<AmazonProduct>
            {
                new AmazonProduct
                {
                    Asin = "B0B3RRZ156",
                    Title = "Noise Pulse 2 Max Smart Watch",
                    Description = "1.85'' Display, Bluetooth Calling, 550 Nits Brightness, Smart DND, 10 Days Battery, Space Blue",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/61SSVxTSs3L._AC_UL450_SR450,320_.jpg",
                    Price = 1199.00m,
                    OriginalPrice = 5999.00m,
                    Rating = 4.1,
                    ReviewCount = 84932,
                    Category = "Smartwatches",
                    ProductUrl = "https://amzn.to/3QjU889" // Custom short link provided by user
                },
                new AmazonProduct
                {
                    Asin = "B0BY8MCQ9S",
                    Title = "OnePlus Nord CE 3 Lite 5G",
                    Description = "8GB RAM, 128GB Storage, Pastel Lime Smartphone, 108MP Camera, 67W SuperVOOC Charging",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/61K7Q-N+7tL._AC_UL450_SR450,320_.jpg",
                    Price = 17499.00m,
                    OriginalPrice = 19999.00m,
                    Rating = 4.2,
                    ReviewCount = 120485,
                    Category = "Electronics",
                    ProductUrl = "https://amzn.to/3QWfvfV" // Custom short link provided by user
                },
                new AmazonProduct
                {
                    Asin = "B0B8SPM55L",
                    Title = "Safari Pentagon 3 Pc Trolley Suitcase Set",
                    Description = "Polypropylene Hard luggage Suitcase Set (Small, Medium, Large) - Red, 4-wheel Spinner",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/614zXJ77NqL._AC_UL450_SR450,320_.jpg",
                    Price = 5299.00m,
                    OriginalPrice = 19750.00m,
                    Rating = 4.0,
                    ReviewCount = 14322,
                    Category = "Travel Bags",
                    ProductUrl = "https://amzn.to/3SG4QGF" // Custom short link provided by user
                },
                new AmazonProduct
                {
                    Asin = "B01LWY7QNH",
                    Title = "Pigeon by Stovekraft 1.5L Kettle",
                    Description = "1500 Watt Electric Kettle, Stainless Steel Body, Auto Shut-Off, Cool Touch Handle",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/51AdCD9tNuL._AC_UL450_SR450,320_.jpg",
                    Price = 625.00m,
                    OriginalPrice = 1195.00m,
                    Rating = 3.9,
                    ReviewCount = 158403,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://amzn.to/3SnoA1I" // Custom short link provided by user
                },
                new AmazonProduct
                {
                    Asin = "B09B8VF1TC",
                    Title = "Echo Dot 5th Gen with Alexa",
                    Description = "Smart Speaker with Alexa, Deep Bass, Crisp Vocals, Motion Detection & Temperature Sensor",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/61MsiP4aBML._AC_UL450_SR450,320_.jpg",
                    Price = 4499.00m,
                    OriginalPrice = 5499.00m,
                    Rating = 4.4,
                    ReviewCount = 28410,
                    Category = "Gadgets",
                    ProductUrl = "https://www.amazon.in/dp/B09B8VF1TC"
                },
                new AmazonProduct
                {
                    Asin = "B072L51K18",
                    Title = "Philips Multi Grooming Kit",
                    Description = "9-in-1 Face, Hair and Body Trimmer, DualCut blades, Run time 80 mins, Series 3000",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/61t18g+hIEL._AC_UL450_SR450,320_.jpg",
                    Price = 1449.00m,
                    OriginalPrice = 1825.00m,
                    Rating = 4.3,
                    ReviewCount = 98402,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B072L51K18"
                },
                new AmazonProduct
                {
                    Asin = "B08D9BDY7K",
                    Title = "Wipro 12W Smart LED Bulb",
                    Description = "Compatible with Alexa and Google Assistant, 16 Million Colors + Warm White, WiFi Enabled",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/51w7wVz5QkL._AC_UL450_SR450,320_.jpg",
                    Price = 599.00m,
                    OriginalPrice = 1990.00m,
                    Rating = 4.0,
                    ReviewCount = 49204,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://www.amazon.in/dp/B08D9BDY7K"
                },
                new AmazonProduct
                {
                    Asin = "B0CGDB2KQC",
                    Title = "Realme Buds T300 TWS",
                    Description = "Active Noise Cancellation 30dB, 40 hours battery life, 360 Spatial Audio, Bass Boost Driver",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/61-+Q6eGzDL._AC_UL450_SR450,320_.jpg",
                    Price = 2299.00m,
                    OriginalPrice = 3999.00m,
                    Rating = 4.1,
                    ReviewCount = 18402,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B0CGDB2KQC"
                }
            };

            _context.AmazonProducts.AddRange(seedData);
            await _context.SaveChangesAsync();
            Console.WriteLine("[AmazonProductService] Seeded default Amazon products database successfully.");
        }
    }
}
