using Microsoft.AspNetCore.Mvc;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public ContactController(IEmailService emailService, IConfiguration configuration)
        {
            _emailService = emailService;
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<IActionResult> SubmitContactForm([FromBody] ContactSubmission submission)
        {
            if (submission == null)
            {
                return BadRequest(new { error = "Submission payload is empty." });
            }

            if (string.IsNullOrWhiteSpace(submission.Name) ||
                string.IsNullOrWhiteSpace(submission.Email) ||
                string.IsNullOrWhiteSpace(submission.Subject) ||
                string.IsNullOrWhiteSpace(submission.Message))
            {
                return BadRequest(new { error = "All fields (Name, Email, Subject, Message) are required." });
            }

            try
            {
                var adminEmail = _configuration["ADMIN_EMAIL"] ?? "ganeshkumard56@gmail.com";
                
                var emailSubject = $"[WorldNewzs Inquiry] {submission.Subject}";
                var emailBody = $@"
                    <h2>New Message from WorldNewzs Contact Form</h2>
                    <p><strong>Name:</strong> {submission.Name}</p>
                    <p><strong>Email:</strong> {submission.Email}</p>
                    <p><strong>Subject:</strong> {submission.Subject}</p>
                    <p><strong>Message:</strong></p>
                    <div style=""padding: 10px; background-color: #f5f5f5; border-left: 4px solid #ff8a65; font-family: sans-serif; white-space: pre-wrap;"">
                        {submission.Message}
                    </div>
                ";

                await _emailService.SendEmailAsync(adminEmail, emailSubject, emailBody);

                return Ok(new { success = true, message = "Inquiry sent successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while sending the email.", details = ex.Message });
            }
        }
    }

    public class ContactSubmission
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
