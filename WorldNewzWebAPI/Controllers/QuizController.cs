using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuizController : ControllerBase
    {
        private readonly UserPollsDbContext _userDb;

        public QuizController(UserPollsDbContext userDb)
        {
            _userDb = userDb;
        }

        private List<QuizQuestion> LoadQuestionsPool()
        {
            try
            {
                // Try executing assembly directory
                var path = Path.Combine(AppContext.BaseDirectory, "quiz.json");
                if (!System.IO.File.Exists(path))
                {
                    // Fallback to project root directory
                    path = Path.Combine(Directory.GetCurrentDirectory(), "quiz.json");
                }
                if (!System.IO.File.Exists(path))
                {
                    Console.WriteLine($"⚠️ quiz.json not found at path: {path}");
                    return new List<QuizQuestion>();
                }
                var json = System.IO.File.ReadAllText(path);
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                return JsonSerializer.Deserialize<List<QuizQuestion>>(json, options) ?? new List<QuizQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error loading quiz.json: {ex.Message}");
                return new List<QuizQuestion>();
            }
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

        // GET: api/quiz/questions
        [HttpGet("questions")]
        public IActionResult GetQuestions()
        {
            var pool = LoadQuestionsPool();
            if (pool.Count == 0)
            {
                return StatusCode(500, new { error = "Quiz question pool not available." });
            }

            // Shuffle pool using Guid.NewGuid() and select 10 questions
            // Strip the IsCorrect property so client-side users cannot cheat
            var randomized = pool
                .OrderBy(q => Guid.NewGuid())
                .Take(10)
                .Select(q => new ClientQuizQuestion
                {
                    Id = q.Id,
                    Question = q.Question,
                    Description = q.Description,
                    Options = q.Options.Select(o => new ClientQuizOption
                    {
                        Id = o.Id,
                        OptionText = o.OptionText
                    }).ToList()
                })
                .ToList();

            return Ok(randomized);
        }

        // GET: api/quiz/check-attempt
        [HttpGet("check-attempt")]
        public async Task<IActionResult> CheckAttempt([FromQuery] string name, [FromQuery] string email, [FromQuery] int timezoneOffset = 0)
        {
            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email))
            {
                return BadRequest(new { error = "Name and Email are required parameters." });
            }

            var trimmedName = name.Trim().ToLower();
            var trimmedEmail = email.Trim().ToLower();

            // Calculate user's current local date
            var todayLocal = DateTime.UtcNow.AddMinutes(-timezoneOffset).Date;

            var userSubmissions = await _userDb.QuizSubmissions
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
                    scoreStatus = todaySubmission.Status,
                    coins = todaySubmission.Coins,
                    score = todaySubmission.Score
                });
            }

            return Ok(new { exists = false });
        }

        // POST: api/quiz/submit
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitQuiz([FromBody] QuizSubmissionRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { error = "Invalid submission payload." });
            }

            var name = (request.Name ?? "").Trim();
            var email = (request.Email ?? "").Trim();

            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email))
            {
                return BadRequest(new { error = "Name and Email are required fields." });
            }

            if (ContainsBannedWords(name) || ContainsBannedWords(email))
            {
                return BadRequest(new { error = "Unwanted or inappropriate content detected in Name or Email." });
            }

            if (!IsValidEmail(email))
            {
                return BadRequest(new { error = "Please provide a valid Email address format." });
            }

            // Verify they haven't taken the quiz today
            var todayLocal = DateTime.UtcNow.AddMinutes(-request.TimezoneOffset).Date;
            var userSubmissions = await _userDb.QuizSubmissions
                .Where(s => s.Name.ToLower() == name.ToLower() && s.Email.ToLower() == email.ToLower())
                .ToListAsync();

            if (userSubmissions.Any(s => s.SubmittedAt.AddMinutes(-request.TimezoneOffset).Date == todayLocal))
            {
                return BadRequest(new { error = "You have already completed today's quiz. Please try again tomorrow!" });
            }

            if (request.Answers == null || request.Answers.Count == 0)
            {
                return BadRequest(new { error = "Please submit answers for at least one question." });
            }

            // Load the full question pool (which contains correctness flags)
            var pool = LoadQuestionsPool();

            int correctCount = 0;
            var resultsEvaluation = new List<QuestionEvaluationResult>();

            foreach (var ans in request.Answers)
            {
                var question = pool.FirstOrDefault(q => q.Id == ans.QuestionId);
                if (question != null)
                {
                    var correctOption = question.Options.FirstOrDefault(o => o.IsCorrect);
                    bool wasCorrect = correctOption != null && correctOption.Id == ans.OptionId;
                    if (wasCorrect)
                    {
                        correctCount++;
                    }

                    resultsEvaluation.Add(new QuestionEvaluationResult
                    {
                        QuestionId = question.Id,
                        SubmittedOptionId = ans.OptionId,
                        CorrectOptionId = correctOption?.Id ?? 0,
                        IsCorrect = wasCorrect
                    });
                }
            }

            int totalQuestions = request.Answers.Count;
            double percentage = Math.Round(((double)correctCount / totalQuestions) * 100, 1);
            int coins = correctCount * 10; // Earn 10 Gold Coins per correct answer!

            string status = "Red";
            if (percentage >= 60.0) status = "Green";
            else if (percentage >= 30.0) status = "Orange";

            var submission = new QuizSubmission
            {
                Name = name,
                Email = email,
                Score = correctCount,
                Coins = coins,
                Percentage = percentage,
                Status = status,
                SubmittedAt = DateTime.UtcNow
            };

            _userDb.QuizSubmissions.Add(submission);
            await _userDb.SaveChangesAsync();

            return Ok(new
            {
                status = "success",
                score = correctCount,
                total = totalQuestions,
                percentage = percentage,
                coins = coins,
                scoreStatus = status,
                results = resultsEvaluation
            });
        }

        // GET: api/quiz/leaderboard
        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard()
        {
            try
            {
                var all = await _userDb.QuizSubmissions.ToListAsync();

                // Group by email to retrieve distinct users, showing their highest gold coins and latest date
                var leaderboard = all
                    .GroupBy(s => s.Email.ToLower())
                    .Select(g => g.OrderByDescending(s => s.Coins).ThenByDescending(s => s.SubmittedAt).First())
                    .OrderByDescending(s => s.Coins)
                    .ThenByDescending(s => s.SubmittedAt)
                    .ToList();

                var history = leaderboard.Select(s => new
                {
                    id = s.Id,
                    name = s.Name,
                    email = s.Email,
                    score = s.Score,
                    coins = s.Coins,
                    percentage = s.Percentage,
                    status = s.Status,
                    submittedAt = DateTime.SpecifyKind(s.SubmittedAt, DateTimeKind.Utc).ToString("o")
                }).ToList();

                return Ok(history);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error fetching leaderboard: {ex.Message}");
                return StatusCode(500, new { error = "Failed to retrieve leaderboard." });
            }
        }

        // GET: api/quiz/history
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            try
            {
                var submissions = await _userDb.QuizSubmissions
                    .OrderByDescending(s => s.SubmittedAt)
                    .ToListAsync();

                var history = submissions.Select(s => new
                {
                    id = s.Id,
                    name = s.Name,
                    email = s.Email,
                    score = s.Score,
                    coins = s.Coins,
                    percentage = s.Percentage,
                    status = s.Status,
                    submittedAt = DateTime.SpecifyKind(s.SubmittedAt, DateTimeKind.Utc).ToString("o")
                }).ToList();

                return Ok(history);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error fetching history: {ex.Message}");
                return StatusCode(500, new { error = "Failed to retrieve quiz history." });
            }
        }
    }

    // --- Helpers / DTOs ---

    public class QuizQuestion
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<QuizOption> Options { get; set; } = new();
    }

    public class QuizOption
    {
        public int Id { get; set; }
        public string OptionText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }

    public class ClientQuizQuestion
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<ClientQuizOption> Options { get; set; } = new();
    }

    public class ClientQuizOption
    {
        public int Id { get; set; }
        public string OptionText { get; set; } = string.Empty;
    }

    public class QuizSubmissionRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int TimezoneOffset { get; set; } = 0;
        public List<QuizAnswerRequest> Answers { get; set; } = new();
    }

    public class QuizAnswerRequest
    {
        public int QuestionId { get; set; }
        public int OptionId { get; set; }
    }

    public class QuestionEvaluationResult
    {
        public int QuestionId { get; set; }
        public int SubmittedOptionId { get; set; }
        public int CorrectOptionId { get; set; }
        public bool IsCorrect { get; set; }
    }
}
