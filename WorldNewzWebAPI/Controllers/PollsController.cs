using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PollsController : ControllerBase
    {
        private readonly WorldNewsDbContext _context;
        private readonly UserPollsDbContext _userDb;

        public PollsController(WorldNewsDbContext context, UserPollsDbContext userDb)
        {
            _context = context;
            _userDb = userDb;
        }

        // GET: api/polls
        [HttpGet]
        public async Task<IActionResult> GetActivePolls()
        {
            var allPolls = await _context.Polls
                .Include(p => p.Options)
                .ToListAsync();

            // Randomly shuffle using Guid.NewGuid() and take 5
            var randomized = allPolls
                .OrderBy(p => Guid.NewGuid())
                .Take(5)
                .ToList();

            return Ok(randomized);
        }

        // POST: api/polls/{id}/vote
        [HttpPost("{id}/vote")]
        public async Task<IActionResult> SubmitVote(int id, [FromBody] VoteRequest request)
        {
            if (request == null || request.OptionId <= 0)
            {
                return BadRequest(new { error = "Invalid option selected." });
            }

            var poll = await _context.Polls
                .Include(p => p.Options)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (poll == null)
            {
                return NotFound(new { error = "Poll not found." });
            }

            var option = poll.Options.FirstOrDefault(o => o.Id == request.OptionId);
            if (option == null)
            {
                return BadRequest(new { error = "Option does not belong to this poll." });
            }

            // Increment votes securely via transaction/SaveChanges
            option.Votes += 1;
            await _context.SaveChangesAsync();

            // Calculate updated results
            int totalVotes = poll.Options.Sum(o => o.Votes);
            var results = poll.Options.Select(o => new
            {
                o.Id,
                o.OptionText,
                o.Votes,
                Percentage = totalVotes > 0 ? Math.Round((double)o.Votes / totalVotes * 100, 1) : 0.0
            }).ToList();

            return Ok(new
            {
                status = "success",
                message = "Vote registered successfully.",
                totalVotes,
                results
            });
        }

        private static readonly string[] BannedWords = new[] { 
            "pornography", "pronography", "sexual", "sexsual", 
            "porn", "sex", "xxx", "nsfw", "adult", "naked", 
            "erotic", "prostitute", "bitch", "bastard" 
        };

        private bool ContainsBannedWords(string input)
        {
            if (string.IsNullOrEmpty(input)) return false;
            var lower = input.ToLower();
            return BannedWords.Any(word => lower.Contains(word));
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        // GET: api/polls/check-attempt
        [HttpGet("check-attempt")]
        public async Task<IActionResult> CheckAttempt([FromQuery] string name, [FromQuery] string email, [FromQuery] int timezoneOffset = 0)
        {
            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email))
            {
                return BadRequest(new { error = "Name and Email are required parameters." });
            }

            var trimmedName = name.Trim().ToLower();
            var trimmedEmail = email.Trim().ToLower();

            // Calculate user's current local date (based on their timezone offset in minutes)
            var todayLocal = DateTime.UtcNow.AddMinutes(-timezoneOffset).Date;

            // Fetch submissions for this name and email to compare dates in memory safely
            var userSubmissions = await _userDb.PollSubmissions
                .Where(s => s.Name.ToLower() == trimmedName && s.Email.ToLower() == trimmedEmail)
                .ToListAsync();

            var todaySubmission = userSubmissions
                .FirstOrDefault(s => s.SubmittedAt.AddMinutes(-timezoneOffset).Date == todayLocal);

            if (todaySubmission != null)
            {
                return Ok(new
                {
                    exists = true,
                    percentage = todaySubmission.Percentage,
                    scoreStatus = todaySubmission.Status
                });
            }

            return Ok(new { exists = false });
        }

        // POST: api/polls/submit-answers
        [HttpPost("submit-answers")]
        public async Task<IActionResult> SubmitAnswers([FromBody] PollAnswersSubmissionRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { error = "Invalid submission payload." });
            }

            var name = (request.Name ?? "").Trim();
            var email = (request.Email ?? "").Trim();

            // 1. Basic validation
            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email))
            {
                return BadRequest(new { error = "Name and Email are required fields." });
            }

            // 2. Inappropriate words filtering
            if (ContainsBannedWords(name) || ContainsBannedWords(email))
            {
                return BadRequest(new { error = "Unwanted or inappropriate content detected in Name or Email address." });
            }

            // 3. Email format validation
            if (!IsValidEmail(email))
            {
                return BadRequest(new { error = "Please provide a valid Email address format." });
            }

            // 4. Check for duplicate Name + Email combination for today (Date-wise check in user's timezone)
            var todayLocal = DateTime.UtcNow.AddMinutes(-request.TimezoneOffset).Date;
            var userSubmissions = await _userDb.PollSubmissions
                .Where(s => s.Name.ToLower() == name.ToLower() && s.Email.ToLower() == email.ToLower())
                .ToListAsync();

            if (userSubmissions.Any(s => s.SubmittedAt.AddMinutes(-request.TimezoneOffset).Date == todayLocal))
            {
                return BadRequest(new { error = "Current user already applied. No chance to applicable same user again." });
            }

            if (request.Answers == null || request.Answers.Count == 0)
            {
                return BadRequest(new { error = "Please submit answers for at least one question." });
            }

            // 5. Evaluate answers
            int correctCount = 0;
            int totalEvaluated = 0;

            foreach (var ans in request.Answers)
            {
                var option = await _context.PollOptions
                    .FirstOrDefaultAsync(o => o.PollId == ans.PollId && o.Id == ans.OptionId);

                if (option != null)
                {
                    totalEvaluated++;
                    if (option.IsCorrect)
                    {
                        correctCount++;
                    }

                    // Increment the option vote count
                    option.Votes += 1;
                }
            }

            int totalQuestions = request.Answers.Count;
            if (totalQuestions == 0)
            {
                return BadRequest(new { error = "Please submit answers for at least one question." });
            }

            double percentage = Math.Round(((double)correctCount / totalQuestions) * 100, 1);

            // Determine status based on percentage
            string status = "Red";
            if (percentage >= 60.0) status = "Green";
            else if (percentage >= 30.0) status = "Orange";

            // Save submission
            var submission = new PollSubmission
            {
                Name = name,
                Email = email,
                Percentage = percentage,
                Status = status,
                SubmittedAt = DateTime.UtcNow
            };

            _userDb.PollSubmissions.Add(submission);
            await _userDb.SaveChangesAsync();
            await _context.SaveChangesAsync();

            return Ok(new
            {
                status = "success",
                percentage = percentage,
                scoreStatus = status
            });
        }

        // GET: api/polls/leaderboard
        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard()
        {
            try
            {
                // Retrieve leaderboard: all submissions ranked by score percentage then submitted date
                var leaderboard = await _userDb.PollSubmissions
                    .OrderByDescending(s => s.Percentage)
                    .ThenByDescending(s => s.SubmittedAt)
                    .ToListAsync();

                var history = leaderboard.Select(s => new
                {
                    id = s.Id,
                    name = s.Name,
                    email = s.Email,
                    percentage = s.Percentage,
                    status = s.Status,
                    submittedAt = DateTime.SpecifyKind(s.SubmittedAt, DateTimeKind.Utc).ToString("o")
                }).ToList();

                return Ok(history);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving leaderboard: {ex.Message}");
                return StatusCode(500, new { error = "Failed to retrieve leaderboard." });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetPollsHistory()
        {
            var submissions = await _userDb.PollSubmissions
                .OrderByDescending(s => s.SubmittedAt)
                .ToListAsync();

            var history = submissions.Select(s => new
            {
                id = s.Id,
                name = s.Name,
                email = s.Email,
                percentage = s.Percentage,
                status = s.Status,
                submittedAt = DateTime.SpecifyKind(s.SubmittedAt, DateTimeKind.Utc).ToString("o")
            }).ToList();

            return Ok(history);
        }
    }

    public class VoteRequest
    {
        public int OptionId { get; set; }
    }

    public class PollAnswersSubmissionRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int TimezoneOffset { get; set; } = 0;
        public System.Collections.Generic.List<PollAnswerRequest> Answers { get; set; } = new();
    }

    public class PollAnswerRequest
    {
        public int PollId { get; set; }
        public int OptionId { get; set; }
    }
}
