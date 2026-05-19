using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdsController : ControllerBase
    {
        private readonly WorldNewsDbContext _db;

        public AdsController(WorldNewsDbContext db)
        {
            _db = db;
        }

        // GET: api/ads
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Ad>>> GetAds()
        {
            return await _db.Ads.ToListAsync();
        }

        // GET: api/ads/{placement}
        [HttpGet("{placement}")]
        public async Task<ActionResult<Ad>> GetAdByPlacement(string placement)
        {
            var ad = await _db.Ads.FirstOrDefaultAsync(a => a.Placement == placement);
            if (ad == null)
            {
                // Fallback to a default Google AdSense unit if nothing exists in the database
                return new Ad
                {
                    AdType = "responsive",
                    Placement = placement,
                    Script = "<ins class=\"adsbygoogle\" style=\"display:block\" data-ad-client=\"ca-pub-7547748414764075\" data-ad-slot=\"7829102931\" data-ad-format=\"auto\" data-ad-full-width-responsive=\"true\"></ins>"
                };
            }
            return ad;
        }

        // POST: api/ads
        [HttpPost]
        public async Task<ActionResult<Ad>> CreateAd(Ad ad)
        {
            _db.Ads.Add(ad);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAdByPlacement), new { placement = ad.Placement }, ad);
        }
    }
}
