using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Linq;
using System.Threading.Tasks;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;
using WorldNewzWebAPI.Hubs;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PollsController : ControllerBase
    {
        private readonly WorldNewsDbContext _context;
        private readonly UserPollsDbContext _userDb;
        private readonly IHubContext<PollsHub> _hubContext;

        public PollsController(WorldNewsDbContext context, UserPollsDbContext userDb, IHubContext<PollsHub> hubContext)
        {
            _context = context;
            _userDb = userDb;
            _hubContext = hubContext;
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

            var updatePayload = new
            {
                pollId = poll.Id,
                question = poll.Question,
                totalVotes,
                results
            };

            // Broadcast live voting stream update to all connected SignalR WebSocket clients!
            try
            {
                await _hubContext.Clients.All.SendAsync("PollUpdated", updatePayload);
                await _hubContext.Clients.Group($"Poll_{poll.Id}").SendAsync("PollUpdated", updatePayload);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ SignalR Broadcast warning: {ex.Message}");
            }

            return Ok(new
            {
                status = "success",
                message = "Vote registered successfully.",
                totalVotes,
                results
            });
        }

        // GET: api/polls/contextual?category=Technology&subcategory=AI
        [HttpGet("contextual")]
        public async Task<IActionResult> GetContextualPoll([FromQuery] string? category = null, [FromQuery] string? subcategory = null)
        {
            var allPolls = await _context.Polls.Include(p => p.Options).ToListAsync();

            if (!allPolls.Any())
            {
                return Ok(null);
            }

            // Find matching poll by subcategory or category
            Poll? matched = null;
            if (!string.IsNullOrEmpty(subcategory))
            {
                matched = allPolls.FirstOrDefault(p => p.Subcategory.Equals(subcategory, StringComparison.OrdinalIgnoreCase));
            }
            if (matched == null && !string.IsNullOrEmpty(category))
            {
                matched = allPolls.FirstOrDefault(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
            }

            // Fallback to first or random active poll
            matched ??= allPolls.OrderBy(p => Guid.NewGuid()).FirstOrDefault();

            if (matched == null)
            {
                return Ok(null);
            }

            int totalVotes = matched.Options.Sum(o => o.Votes);
            var contextualDto = new ContextualPollDto
            {
                PollId = matched.Id,
                Question = matched.Question,
                TotalVotes = totalVotes,
                Options = matched.Options.Select(o => new ContextualPollOptionDto
                {
                    OptionId = o.Id,
                    Text = o.OptionText,
                    Votes = o.Votes
                }).ToList()
            };

            return Ok(contextualDto);
        }

        private bool ContainsBannedWords(string input) => Shared.ValidationHelpers.ContainsBannedWords(input);
        private bool IsValidEmail(string email) => Shared.ValidationHelpers.IsValidEmail(email);

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
        public async Task<IActionResult> GetLeaderboard([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 500) pageSize = 100;

            try
            {
                // Retrieve leaderboard: all submissions ranked by score percentage then submitted date
                var leaderboard = await _userDb.PollSubmissions
                    .OrderByDescending(s => s.Percentage)
                    .ThenByDescending(s => s.SubmittedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
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
        public async Task<IActionResult> GetPollsHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 500) pageSize = 100;

            var submissions = await _userDb.PollSubmissions
                .OrderByDescending(s => s.SubmittedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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

        // POST: api/polls/vote
        [HttpPost("vote")]
        public async Task<IActionResult> Vote([FromBody] VotePayload request)
        {
            if (request == null || request.PollId <= 0 || string.IsNullOrWhiteSpace(request.Choice))
            {
                return BadRequest(new { error = "Invalid vote payload." });
            }

            var poll = await _context.Polls
                .Include(p => p.Options)
                .FirstOrDefaultAsync(p => p.Id == request.PollId);

            if (poll == null)
            {
                return NotFound(new { error = "Poll not found." });
            }

            PollOption? option = null;
            if (int.TryParse(request.Choice, out int optionId))
            {
                option = poll.Options.FirstOrDefault(o => o.Id == optionId);
            }
            if (option == null)
            {
                option = poll.Options.FirstOrDefault(o => o.OptionText.Trim().Equals(request.Choice.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            if (option == null)
            {
                return BadRequest(new { error = "Choice option not found in this poll." });
            }

            option.Votes += 1;
            await _context.SaveChangesAsync();

            int totalVotes = poll.Options.Sum(o => o.Votes);
            var results = poll.Options.Select(o => new
            {
                optionId = o.Id,
                choice = o.OptionText,
                votes = o.Votes,
                percentage = totalVotes > 0 ? Math.Round((double)o.Votes / totalVotes * 100, 1) : 0.0
            }).ToList();

            return Ok(new
            {
                status = "success",
                message = "Vote recorded successfully.",
                pollId = poll.Id,
                totalVotes,
                results
            });
        }

        // GET: api/polls/results
        [HttpGet("results")]
        public async Task<IActionResult> GetResults([FromQuery] int? pollId)
        {
            if (pollId.HasValue)
            {
                var poll = await _context.Polls
                    .Include(p => p.Options)
                    .FirstOrDefaultAsync(p => p.Id == pollId.Value);

                if (poll == null)
                {
                    return NotFound(new { error = "Poll not found." });
                }

                int totalVotes = poll.Options.Sum(o => o.Votes);
                var results = poll.Options.Select(o => new
                {
                    optionId = o.Id,
                    choice = o.OptionText,
                    votes = o.Votes,
                    percentage = totalVotes > 0 ? Math.Round((double)o.Votes / totalVotes * 100, 1) : 0.0
                }).ToList();

                return Ok(new
                {
                    pollId = poll.Id,
                    question = poll.Question,
                    totalVotes,
                    results
                });
            }
            else
            {
                var polls = await _context.Polls
                    .Include(p => p.Options)
                    .ToListAsync();

                var allResults = polls.Select(p => {
                    int totalVotes = p.Options.Sum(o => o.Votes);
                    return new {
                        pollId = p.Id,
                        question = p.Question,
                        totalVotes,
                        results = p.Options.Select(o => new {
                            optionId = o.Id,
                            choice = o.OptionText,
                            votes = o.Votes,
                            percentage = totalVotes > 0 ? Math.Round((double)o.Votes / totalVotes * 100, 1) : 0.0
                        }).ToList()
                    };
                }).ToList();

                return Ok(allResults);
            }
        }
    }

    public class VotePayload
    {
        public int PollId { get; set; }
        public string Choice { get; set; } = string.Empty;
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
