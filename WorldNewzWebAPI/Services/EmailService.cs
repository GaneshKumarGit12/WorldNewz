using System.Net;
using System.Net.Mail;

namespace WorldNewzWebAPI.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                var smtpServer = _configuration["SMTP_SERVER"] ?? "smtp.gmail.com";
                var smtpPortStr = _configuration["SMTP_PORT"] ?? "587";
                var smtpUser = _configuration["SMTP_USER"] ?? "ganeshkumard56@gmail.com";
                var smtpPass = _configuration["SMTP_PASS"]; // Gmail App Password

                if (string.IsNullOrEmpty(smtpPass))
                {
                    _logger.LogWarning("SMTP_PASS is not configured. Email will not be sent.");
                    // Fallback to console logging if credentials are not configured yet
                    Console.WriteLine($"[SMTP SIMULATION] To: {toEmail}\nSubject: {subject}\nBody:\n{body}");
                    return;
                }

                int smtpPort = int.TryParse(smtpPortStr, out var port) ? port : 587;

                using var client = new SmtpClient(smtpServer, smtpPort)
                {
                    Credentials = new NetworkCredential(smtpUser, smtpPass),
                    EnableSsl = true
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(smtpUser, "WorldNewzs System"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                // Add Reply-To if the body contains sender email or we can pass it separately.
                // We'll set the Reply-To address to the sender's email if possible, so replying to the notification goes to the sender.

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email sent successfully to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send email to {toEmail}");
                throw;
            }
        }
    }
}
