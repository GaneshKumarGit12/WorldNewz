using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

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
        private static readonly HttpClient _httpClient = new HttpClient();

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var senderEmail = _configuration["SMTP_USER"] ?? "ganeshkumard56@gmail.com";

            // 1. Try Brevo HTTP API (Bypasses SMTP port blocking completely)
            var brevoApiKey = _configuration["BREVO_API_KEY"] ?? _configuration["SENDINBLUE_API_KEY"];
            if (!string.IsNullOrEmpty(brevoApiKey))
            {
                _logger.LogInformation("Attempting to send email via Brevo HTTP API (Port 443)...");
                var payload = new
                {
                    sender = new { name = "WorldNewzs System", email = senderEmail },
                    to = new[] { new { email = toEmail } },
                    subject = subject,
                    htmlContent = body
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
                request.Headers.Add("api-key", brevoApiKey);
                request.Headers.Add("accept", "application/json");
                request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Email sent successfully to {toEmail} via Brevo HTTP API.");
                    return;
                }

                var errContent = await response.Content.ReadAsStringAsync();
                throw new Exception($"Brevo API Error (Status {response.StatusCode}): {errContent}");
            }

            // 2. Try SendGrid HTTP API (Bypasses SMTP port blocking completely)
            var sendGridApiKey = _configuration["SENDGRID_API_KEY"];
            if (!string.IsNullOrEmpty(sendGridApiKey))
            {
                _logger.LogInformation("Attempting to send email via SendGrid HTTP API (Port 443)...");
                var payload = new
                {
                    personalizations = new[] { new { to = new[] { new { email = toEmail } } } },
                    from = new { name = "WorldNewzs System", email = senderEmail },
                    subject = subject,
                    content = new[] { new { type = "text/html", value = body } }
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.sendgrid.com/v3/mail/send");
                request.Headers.Add("Authorization", $"Bearer {sendGridApiKey}");
                request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Email sent successfully to {toEmail} via SendGrid HTTP API.");
                    return;
                }

                var errContent = await response.Content.ReadAsStringAsync();
                throw new Exception($"SendGrid API Error (Status {response.StatusCode}): {errContent}");
            }

            // 3. Fallback to MailKit SMTP (Requires SMTP ports 465/587 to be unblocked on host server)
            try
            {
                var smtpServer = _configuration["SMTP_SERVER"] ?? "smtp.gmail.com";
                var smtpPortStr = _configuration["SMTP_PORT"] ?? "465";
                var smtpPass = _configuration["SMTP_PASS"]; // Gmail App Password

                if (string.IsNullOrEmpty(smtpPass))
                {
                    _logger.LogWarning("SMTP_PASS is not configured. Email will not be sent.");
                    // Fallback to console logging if credentials are not configured yet
                    Console.WriteLine($"[SMTP SIMULATION] To: {toEmail}\nSubject: {subject}\nBody:\n{body}");
                    return;
                }

                int smtpPort = int.TryParse(smtpPortStr, out var port) ? port : 465;
                _logger.LogInformation($"Attempting SMTP delivery to {smtpServer}:{smtpPort}...");

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("WorldNewzs System", senderEmail));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = body
                };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                // Set a 10 second timeout so we don't hang indefinitely if the port is blocked
                client.Timeout = 10000;

                // Select connection security based on the port
                SecureSocketOptions socketOptions = SecureSocketOptions.Auto;
                if (smtpPort == 465)
                {
                    socketOptions = SecureSocketOptions.SslOnConnect; // Implicit SSL/TLS
                }
                else if (smtpPort == 587)
                {
                    socketOptions = SecureSocketOptions.StartTls; // STARTTLS
                }

                // Connect to server
                await client.ConnectAsync(smtpServer, smtpPort, socketOptions);

                // Authenticate
                await client.AuthenticateAsync(senderEmail, smtpPass);

                // Send email
                await client.SendAsync(message);

                // Disconnect cleanly
                await client.DisconnectAsync(true);

                _logger.LogInformation($"Email sent successfully to {toEmail} via SMTP.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send email to {toEmail} via SMTP.");
                throw;
            }
        }
    }
}
