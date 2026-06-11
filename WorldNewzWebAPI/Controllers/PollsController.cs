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

        public PollsController(WorldNewsDbContext context)
        {
            _context = context;
        }

        // GET: api/polls
        [HttpGet]
        public async Task<IActionResult> GetActivePolls()
        {
            // Returns active/current polls (we can sort by date descending)
            var activePolls = await _context.Polls
                .Include(p => p.Options)
                .OrderByDescending(p => p.CreatedAt)
                .Take(5)
                .ToListAsync();

            return Ok(activePolls);
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

        // GET: api/polls/history
        [HttpGet("history")]
        public async Task<IActionResult> GetPollsHistory()
        {
            // Returns history format suitable for a premium DataGrid
            var polls = await _context.Polls
                .Include(p => p.Options)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var history = polls.Select(p => {
                int totalVotes = p.Options.Sum(o => o.Votes);
                
                // Construct a detailed options breakdown text for the DataGrid
                var optionsBreakdown = string.Join(" | ", p.Options.Select(o => 
                    $"{o.OptionText}: {o.Votes} ({(totalVotes > 0 ? Math.Round((double)o.Votes / totalVotes * 100, 1) : 0.0)}%)"
                ));

                return new
                {
                    id = p.Id,
                    question = p.Question,
                    description = p.Description,
                    createdAt = p.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                    totalVotes,
                    optionsBreakdown
                };
            }).ToList();

            return Ok(history);
        }
    }

    public class VoteRequest
    {
        public int OptionId { get; set; }
    }
}
