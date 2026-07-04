using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;
using WorldNewzWebAPI.Services;
using Microsoft.Extensions.Configuration;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly UserPollsDbContext _userDb;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public AdminController(UserPollsDbContext userDb, IEmailService emailService, IConfiguration configuration)
        {
            _userDb = userDb;
            _emailService = emailService;
            _configuration = configuration;
        }

        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        private (string username, string password) GetAdminCredentials()
        {
            var adminUser = _configuration["ADMIN_USERNAME"];
            if (string.IsNullOrWhiteSpace(adminUser))
            {
                adminUser = Environment.GetEnvironmentVariable("ADMIN_USERNAME");
            }
            if (string.IsNullOrWhiteSpace(adminUser))
            {
                adminUser = "ganeshd12";
            }

            var adminPass = _configuration["ADMIN_PASSWORD"];
            if (string.IsNullOrWhiteSpace(adminPass))
            {
                adminPass = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
            }
            if (string.IsNullOrWhiteSpace(adminPass))
            {
                adminPass = "EndPointPG@293";
            }

            return (adminUser, adminPass);
        }

        private string GetExpectedToken()
        {
            var (adminUser, adminPass) = GetAdminCredentials();
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{adminUser}:{adminPass}"));
        }

        private bool IsAuthorized()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
            var token = authHeader.Substring("Bearer ".Length).Trim();
            return token == GetExpectedToken();
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { error = "Invalid request payload." });
            }

            var (adminUser, adminPass) = GetAdminCredentials();

            if (request.Username == adminUser && request.Password == adminPass)
            {
                var token = GetExpectedToken();
                return Ok(new { success = true, token });
            }

            return Unauthorized(new { error = "Invalid admin username or password." });
        }

        [HttpGet("storage")]
        public async Task<IActionResult> GetStorageDetails()
        {
            long dbSizeInBytes = 0;
            string providerName = _userDb.Database.ProviderName ?? "Unknown";
            bool isPostgres = providerName.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase);
            bool isSqlite = providerName.Contains("Sqlite", StringComparison.OrdinalIgnoreCase);

            try
            {
                using var command = _userDb.Database.GetDbConnection().CreateCommand();
                bool opened = false;
                if (_userDb.Database.GetDbConnection().State != System.Data.ConnectionState.Open)
                {
                    await _userDb.Database.OpenConnectionAsync();
                    opened = true;
                }

                try
                {
                    if (isPostgres)
                    {
                        command.CommandText = "SELECT pg_database_size(current_database());";
                        var result = await command.ExecuteScalarAsync();
                        if (result != null)
                        {
                            dbSizeInBytes = Convert.ToInt64(result);
                        }
                    }
                    else if (isSqlite)
                    {
                        command.CommandText = "PRAGMA page_count;";
                        var pageCountObj = await command.ExecuteScalarAsync();
                        command.CommandText = "PRAGMA page_size;";
                        var pageSizeObj = await command.ExecuteScalarAsync();
                        if (pageCountObj != null && pageSizeObj != null)
                        {
                            long pageCount = Convert.ToInt64(pageCountObj);
                            long pageSize = Convert.ToInt64(pageSizeObj);
                            dbSizeInBytes = pageCount * pageSize;
                        }
                    }
                }
                finally
                {
                    if (opened)
                    {
                        await _userDb.Database.CloseConnectionAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error querying DB storage size: {ex.Message}");
                // Fallback: estimate database size based on records if query fails
                long recordsCount = await _userDb.QuizSubmissions.CountAsync() + await _userDb.PollSubmissions.CountAsync();
                dbSizeInBytes = 5000000 + (recordsCount * 500); // 5MB baseline + 500 bytes per record
            }

            // Default to 1 GB limit
            long maxSizeBytes = 1073741824; // 1 GB
            double percentageUsed = ((double)dbSizeInBytes / maxSizeBytes) * 100.0;
            
            // Format sizes nicely
            string formattedSize;
            if (dbSizeInBytes >= 1024 * 1024 * 1024)
            {
                formattedSize = $"{(double)dbSizeInBytes / (1024 * 1024 * 1024):F2} GB";
            }
            else if (dbSizeInBytes >= 1024 * 1024)
            {
                formattedSize = $"{(double)dbSizeInBytes / (1024 * 1024):F2} MB";
            }
            else
            {
                formattedSize = $"{(double)dbSizeInBytes / 1024:F2} KB";
            }

            return Ok(new
            {
                dbProvider = providerName,
                databaseSizeInBytes = dbSizeInBytes,
                percentageUsed = Math.Round(percentageUsed, 4),
                formattedSize,
                maxSizeBytes,
                formattedMaxSize = "1 GB"
            });
        }

        [HttpDelete("quiz-history/{id}")]
        public async Task<IActionResult> DeleteQuizHistory(int id)
        {
            if (!IsAuthorized())
            {
                return Unauthorized(new { error = "Unauthorized admin access." });
            }

            try
            {
                var submission = await _userDb.QuizSubmissions.FindAsync(id);
                if (submission == null)
                {
                    return NotFound(new { error = "Quiz submission not found." });
                }

                _userDb.QuizSubmissions.Remove(submission);
                await _userDb.SaveChangesAsync();

                return Ok(new { success = true, message = "Quiz submission deleted successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error deleting quiz history item {id}: {ex.Message}");
                return StatusCode(500, new { error = "Failed to delete item." });
            }
        }

        [HttpDelete("poll-history/{id}")]
        public async Task<IActionResult> DeletePollHistory(int id)
        {
            if (!IsAuthorized())
            {
                return Unauthorized(new { error = "Unauthorized admin access." });
            }

            try
            {
                var submission = await _userDb.PollSubmissions.FindAsync(id);
                if (submission == null)
                {
                    return NotFound(new { error = "Poll submission not found." });
                }

                _userDb.PollSubmissions.Remove(submission);
                await _userDb.SaveChangesAsync();

                return Ok(new { success = true, message = "Poll submission deleted successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error deleting poll history item {id}: {ex.Message}");
                return StatusCode(500, new { error = "Failed to delete item." });
            }
        }

        [HttpGet("subscribers")]
        public async Task<IActionResult> GetSubscribers()
        {
            if (!IsAuthorized())
            {
                return Unauthorized(new { error = "Unauthorized admin access." });
            }

            try
            {
                var subscribers = await _userDb.NewsletterSubscribers
                    .OrderByDescending(s => s.SubscribedAt)
                    .ToListAsync();
                return Ok(subscribers);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error fetching subscribers: {ex.Message}");
                return StatusCode(500, new { error = "Failed to load subscribers." });
            }
        }

        [HttpDelete("subscribers/{id}")]
        public async Task<IActionResult> DeleteSubscriber(int id)
        {
            if (!IsAuthorized())
            {
                return Unauthorized(new { error = "Unauthorized admin access." });
            }

            try
            {
                var subscriber = await _userDb.NewsletterSubscribers.FindAsync(id);
                if (subscriber == null)
                {
                    return NotFound(new { error = "Subscriber not found." });
                }

                _userDb.NewsletterSubscribers.Remove(subscriber);
                await _userDb.SaveChangesAsync();

                return Ok(new { success = true, message = "Subscriber removed successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error deleting subscriber {id}: {ex.Message}");
                return StatusCode(500, new { error = "Failed to delete subscriber." });
            }
        }

        [HttpPost("subscribers/{id}/verify")]
        public async Task<IActionResult> VerifySubscriber(int id)
        {
            if (!IsAuthorized())
            {
                return Unauthorized(new { error = "Unauthorized admin access." });
            }

            try
            {
                var subscriber = await _userDb.NewsletterSubscribers.FindAsync(id);
                if (subscriber == null)
                {
                    return NotFound(new { error = "Subscriber not found." });
                }

                subscriber.IsVerified = true;
                subscriber.VerificationToken = null;
                await _userDb.SaveChangesAsync();

                return Ok(new { success = true, message = "Subscriber verified successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error verifying subscriber {id}: {ex.Message}");
                return StatusCode(500, new { error = "Failed to verify subscriber." });
            }
        }

        [HttpPost("test-email")]
        public async Task<IActionResult> TestEmail([FromBody] TestEmailRequest request)
        {
            if (!IsAuthorized())
            {
                return Unauthorized(new { error = "Unauthorized admin access." });
            }

            if (request == null || string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { error = "Email address is required." });
            }

            var smtpPass = _configuration["SMTP_PASS"];
            if (string.IsNullOrEmpty(smtpPass))
            {
                return BadRequest(new { error = "SMTP_PASS is not configured in the server environment variables. Please add it to your Render environment settings." });
            }

            try
            {
                var subject = "WorldNewzs SMTP Test Email";
                var body = $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;"">
    <h2 style=""color: #c83a15; margin-top: 0;"">WORLDNEWZS</h2>
    <p>This is a test email sent from the WorldNewzs Admin Dashboard to verify your SMTP configuration.</p>
    <p><strong>Status:</strong> SMTP connection and authentication succeeded!</p>
    <p>Time sent (UTC): {DateTime.UtcNow:f}</p>
</div>";

                await _emailService.SendEmailAsync(request.Email.Trim(), subject, body);
                return Ok(new { success = true, message = $"Test email sent successfully to {request.Email}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"SMTP Error: {ex.Message} (Inner: {ex.InnerException?.Message})" });
            }
        }
    }

    public class TestEmailRequest
    {
        public string Email { get; set; } = string.Empty;
    }
}
