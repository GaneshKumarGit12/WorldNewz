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
            try
            {
                var allPolls = await _context.Polls
                    .Include(p => p.Options)
                    .ToListAsync();

                if (allPolls == null || allPolls.Count == 0)
                {
                    allPolls = GetFallbackDefaultPolls();
                    // Seed into database for future persistence
                    try
                    {
                        _context.Polls.AddRange(allPolls);
                        await _context.SaveChangesAsync();
                    }
                    catch (Exception seedEx)
                    {
                        Console.WriteLine($"⚠️ Could not save default fallback polls: {seedEx.Message}");
                    }
                }

                // Randomly shuffle using Guid.NewGuid() and take 5
                var randomized = allPolls
                    .OrderBy(p => Guid.NewGuid())
                    .Take(5)
                    .ToList();

                return Ok(randomized);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ GetActivePolls exception: {ex.Message}");
                return Ok(GetFallbackDefaultPolls());
            }
        }

        private List<Poll> GetFallbackDefaultPolls()
        {
            return new List<Poll>
            {
                new Poll
                {
                    Id = 1,
                    Question = "How will Artificial Intelligence impact your career in the next 5 years?",
                    Description = "A poll tracking general public sentiment regarding automated systems and career displacement/enhancement.",
                    Category = "Technology",
                    Subcategory = "Artificial Intelligence",
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    Options = new List<PollOption>
                    {
                        new PollOption { Id = 1, PollId = 1, OptionText = "Very Positively", Votes = 245, IsCorrect = true },
                        new PollOption { Id = 2, PollId = 1, OptionText = "Somewhat Positively", Votes = 312, IsCorrect = false },
                        new PollOption { Id = 3, PollId = 1, OptionText = "Neutral / No Impact", Votes = 98, IsCorrect = false },
                        new PollOption { Id = 4, PollId = 1, OptionText = "Negatively / Risk of Layoff", Votes = 156, IsCorrect = false }
                    }
                },
                new Poll
                {
                    Id = 2,
                    Question = "What is your primary source of daily technology news?",
                    Description = "Identifying news distribution preference among modern readers.",
                    Category = "Technology",
                    Subcategory = "Media",
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    Options = new List<PollOption>
                    {
                        new PollOption { Id = 5, PollId = 2, OptionText = "Social Media Platforms (Twitter, Reddit)", Votes = 189, IsCorrect = false },
                        new PollOption { Id = 6, PollId = 2, OptionText = "Dedicated News Sites (WorldNewzs, BBC)", Votes = 224, IsCorrect = true },
                        new PollOption { Id = 7, PollId = 2, OptionText = "Podcasts & Video Channels", Votes = 110, IsCorrect = false },
                        new PollOption { Id = 8, PollId = 2, OptionText = "Email Newsletters & RSS Feeds", Votes = 85, IsCorrect = false }
                    }
                },
                new Poll
                {
                    Id = 3,
                    Question = "Do you support stricter global regulation on social media algorithms?",
                    Description = "Evaluating public policy opinion regarding algorithmic content ranking and privacy protections.",
                    Category = "Politics",
                    Subcategory = "Policy",
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    Options = new List<PollOption>
                    {
                        new PollOption { Id = 9, PollId = 3, OptionText = "Yes, heavy government oversight is required.", Votes = 412, IsCorrect = true },
                        new PollOption { Id = 10, PollId = 3, OptionText = "No, platforms should self-regulate.", Votes = 130, IsCorrect = false },
                        new PollOption { Id = 11, PollId = 3, OptionText = "Unsure / Depends on country laws.", Votes = 95, IsCorrect = false }
                    }
                },
                new Poll
                {
                    Id = 4,
                    Question = "Which EV feature is most critical for your next vehicle purchase?",
                    Description = "Consumer sentiment survey for next-generation electric automotive technologies.",
                    Category = "Business",
                    Subcategory = "Automotive",
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    Options = new List<PollOption>
                    {
                        new PollOption { Id = 12, PollId = 4, OptionText = "Longer Battery Range (>400 miles)", Votes = 520, IsCorrect = true },
                        new PollOption { Id = 13, PollId = 4, OptionText = "Ultra-Fast Charging Speed (<15 mins)", Votes = 310, IsCorrect = false },
                        new PollOption { Id = 14, PollId = 4, OptionText = "Lower Initial Purchase Price", Votes = 280, IsCorrect = false },
                        new PollOption { Id = 15, PollId = 4, OptionText = "Autonomous Self-Driving Capability", Votes = 95, IsCorrect = false }
                    }
                },
                new Poll
                {
                    Id = 5,
                    Question = "How often do you check daily financial stock and market indices?",
                    Description = "Tracking reader engagement with financial technology tools and stock tickers.",
                    Category = "Money",
                    Subcategory = "Stocks",
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    Options = new List<PollOption>
                    {
                        new PollOption { Id = 16, PollId = 5, OptionText = "Multiple times throughout the day", Votes = 290, IsCorrect = true },
                        new PollOption { Id = 17, PollId = 5, OptionText = "Once daily after market close", Votes = 180, IsCorrect = false },
                        new PollOption { Id = 18, PollId = 5, OptionText = "Weekly or occasionally", Votes = 210, IsCorrect = false },
                        new PollOption { Id = 19, PollId = 5, OptionText = "Never / Not interested in finance", Votes = 140, IsCorrect = false }
                    }
                }
            };
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
        public async Task<IActionResult> GetContextualPoll([FromQuery] string? category = null, [FromQuery] string? subcategory = null, [FromQuery] string? articleUrl = null)
        {
            try
            {
                var allPolls = await _context.Polls.Include(p => p.Options).ToListAsync();

                if (allPolls == null || !allPolls.Any())
                {
                    allPolls = GetFallbackDefaultPolls();
                }

                // 1. Check if there is an exact article URL matched poll in the database
                Poll? matched = null;
                if (!string.IsNullOrWhiteSpace(articleUrl))
                {
                    matched = allPolls.FirstOrDefault(p => !string.IsNullOrWhiteSpace(p.Subcategory) && p.Subcategory.Equals(articleUrl.Trim(), StringComparison.OrdinalIgnoreCase));
                }

                if (matched == null)
                {
                    // 1.5 Resolve real category from NewsArticles DB or guess by title/URL heuristics if generic (e.g. "Search", "News", "General")
                    string resolvedCategory = category ?? string.Empty;
                    if (string.IsNullOrWhiteSpace(resolvedCategory) || 
                        resolvedCategory.Equals("Search", StringComparison.OrdinalIgnoreCase) || 
                        resolvedCategory.Equals("News", StringComparison.OrdinalIgnoreCase) || 
                        resolvedCategory.Equals("General", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!string.IsNullOrWhiteSpace(articleUrl))
                        {
                            var dbArticle = await _context.NewsArticles
                                .Include(a => a.Category)
                                .FirstOrDefaultAsync(a => a.Url == articleUrl);
                            if (dbArticle != null && dbArticle.Category != null)
                            {
                                resolvedCategory = dbArticle.Category.Name;
                            }
                            else
                            {
                                var enriched = await _context.EnrichedArticles.FirstOrDefaultAsync(e => e.Url == articleUrl);
                                resolvedCategory = GuessCategory(articleUrl, enriched?.Headline, enriched?.Summary);
                            }
                        }
                    }
                    else
                    {
                        if (resolvedCategory.Equals("Search", StringComparison.OrdinalIgnoreCase) || 
                            resolvedCategory.Equals("News", StringComparison.OrdinalIgnoreCase) || 
                            resolvedCategory.Equals("General", StringComparison.OrdinalIgnoreCase))
                        {
                            var enriched = await _context.EnrichedArticles.FirstOrDefaultAsync(e => e.Url == articleUrl);
                            resolvedCategory = GuessCategory(articleUrl, enriched?.Headline, enriched?.Summary);
                        }
                    }

                    category = resolvedCategory;

                    // 2. Perform smart category sanitization
                    string cleanCategory = string.Empty;
                    if (!string.IsNullOrWhiteSpace(category))
                    {
                        cleanCategory = category.Replace("News", "", StringComparison.OrdinalIgnoreCase)
                                                .Replace("&", "-", StringComparison.OrdinalIgnoreCase)
                                                .Replace(" ", "", StringComparison.OrdinalIgnoreCase)
                                                .Trim();

                        if (cleanCategory.Contains("Science", StringComparison.OrdinalIgnoreCase) || cleanCategory.Contains("Health", StringComparison.OrdinalIgnoreCase))
                        {
                            cleanCategory = "Science-Health";
                        }
                        else if (cleanCategory.Contains("Money", StringComparison.OrdinalIgnoreCase) || cleanCategory.Contains("Finance", StringComparison.OrdinalIgnoreCase))
                        {
                            cleanCategory = "Money";
                        }
                        else if (cleanCategory.Contains("Stock", StringComparison.OrdinalIgnoreCase))
                        {
                            cleanCategory = "Stocks";
                        }
                        else if (cleanCategory.Contains("Game", StringComparison.OrdinalIgnoreCase))
                        {
                            cleanCategory = "Gaming";
                        }
                        else if (cleanCategory.Contains("Movie", StringComparison.OrdinalIgnoreCase))
                        {
                            cleanCategory = "Movies";
                        }
                        else if (cleanCategory.Contains("Job", StringComparison.OrdinalIgnoreCase))
                        {
                            cleanCategory = "Jobs";
                        }
                        else if (cleanCategory.Contains("Tech", StringComparison.OrdinalIgnoreCase))
                        {
                            cleanCategory = "Technology";
                        }
                    }

                    // 3. Collect matching polls from database and polls.json
                    var matchingPolls = new List<Poll>();

                    if (!string.IsNullOrWhiteSpace(cleanCategory))
                    {
                        matchingPolls.AddRange(allPolls.Where(p => !string.IsNullOrWhiteSpace(p.Category) && 
                            (p.Category.Contains(cleanCategory, StringComparison.OrdinalIgnoreCase) || 
                             cleanCategory.Contains(p.Category, StringComparison.OrdinalIgnoreCase))));
                    }

                    // Load from polls.json
                    try
                    {
                        var path = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "polls.json");
                        if (System.IO.File.Exists(path))
                        {
                            var json = System.IO.File.ReadAllText(path);
                            var jsonPolls = System.Text.Json.JsonSerializer.Deserialize<List<JsonPollDto>>(json, Shared.JsonSettings.CaseInsensitiveOptions);
                            if (jsonPolls != null)
                            {
                                int jsonIdStart = 20000;
                                foreach (var jp in jsonPolls)
                                {
                                    string jpCat = jp.Category ?? "General";
                                    string jpClean = jpCat.Replace("News", "", StringComparison.OrdinalIgnoreCase)
                                                         .Replace("&", "-", StringComparison.OrdinalIgnoreCase)
                                                         .Replace(" ", "", StringComparison.OrdinalIgnoreCase)
                                                         .Trim();
                                    if (jpClean.Contains("Science", StringComparison.OrdinalIgnoreCase) || jpClean.Contains("Health", StringComparison.OrdinalIgnoreCase)) jpClean = "Science-Health";
                                    if (jpClean.Contains("Money", StringComparison.OrdinalIgnoreCase) || jpClean.Contains("Finance", StringComparison.OrdinalIgnoreCase)) jpClean = "Money";
                                    if (jpClean.Contains("Stock", StringComparison.OrdinalIgnoreCase)) jpClean = "Stocks";
                                    if (jpClean.Contains("Game", StringComparison.OrdinalIgnoreCase)) jpClean = "Gaming";
                                    if (jpClean.Contains("Movie", StringComparison.OrdinalIgnoreCase)) jpClean = "Movies";
                                    if (jpClean.Contains("Job", StringComparison.OrdinalIgnoreCase)) jpClean = "Jobs";
                                    if (jpClean.Contains("Tech", StringComparison.OrdinalIgnoreCase)) jpClean = "Technology";

                                    if (string.IsNullOrWhiteSpace(cleanCategory) || jpClean.Equals(cleanCategory, StringComparison.OrdinalIgnoreCase))
                                    {
                                        var p = new Poll
                                        {
                                            Id = jsonIdStart++,
                                            Question = jp.Question ?? "",
                                            Description = $"Opinion survey about {jpCat}",
                                            Category = jpCat,
                                            Subcategory = "General",
                                            CreatedAt = DateTime.UtcNow,
                                            Options = (jp.Options ?? new List<string>()).Select((opt, idx) => new PollOption
                                            {
                                                Id = idx + 1,
                                                OptionText = opt,
                                                Votes = 150 + (idx * 45) + new Random().Next(10, 50),
                                                IsCorrect = idx == 0
                                            }).ToList()
                                        };
                                        matchingPolls.Add(p);
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️ Error reading polls.json: {ex.Message}");
                    }

                    // 4. Select deterministic poll from matching list based on article URL
                    if (matchingPolls.Any())
                    {
                        int selectIndex = 0;
                        if (!string.IsNullOrWhiteSpace(articleUrl))
                        {
                            int hashVal = articleUrl.Split().Select(c => c.Length > 0 ? (int)c[0] : 0).Sum() + articleUrl.Length;
                            foreach (char c in articleUrl) hashVal += (int)c;
                            selectIndex = Math.Abs(hashVal) % matchingPolls.Count;
                        }
                        matched = matchingPolls[selectIndex];
                    }
                }

                // 5. Final fallback to default DB polls
                matched ??= allPolls.FirstOrDefault();

                if (matched == null || matched.Options == null || !matched.Options.Any())
                {
                    return Ok(null);
                }

                int totalVotes = matched.Options.Sum(o => o.Votes);
                var contextualDto = new ContextualPollDto
                {
                    PollId = matched.Id,
                    Question = matched.Question ?? "Community Sentiment Poll",
                    TotalVotes = totalVotes,
                    Options = matched.Options.Select(o => new ContextualPollOptionDto
                    {
                        OptionId = o.Id,
                        Text = o.OptionText ?? "",
                        Votes = o.Votes
                    }).ToList()
                };

                return Ok(contextualDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ GetContextualPoll exception: {ex.Message}");
                var fallback = GetFallbackDefaultPolls().FirstOrDefault();
                if (fallback == null) return Ok(null);

                int totalVotes = fallback.Options.Sum(o => o.Votes);
                return Ok(new ContextualPollDto
                {
                    PollId = fallback.Id,
                    Question = fallback.Question,
                    TotalVotes = totalVotes,
                    Options = fallback.Options.Select(o => new ContextualPollOptionDto
                    {
                        OptionId = o.Id,
                        Text = o.OptionText,
                        Votes = o.Votes
                    }).ToList()
                });
            }
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

        private string GuessCategory(string? url, string? title, string? description)
        {
            var text = $"{url} {title} {description}".ToLower();
            
            if (text.Contains("sport") || text.Contains("soccer") || text.Contains("football") || 
                text.Contains("olympic") || text.Contains("tennis") || text.Contains("cricket") || 
                text.Contains("basketball") || text.Contains("nba") || text.Contains("fifa") || 
                text.Contains("athlete") || text.Contains("championship") || text.Contains("baseball") ||
                text.Contains("cup") || text.Contains("match") || text.Contains("league"))
            {
                return "Sports";
            }
            
            if (text.Contains("stock") || text.Contains("market") || text.Contains("nasdaq") || 
                text.Contains("invest") || text.Contains("crypto") || text.Contains("bitcoin") || 
                text.Contains("finance") || text.Contains("inflation") || text.Contains("interest rate") || 
                text.Contains("dow jones") || text.Contains("s&p") || text.Contains("dividend"))
            {
                return "Stocks";
            }
            
            if (text.Contains("job") || text.Contains("career") || text.Contains("salary") || 
                text.Contains("hiring") || text.Contains("workforce") || text.Contains("employee") || 
                text.Contains("layoff") || text.Contains("recruit") || text.Contains("hired"))
            {
                return "Jobs";
            }

            if (text.Contains("apple") || text.Contains("google") || text.Contains("microsoft") || 
                text.Contains("ai") || text.Contains("nvidia") || text.Contains("silicon") || 
                text.Contains("smartphone") || text.Contains("software") || text.Contains("windows") || 
                text.Contains("tech") || text.Contains("computer") || text.Contains("cyber") ||
                text.Contains("android") || text.Contains("chip") || text.Contains("app"))
            {
                return "Technology";
            }

            if (text.Contains("movie") || text.Contains("film") || text.Contains("cinema") || 
                text.Contains("actor") || text.Contains("hollywood") || text.Contains("netflix") || 
                text.Contains("oscar") || text.Contains("entertainment") || text.Contains("showbiz") ||
                text.Contains("theatre") || text.Contains("star") || text.Contains("series"))
            {
                return "Movies";
            }

            if (text.Contains("health") || text.Contains("cancer") || text.Contains("vaccine") || 
                text.Contains("covid") || text.Contains("virus") || text.Contains("scientific") || 
                text.Contains("space") || text.Contains("nasa") || text.Contains("planet") || 
                text.Contains("climate") || text.Contains("fossil") || text.Contains("medical") || 
                text.Contains("science") || text.Contains("biology") || text.Contains("research") ||
                text.Contains("doctor") || text.Contains("hospital") || text.Contains("drug"))
            {
                return "Science-Health";
            }

            if (text.Contains("election") || text.Contains("biden") || text.Contains("trump") || 
                text.Contains("government") || text.Contains("senate") || text.Contains("parliament") || 
                text.Contains("bill") || text.Contains("democrat") || text.Contains("republican") || 
                text.Contains("politics") || text.Contains("politician") || text.Contains("veto") ||
                text.Contains("president") || text.Contains("governor") || text.Contains("diplomat"))
            {
                return "Politics";
            }

            if (text.Contains("business") || text.Contains("corp") || text.Contains("startup") || 
                text.Contains("merger") || text.Contains("acquisition") || text.Contains("ceo") || 
                text.Contains("earnings") || text.Contains("enterprise") || text.Contains("revenue") ||
                text.Contains("venture") || text.Contains("sales"))
            {
                return "Business";
            }

            if (text.Contains("money") || text.Contains("dollar") || text.Contains("cash") || 
                text.Contains("save") || text.Contains("bank") || text.Contains("wallet") ||
                text.Contains("credit") || text.Contains("debt"))
            {
                return "Money";
            }

            if (text.Contains("game") || text.Contains("gaming") || text.Contains("playstation") || 
                text.Contains("xbox") || text.Contains("nintendo") || text.Contains("steam") ||
                text.Contains("gamer"))
            {
                return "Gaming";
            }

            return "General";
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

    public class JsonPollDto
    {
        public string? Question { get; set; }
        public string? Category { get; set; }
        public System.Collections.Generic.List<string>? Options { get; set; }
    }
}
