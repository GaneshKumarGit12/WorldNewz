using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StocksController : ControllerBase
    {
        private readonly MarketDataService _marketDataService;

        public StocksController(MarketDataService marketDataService)
        {
            _marketDataService = marketDataService;
        }

        // GET: api/stocks?exchange=NYSE
        [HttpGet]
        public async Task<IActionResult> GetStocks([FromQuery] string exchange = "NYSE")
        {
            if (string.IsNullOrWhiteSpace(exchange))
            {
                exchange = "NYSE";
            }

            string cleanExchange = exchange.Trim().ToUpperInvariant();
            if (cleanExchange != "NYSE" && cleanExchange != "BSE" && cleanExchange != "NSE")
            {
                return BadRequest(new { error = "Invalid exchange. Supported exchanges: NYSE, BSE, NSE" });
            }

            var stocks = await _marketDataService.GetStocksAsync(cleanExchange);
            return Ok(new
            {
                status = "ok",
                exchange = cleanExchange,
                lastUpdated = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                stocks
            });
        }
    }
}
