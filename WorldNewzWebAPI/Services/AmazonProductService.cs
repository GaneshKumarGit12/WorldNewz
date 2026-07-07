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

        /// <summary>
        /// Seeds and synchronizes default high-converting product deals in Amazon India
        /// </summary>
        private async Task EnsureDefaultProductsSeededAsync()
        {
            var seedData = new List<AmazonProduct>
            {
                new AmazonProduct
                {
                    Asin = "B08H88N2N9",
                    Title = "Cubelelo Drift 3x3 Stickerless Warrior Speed Cube",
                    Description = "High-speed stickerless 3x3 speed cube with smooth turning and frosted surface design for puzzle enthusiasts.",
                    ImageUrl = "/images/cubelelo_cube.png",
                    Price = 249.00m,
                    OriginalPrice = 399.00m,
                    Rating = 4.3,
                    ReviewCount = 8430,
                    Category = "Gadgets",
                    ProductUrl = "https://amzn.to/4w4F7Gc"
                },
                new AmazonProduct
                {
                    Asin = "B07QBBV15F",
                    Title = "Little Angel Baby Diaper Pants (X-Large, Pack of 4)",
                    Description = "Super absorbent baby diapers with 360-degree soft stretch waistband, bubble bed technology, and up to 12 hours protection.",
                    ImageUrl = "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60",
                    Price = 699.00m,
                    OriginalPrice = 999.00m,
                    Rating = 4.1,
                    ReviewCount = 3200,
                    Category = "Shopping",
                    ProductUrl = "https://amzn.to/4eKLuaC"
                },
                new AmazonProduct
                {
                    Asin = "B09RNDHW8G",
                    Title = "Homerz Diwan Cushion Bolster Set (Vacuum Packed)",
                    Description = "Premium microfiber fillers with bolster cushions. Soft comfort, hypoallergenic material, and durable support for home styling.",
                    ImageUrl = "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&auto=format&fit=crop&q=60",
                    Price = 1299.00m,
                    OriginalPrice = 2499.00m,
                    Rating = 4.2,
                    ReviewCount = 5984,
                    Category = "Home & Decor",
                    ProductUrl = "https://amzn.to/3SG4QGF"
                },
                new AmazonProduct
                {
                    Asin = "B0DZDXCFYX",
                    Title = "Conair Handheld Compact Garment Steamer",
                    Description = "Compact and powerful fabric steamer that quickly removes wrinkles from clothes, drapes, and upholstery. Travel-friendly design.",
                    ImageUrl = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60",
                    Price = 2499.00m,
                    OriginalPrice = 3999.00m,
                    Rating = 4.3,
                    ReviewCount = 1540,
                    Category = "Home Appliances",
                    ProductUrl = "https://amzn.to/4apYj99"
                },
                new AmazonProduct
                {
                    Asin = "B00QWV6MTE",
                    Title = "PremiumAV Mini Speaker Plug & Play",
                    Description = "Mini USB 2.0 speaker for laptops and computers. Rich stereo sound, compact portable design, and easy plug-and-play setup.",
                    ImageUrl = "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60",
                    Price = 249.00m,
                    OriginalPrice = 499.00m,
                    Rating = 4.0,
                    ReviewCount = 12485,
                    Category = "Electronics",
                    ProductUrl = "https://amzn.to/3QjU889"
                },
                new AmazonProduct
                {
                    Asin = "B0821XB1Q6",
                    Title = "Amazon Pay Insurance Premium Payment (via Billdesk)",
                    Description = "Secure your vehicle or health with Amazon Pay Insurance. Paperless booking, instant premium payment, and quick claim approvals.",
                    ImageUrl = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&auto=format&fit=crop&q=60",
                    Price = 499.00m,
                    OriginalPrice = 599.00m,
                    Rating = 4.5,
                    ReviewCount = 920,
                    Category = "Services",
                    ProductUrl = "https://amzn.to/4oUWYNF"
                },
                new AmazonProduct
                {
                    Asin = "B07JJ5TFY1",
                    Title = "MMR Making Marvelous Ultimate Cockroach Gel",
                    Description = "Highly effective pest control cockroach bait gel. Easy application, fast action, and long-lasting protection for kitchen and home.",
                    ImageUrl = "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=60",
                    Price = 199.00m,
                    OriginalPrice = 299.00m,
                    Rating = 4.0,
                    ReviewCount = 4120,
                    Category = "Kitchen & Home",
                    ProductUrl = "https://amzn.to/3SwQ7xR"
                },
                new AmazonProduct
                {
                    Asin = "B07G8BVF7X",
                    Title = "VIP Ultima Cotton Briefs (Assorted Colors, Pack of 4)",
                    Description = "Premium cotton interlock fabric trunks with soft outer elastic waistband. Super breathable and comfortable for daily wear.",
                    ImageUrl = "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&auto=format&fit=crop&q=60",
                    Price = 688.00m,
                    OriginalPrice = 899.00m,
                    Rating = 4.1,
                    ReviewCount = 2150,
                    Category = "Lifestyle",
                    ProductUrl = "https://amzn.to/4f6C36U"
                },
                new AmazonProduct
                {
                    Asin = "B07QP9PTZP",
                    Title = "Amazon Pay LPG Cylinder Booking & Bill Payment",
                    Description = "Quick and secure LPG gas cylinder booking for HP, Indane, and Bharat Gas. Enjoy instant cashbacks and payment verification.",
                    ImageUrl = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&auto=format&fit=crop&q=60",
                    Price = 850.00m,
                    OriginalPrice = 850.00m,
                    Rating = 4.6,
                    ReviewCount = 10450,
                    Category = "Services",
                    ProductUrl = "https://amzn.to/4xWBX9y"
                },
                new AmazonProduct
                {
                    Asin = "B07FFQG8GT",
                    Title = "Milan Jewellers 99.5% OM Silver Coin",
                    Description = "Charming 99.5% pure silver OM coin, ideal for pooja, gifting, or festive occasions. Certified purity with detailed craftsmanship.",
                    ImageUrl = "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500&auto=format&fit=crop&q=60",
                    Price = 499.00m,
                    OriginalPrice = 999.00m,
                    Rating = 4.3,
                    ReviewCount = 780,
                    Category = "Lifestyle",
                    ProductUrl = "https://amzn.to/4oPQsb1"
                },
                new AmazonProduct
                {
                    Asin = "B0DSKNHX1T",
                    Title = "Samsung Galaxy S25+ 5G AI Smartphone",
                    Description = "Flagship Samsung Galaxy smartphone featuring Galaxy AI camera capabilities, stunning AMOLED display, and ultra-fast performance.",
                    ImageUrl = "/images/galaxy_phone.png",
                    Price = 79999.00m,
                    OriginalPrice = 89999.00m,
                    Rating = 4.7,
                    ReviewCount = 4120,
                    Category = "Electronics",
                    ProductUrl = "https://amzn.to/4gOPB8j"
                },
                new AmazonProduct
                {
                    Asin = "B0C8SZJ4DR",
                    Title = "Amazon Pay eGift Card - Office & Workplace Celebrations",
                    Description = "Ideal digital eGift Card for colleagues, employees, and achievements. Instant digital delivery and hassle-free redemption.",
                    ImageUrl = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60",
                    Price = 1000.00m,
                    OriginalPrice = 1000.00m,
                    Rating = 4.8,
                    ReviewCount = 15400,
                    Category = "Gift Cards",
                    ProductUrl = "https://amzn.to/4p3pGfl"
                },
                new AmazonProduct
                {
                    Asin = "B0FLD3V5BZ",
                    Title = "DALUCI Wooden Piggy Bank Money Saving Box (1 Lakh Challenge)",
                    Description = "Wooden savings box with denomination grid for cash savings challenge. Great budget organizer and unique gift for kids & adults.",
                    ImageUrl = "/images/piggy_bank.png",
                    Price = 399.00m,
                    OriginalPrice = 799.00m,
                    Rating = 4.4,
                    ReviewCount = 2890,
                    Category = "Gadgets",
                    ProductUrl = "https://amzn.to/4eEZGU1"
                },
                new AmazonProduct
                {
                    Asin = "B0CFYPQVXH",
                    Title = "Zilloquil 4-in-1 Star Galaxy Aurora Night Lamp & Speaker",
                    Description = "Starry nebula galaxy projector with built-in Bluetooth speaker, white noise, and remote control for bedroom decoration.",
                    ImageUrl = "/images/galaxy_lamp.png",
                    Price = 1499.00m,
                    OriginalPrice = 2999.00m,
                    Rating = 4.5,
                    ReviewCount = 6120,
                    Category = "Electronics",
                    ProductUrl = "https://amzn.to/4eZTFQR"
                },
                new AmazonProduct
                {
                    Asin = "B0D6ZCLZZV",
                    Title = "Crystomist CM Acrylic Crystal Beads Curtain (4 Feet Height)",
                    Description = "Transparent glass drops acrylic crystal beads curtain. Adds elegance, sparkle, and stylish divider aesthetic to living spaces.",
                    ImageUrl = "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=60",
                    Price = 899.00m,
                    OriginalPrice = 1599.00m,
                    Rating = 4.2,
                    ReviewCount = 1840,
                    Category = "Home & Decor",
                    ProductUrl = "https://amzn.to/4gLPtGI"
                },
                new AmazonProduct
                {
                    Asin = "9360232688",
                    Title = "MTG Olympiad Prep-Guide Mathematics Class - 4 Book",
                    Description = "Comprehensive preparatory guide for NIMO/IMO Class 4 Mathematics Olympiad containing theory, practice questions & sample papers.",
                    ImageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
                    Price = 299.00m,
                    OriginalPrice = 450.00m,
                    Rating = 4.6,
                    ReviewCount = 3750,
                    Category = "Education",
                    ProductUrl = "https://amzn.to/4vMKEBG"
                },
                new AmazonProduct
                {
                    Asin = "B00FLYWNYQ",
                    Title = "Instant Pot Multi-Use Programmable Pressure Cooker",
                    Description = "7-in-1 multi-functional electric pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker and warmer.",
                    ImageUrl = "/images/pressure_cooker.png",
                    Price = 5999.00m,
                    OriginalPrice = 8999.00m,
                    Rating = 4.7,
                    ReviewCount = 9480,
                    Category = "Home Appliances",
                    ProductUrl = "https://amzn.to/4az7jZE"
                },
                new AmazonProduct
                {
                    Asin = "B0DSQ7F2YR",
                    Title = "Divyakosh Toran Entrance Bandanwar Festival Decor",
                    Description = "Traditional handcrafted door hangings (Toran Bandanwar) embellished with beads, pearls and floral motifs for festive entrance decor.",
                    ImageUrl = "/images/toran_decor.png",
                    Price = 499.00m,
                    OriginalPrice = 999.00m,
                    Rating = 4.5,
                    ReviewCount = 1290,
                    Category = "Home & Decor",
                    ProductUrl = "https://amzn.to/4v9MqLS"
                }
            };

            bool changed = false;
            var validAsins = new HashSet<string>(seedData.Select(s => s.Asin), StringComparer.OrdinalIgnoreCase);
            var existingDbProducts = await _context.AmazonProducts.ToListAsync();

            // Purge any legacy database entries that are not part of the 18 official target products
            foreach (var dbProd in existingDbProducts)
            {
                if (!validAsins.Contains(dbProd.Asin))
                {
                    _context.AmazonProducts.Remove(dbProd);
                    changed = true;
                }
            }

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
