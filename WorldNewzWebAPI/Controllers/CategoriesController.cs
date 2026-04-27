using Microsoft.AspNetCore.Mvc;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;


namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly WorldNewsDbContext _context;

        public CategoriesController(WorldNewsDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetCategories()
        {
            return Ok(_context.Categories.ToList());
        }
    }
}