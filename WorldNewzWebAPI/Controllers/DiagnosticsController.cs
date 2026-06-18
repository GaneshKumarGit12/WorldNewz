using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using WorldNewzWebAPI.Data;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagnosticsController : ControllerBase
    {
        private readonly WorldNewsDbContext _db;
        private readonly UserPollsDbContext _userDb;

        public DiagnosticsController(WorldNewsDbContext db, UserPollsDbContext userDb)
        {
            _db = db;
            _userDb = userDb;
        }

        [HttpGet("db")]
        public async Task<IActionResult> GetDbDiagnostics()
        {
            string dbProvider = _db.Database.ProviderName ?? "Unknown";
            string userDbProvider = _userDb.Database.ProviderName ?? "Unknown";

            bool dbConnected = false;
            string dbError = "None";
            try
            {
                dbConnected = await _db.Database.CanConnectAsync();
            }
            catch (Exception ex)
            {
                dbError = ex.Message;
            }

            bool userDbConnected = false;
            string userDbError = "None";
            try
            {
                userDbConnected = await _userDb.Database.CanConnectAsync();
            }
            catch (Exception ex)
            {
                userDbError = ex.Message;
            }

            return Ok(new
            {
                dbProvider,
                dbConnected,
                dbError,
                userDbProvider,
                userDbConnected,
                userDbError,
                timestamp = DateTime.UtcNow
            });
        }
    }
}
