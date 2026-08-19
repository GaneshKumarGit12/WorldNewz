using System;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WorldNewzWebAPI.Models;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AmazonProductsController : ControllerBase
    {
        private readonly AmazonProductService _productService;

        public AmazonProductsController(AmazonProductService productService)
        {
            _productService = productService;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts()
        {
            try
            {
                var products = await _productService.GetAffiliateProductsAsync();
                
                // Disable caching to ensure newly added and seeded products are immediately visible to users
                Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
                
                return Ok(new
                {
                    status = "success",
                    totalResults = products.Count,
                    products = products
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to retrieve products: {ex.Message}" });
            }
        }

        [HttpGet("health")]
        public IActionResult GetHealth([FromServices] AmazonCreatorApiService? creatorApiService = null)
        {
            var isConfigured = creatorApiService?.IsConfigured ?? false;
            return Ok(new
            {
                status = "operational",
                creatorApiConfigured = isConfigured,
                mode = isConfigured ? "Live Amazon Creator API" : "PostgreSQL Seed Catalog (Resilient Fallback)",
                associateTag = Environment.GetEnvironmentVariable("AMAZON_ASSOCIATE_TAG") ?? "ganeshd12-21",
                timestamp = DateTime.UtcNow
            });
        }

        [HttpPost("admin")]
        public async Task<IActionResult> AddOrUpdateProduct([FromBody] AmazonProduct productDto)
        {
            if (!IsAuthorized())
            {
                return Unauthorized(new { error = "Invalid credentials or unauthorized request." });
            }

            if (productDto == null)
            {
                return BadRequest(new { error = "Invalid product data." });
            }

            try
            {
                var saved = await _productService.SaveProductAsync(productDto);
                return Ok(new { status = "success", product = saved });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("admin/refresh")]
        public async Task<IActionResult> ForceRefreshDeals()
        {
            if (!IsAuthorized())
            {
                return Unauthorized(new { error = "Invalid credentials or unauthorized request." });
            }

            try
            {
                await _productService.RefreshDailyDealsAsync();
                return Ok(new { status = "success", message = "Daily deals refreshed and price/review variations applied successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to refresh deals: {ex.Message}" });
            }
        }

        [HttpGet("parse-url")]
        public async Task<IActionResult> ParseUrl([FromQuery] string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return BadRequest(new { error = "Url parameter is required." });
            }

            try
            {
                var resolvedProduct = await _productService.ParseProductUrlAsync(url);
                return Ok(new { status = "success", product = resolvedProduct });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Simple Basic Auth helper reading credentials securely from environment
        /// </summary>
        private bool IsAuthorized()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            try
            {
                var base64Credentials = authHeader.Substring(6).Trim();
                var credentials = Encoding.UTF8.GetString(Convert.FromBase64String(base64Credentials)).Split(':');
                if (credentials.Length != 2) return false;

                var providedUser = credentials[0];
                var providedPass = credentials[1];

                var adminUser = Environment.GetEnvironmentVariable("ADMIN_USERNAME") ?? "ganeshd12";
                var adminPass = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "EndPointPG@293";

                return providedUser == adminUser && providedPass == adminPass;
            }
            catch
            {
                return false;
            }
        }
    }
}
