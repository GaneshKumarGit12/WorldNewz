using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;
using WorldNewzWebAPI.Services;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/newsletter")]
    public class NewsletterController : ControllerBase
    {
        private readonly UserPollsDbContext _userDb;
        private readonly IEmailService _emailService;

        public NewsletterController(UserPollsDbContext userDb, IEmailService emailService)
        {
            _userDb = userDb;
            _emailService = emailService;
        }

        [HttpPost("subscribe")]
        public async Task<IActionResult> SubscribeNewsletter([FromBody] SubscriptionRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { error = "Email address is required." });
            }

            try
            {
                var emailNormalized = request.Email.Trim().ToLowerInvariant();
                var existing = await _userDb.NewsletterSubscribers
                    .FirstOrDefaultAsync(s => s.Email.ToLower() == emailNormalized);

                var isGoogle = !string.IsNullOrEmpty(request.SubscriptionType) && request.SubscriptionType.Equals("Google", StringComparison.OrdinalIgnoreCase);
                var token = Guid.NewGuid().ToString();

                if (existing != null)
                {
                    if (existing.IsVerified && !isGoogle)
                    {
                        return Ok(new { success = true, verified = true, message = "You are already subscribed to the newsletter.", alreadySubscribed = true });
                    }

                    existing.Name = string.IsNullOrWhiteSpace(request.Name) ? existing.Name : request.Name.Trim();
                    existing.SubscriptionType = string.IsNullOrWhiteSpace(request.SubscriptionType) ? existing.SubscriptionType : request.SubscriptionType.Trim();
                    existing.SubscribedAt = DateTime.UtcNow;
                    
                    if (isGoogle)
                    {
                        existing.IsVerified = true;
                        existing.VerificationToken = null;
                    }
                    else
                    {
                        existing.VerificationToken = token;
                    }

                    await _userDb.SaveChangesAsync();
                }
                else
                {
                    var newSubscriber = new NewsletterSubscriber
                    {
                        Email = request.Email.Trim(),
                        Name = request.Name?.Trim() ?? string.Empty,
                        SubscriptionType = string.IsNullOrWhiteSpace(request.SubscriptionType) ? "Direct" : request.SubscriptionType.Trim(),
                        SubscribedAt = DateTime.UtcNow,
                        IsVerified = isGoogle,
                        VerificationToken = isGoogle ? null : token
                    };

                    _userDb.NewsletterSubscribers.Add(newSubscriber);
                    await _userDb.SaveChangesAsync();
                }

                // Send email notifications
                var isLocal = Request.Host.Host.Contains("localhost");
                var frontendUrl = isLocal ? "http://localhost:5173" : "https://worldnewzs.in";

                if (isGoogle)
                {
                    var emailSubject = "Welcome to WorldNewzs Newsletter!";
                    var nameToUse = string.IsNullOrWhiteSpace(request.Name) ? "Subscriber" : request.Name.Trim();
                    var emailBody = $@"
<div style=""font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c;"">
    <div style=""text-align: center; margin-bottom: 25px;"">
        <h1 style=""color: #c83a15; margin: 0; font-size: 28px; font-weight: 900; font-family: 'Outfit', sans-serif;"">WORLDNEWZS</h1>
        <p style=""color: #718096; margin: 5px 0 0 0; font-size: 14px;"">Your World, Your News</p>
    </div>
    <hr style=""border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;""/>
    <h2 style=""color: #2d3748; margin-top: 0; font-size: 20px; font-weight: 800;"">Subscription Activated!</h2>
    <p style=""font-size: 16px; line-height: 1.6; color: #4a5568;"">
        Hello {nameToUse},
    </p>
    <p style=""font-size: 16px; line-height: 1.6; color: #4a5568;"">
        Welcome to WorldNewzs! Your newsletter subscription has been successfully activated using your Google Account.
    </p>
    <p style=""font-size: 16px; line-height: 1.6; color: #4a5568;"">
        WorldNewzs delivers premium, high-value, fact-checked global news, user opinion polls, and interactive General Knowledge quizzes direct to your inbox daily. You can now participate in our quizzes and polls daily to earn gold coins and climb the leaderboard.
    </p>
    <div style=""text-align: center; margin: 30px 0;"">
        <a href=""{frontendUrl}"" style=""background: linear-gradient(135deg, #c83a15 0%, #ff7043 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(200,58,21,0.25); font-size: 16px;"">Explore WorldNewzs</a>
    </div>
    <hr style=""border: 0; border-top: 1px solid #edf2f7; margin: 30px 0 20px 0;""/>
    <p style=""font-size: 12px; color: #a0aec0; text-align: center; margin: 0;"">
        &copy; 2026 WorldNewzs. All rights reserved.
    </p>
</div>";

                    // Send email in a background task so it doesn't block the API response
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await _emailService.SendEmailAsync(request.Email.Trim(), emailSubject, emailBody);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"⚠️ Background Google welcome email failed: {ex.Message}");
                        }
                    });

                    return Ok(new { success = true, verified = true, message = "Thank you! You have successfully subscribed to the newsletter." });
                }
                else
                {
                    var activationUrl = $"{Request.Scheme}://{Request.Host}/api/newsletter/verify?token={token}";
                    var emailSubject = "Activate your WorldNewzs Newsletter Subscription";
                    var emailBody = $@"
<div style=""font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c;"">
    <div style=""text-align: center; margin-bottom: 25px;"">
        <h1 style=""color: #c83a15; margin: 0; font-size: 28px; font-weight: 900; font-family: 'Outfit', sans-serif;"">WORLDNEWZS</h1>
        <p style=""color: #718096; margin: 5px 0 0 0; font-size: 14px;"">Your World, Your News</p>
    </div>
    <hr style=""border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;""/>
    <h2 style=""color: #2d3748; margin-top: 0; font-size: 20px; font-weight: 800;"">Activate Your Newsletter Subscription</h2>
    <p style=""font-size: 16px; line-height: 1.6; color: #4a5568;"">
        Thank you for signing up! WorldNewzs delivers premium, high-value, fact-checked global news, user opinion polls, and interactive General Knowledge quizzes direct to your inbox daily.
    </p>
    <p style=""font-size: 16px; line-height: 1.6; color: #4a5568;"">
        To start receiving updates, please click the button below to verify your email and activate your subscription:
    </p>
    <div style=""text-align: center; margin: 30px 0;"">
        <a href=""{activationUrl}"" style=""background: linear-gradient(135deg, #c83a15 0%, #ff7043 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(200,58,21,0.25); font-size: 16px;"">Activate Subscription</a>
    </div>
    <p style=""font-size: 12px; line-height: 1.5; color: #718096;"">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href=""{activationUrl}"" style=""color: #c83a15; text-decoration: underline;"">{activationUrl}</a>
    </p>
    <hr style=""border: 0; border-top: 1px solid #edf2f7; margin: 30px 0 20px 0;""/>
    <p style=""font-size: 12px; color: #a0aec0; text-align: center; margin: 0;"">
        &copy; 2026 WorldNewzs. All rights reserved. <br/>
        If you did not request this subscription, you can safely ignore this email.
    </p>
</div>";

                    // Send email in a background task so it doesn't block the API response
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await _emailService.SendEmailAsync(request.Email.Trim(), emailSubject, emailBody);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"⚠️ Background verification email failed: {ex.Message}");
                        }
                    });

                    return Ok(new { success = true, verified = false, message = "Verification link sent! Check your inbox to activate." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error in newsletter subscription: {ex.Message}");
                return StatusCode(500, new { error = "An error occurred while saving your subscription." });
            }
        }

        [HttpGet("verify")]
        public async Task<IActionResult> VerifySubscription([FromQuery] string token)
        {
            var isLocal = Request.Host.Host.Contains("localhost");
            var frontendUrl = isLocal ? "http://localhost:5173" : "https://worldnewzs.in";

            if (string.IsNullOrWhiteSpace(token))
            {
                return Redirect($"{frontendUrl}?subscription_verified=false&error=missing_token");
            }

            try
            {
                var subscriber = await _userDb.NewsletterSubscribers
                    .FirstOrDefaultAsync(s => s.VerificationToken == token);

                if (subscriber == null)
                {
                    return Redirect($"{frontendUrl}?subscription_verified=false&error=invalid_token");
                }

                subscriber.IsVerified = true;
                subscriber.VerificationToken = null;
                await _userDb.SaveChangesAsync();

                return Redirect($"{frontendUrl}?subscription_verified=true");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error verifying subscription: {ex.Message}");
                return Redirect($"{frontendUrl}?subscription_verified=false&error=server_error");
            }
        }
    }

    public class SubscriptionRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string SubscriptionType { get; set; } = string.Empty; // "Google" or "Direct"
    }
}
