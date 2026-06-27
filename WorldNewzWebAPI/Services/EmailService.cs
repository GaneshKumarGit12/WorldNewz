using System;
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
                var smtpPortStr = _configuration["SMTP_PORT"] ?? "465"; // Default to 465 (unblocked SSL on cloud providers)
                var smtpUser = _configuration["SMTP_USER"] ?? "ganeshkumard56@gmail.com";
                var smtpPass = _configuration["SMTP_PASS"]; // Gmail App Password

                if (string.IsNullOrEmpty(smtpPass))
                {
                    _logger.LogWarning("SMTP_PASS is not configured. Email will not be sent.");
                    // Fallback to console logging if credentials are not configured yet
                    Console.WriteLine($"[SMTP SIMULATION] To: {toEmail}\nSubject: {subject}\nBody:\n{body}");
                    return;
                }

                int smtpPort = int.TryParse(smtpPortStr, out var port) ? port : 465;

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("WorldNewzs System", smtpUser));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = body
                };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();

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
                await client.AuthenticateAsync(smtpUser, smtpPass);

                // Send email
                await client.SendAsync(message);

                // Disconnect cleanly
                await client.DisconnectAsync(true);

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
