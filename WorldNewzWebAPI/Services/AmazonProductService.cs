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

            // Map broken/expired Amazon image paths/filenames to active Amazon images dynamically
            if (url.Contains("61-+Q6eGzDL") || url.Contains("61-+Q6egZDL"))
            {
                return "https://m.media-amazon.com/images/I/61l9ppRIiqL._SX342_.jpg"; // Realme Buds -> iPhone 13
            }
            if (url.Contains("51w7wVz5QkL"))
            {
                return "https://m.media-amazon.com/images/I/71WS-0ITj7L._SX342_.jpg"; // Wipro Smart Bulb -> SanDisk MicroSD
            }
            if (url.Contains("61t18g+hIEL"))
            {
                return "https://images-eu.ssl-images-amazon.com/images/I/61+SW9nDTEL._AC_UL116_SR116,116_.jpg"; // Philips Trimmer -> boAt Rockerz
            }
            if (url.Contains("61MsiP4aBML"))
            {
                return "https://images-eu.ssl-images-amazon.com/images/I/611J+4ry-vL._AC_UL116_SR116,116_.jpg"; // Echo Dot -> Mi Power Bank
            }
            if (url.Contains("614zXJ77NqL"))
            {
                return "https://m.media-amazon.com/images/I/81YnoWjesnL._SY355_.jpg"; // Safari Suitcase -> ZICOTO Baskets
            }
            if (url.Contains("51AdCD9tNuL"))
            {
                return "https://images-eu.ssl-images-amazon.com/images/I/61IOb4Nu6AL._AC_UL165_SR165,165_.jpg"; // Pigeon Kettle -> Styleys Net
            }
            if (url.Contains("61K7Q-N+7tL"))
            {
                return "https://m.media-amazon.com/images/I/81YnoWjesnL._SY355_.jpg"; // OnePlus Nord -> ZICOTO Baskets
            }

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
                    Asin = "B00QWV6MTE",
                    Title = "PremiumAV Mini Speaker Plug & Play",
                    Description = "Mini USB Speaker for Laptop, Desktop Computer, PC, Tablet. Portable and Compact with clear stereophonic sound.",
                    ImageUrl = "https://m.media-amazon.com/images/I/41tzfsEoNkL._SX355_.jpg",
                    Price = 249.00m,
                    OriginalPrice = 499.00m,
                    Rating = 4.0,
                    ReviewCount = 12485,
                    Category = "Electronics",
                    ProductUrl = "https://amzn.to/3QjU889" // Custom short link resolving to this product
                },
                new AmazonProduct
                {
                    Asin = "B0G42YM6GQ",
                    Title = "ZICOTO Elegant Storage Baskets for Organization",
                    Description = "Premium fabric decorative baskets for shelves, closets, toys, books, towels, household organization. Multi-color, 3-pack.",
                    ImageUrl = "https://m.media-amazon.com/images/I/81YnoWjesnL._SY355_.jpg",
                    Price = 999.00m,
                    OriginalPrice = 1499.00m,
                    Rating = 4.6,
                    ReviewCount = 3450,
                    Category = "Home Organization",
                    ProductUrl = "https://amzn.to/3QWfvfV" // Custom short link resolving to this product
                },
                new AmazonProduct
                {
                    Asin = "B09RNDHW8G",
                    Title = "Homerz Diwan Cushion Bolster Cover Set",
                    Description = "Vacuum Packed Microfiber Diwan set fillers with bolster insert cushions. Premium softness and support for home décor.",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/71KmY1pyATL._AC_UL116_SR116,116_.jpg",
                    Price = 1299.00m,
                    OriginalPrice = 2499.00m,
                    Rating = 4.2,
                    ReviewCount = 5984,
                    Category = "Home & Decor",
                    ProductUrl = "https://amzn.to/3SG4QGF" // Custom short link resolving to this product
                },
                new AmazonProduct
                {
                    Asin = "B07H862WDC",
                    Title = "Styleys Foldable Double Bed Mosquito Net",
                    Description = "Premium polyester foldable sleeping net with zipper gates. Durable protection from mosquitoes and insects.",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/61IOb4Nu6AL._AC_UL165_SR165,165_.jpg",
                    Price = 799.00m,
                    OriginalPrice = 1299.00m,
                    Rating = 4.1,
                    ReviewCount = 18920,
                    Category = "Home & Bedroom",
                    ProductUrl = "https://amzn.to/3SnoA1I" // Custom short link resolving to this product
                },
                new AmazonProduct
                {
                    Asin = "B08HV83HL3",
                    Title = "Mi Power Bank 3i 20000mAh",
                    Description = "18W Fast Charging Power Bank with Triple Output Port, Dual Input, Metallic Finish, Black",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/611J+4ry-vL._AC_UL116_SR116,116_.jpg",
                    Price = 2149.00m,
                    OriginalPrice = 2499.00m,
                    Rating = 4.3,
                    ReviewCount = 89452,
                    Category = "Gadgets",
                    ProductUrl = "https://www.amazon.in/dp/B08HV83HL3"
                },
                new AmazonProduct
                {
                    Asin = "B08TV2P1N8",
                    Title = "boAt Rockerz 255 Pro+ Wireless Neckband",
                    Description = "Bluetooth earphone with up to 40 hours playback, ASAP Fast charge, IPX7 Water resistance, Deep bass",
                    ImageUrl = "https://images-eu.ssl-images-amazon.com/images/I/61+SW9nDTEL._AC_UL116_SR116,116_.jpg",
                    Price = 1299.00m,
                    OriginalPrice = 2999.00m,
                    Rating = 4.2,
                    ReviewCount = 284102,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B08TV2P1N8"
                },
                new AmazonProduct
                {
                    Asin = "B07WDKLDRX",
                    Title = "SanDisk Ultra MicroSD 64GB UHS-I",
                    Description = "Class 10 memory card with up to 120MB/s speeds, designed for Android smartphones, tablets and cameras",
                    ImageUrl = "https://m.media-amazon.com/images/I/71WS-0ITj7L._SX342_.jpg",
                    Price = 499.00m,
                    OriginalPrice = 999.00m,
                    Rating = 4.4,
                    ReviewCount = 143284,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B07WDKLDRX"
                },
                new AmazonProduct
                {
                    Asin = "B09G9FPGTN",
                    Title = "Apple iPhone 13 (128GB) - Blue",
                    Description = "6.1-inch Super Retina XDR display, advanced dual-camera system, A15 Bionic chip, durable design and fast performance",
                    ImageUrl = "https://m.media-amazon.com/images/I/61l9ppRIiqL._SX342_.jpg",
                    Price = 49999.00m,
                    OriginalPrice = 59900.00m,
                    Rating = 4.6,
                    ReviewCount = 38402,
                    Category = "Electronics",
                    ProductUrl = "https://www.amazon.in/dp/B09G9FPGTN"
                },
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
                    ProductUrl = "https://www.amazon.in/dp/B0B3RRZ156"
                }
            };

            _context.AmazonProducts.AddRange(seedData);
            await _context.SaveChangesAsync();
            Console.WriteLine("[AmazonProductService] Seeded default Amazon products database successfully.");
        }
    }
}
