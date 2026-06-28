using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/jobs")]
    public class JobsController : ControllerBase
    {
        private readonly WorldNewsDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;

        public JobsController(WorldNewsDbContext db, IHttpClientFactory httpClientFactory)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet]
        public async Task<IActionResult> GetJobs([FromQuery] int page = 1)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(8);
                client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

                var url = $"https://www.arbeitnow.com/api/job-board-api?page={page}";
                var response = await client.GetAsync(url);
                
                List<object> clientJobs = new();
                object? links = null;
                object? meta = null;

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<ArbeitnowResponse>(content, Shared.JsonSettings.CaseInsensitiveOptions);
                    if (apiResponse != null && apiResponse.data != null)
                    {
                        links = apiResponse.links;
                        meta = apiResponse.meta;

                        var slugs = apiResponse.data.Select(j => j.slug).ToList();
                        var existingJobs = await _db.JobPostings
                            .Where(j => slugs.Contains(j.Slug))
                            .ToDictionaryAsync(j => j.Slug);

                        foreach (var job in apiResponse.data)
                        {
                            existingJobs.TryGetValue(job.slug, out var existing);
                            if (existing == null)
                            {
                                _db.JobPostings.Add(new JobPosting
                                {
                                    Slug = job.slug,
                                    CompanyName = job.company_name,
                                    Title = job.title,
                                    Description = job.description,
                                    Remote = job.remote,
                                    Url = job.url,
                                    Tags = job.tags != null ? string.Join(",", job.tags) : null,
                                    JobTypes = job.job_types != null ? string.Join(",", job.job_types) : null,
                                    Location = job.location,
                                    CreatedAt = job.created_at,
                                    IsLocal = false
                                });
                            }
                            else if (!existing.IsLocal)
                            {
                                existing.CompanyName = job.company_name;
                                existing.Title = job.title;
                                existing.Description = job.description;
                                existing.Remote = job.remote;
                                existing.Url = job.url;
                                existing.Tags = job.tags != null ? string.Join(",", job.tags) : null;
                                existing.JobTypes = job.job_types != null ? string.Join(",", job.job_types) : null;
                                existing.Location = job.location;
                                existing.CreatedAt = job.created_at;
                            }
                        }
                        await _db.SaveChangesAsync();

                        clientJobs = apiResponse.data.Select(job => (object)new {
                            slug = job.slug,
                            company_name = job.company_name,
                            title = job.title,
                            description = job.description,
                            remote = job.remote,
                            url = job.url,
                            tags = job.tags ?? new List<string>(),
                            job_types = job.job_types ?? new List<string>(),
                            location = job.location,
                            created_at = job.created_at,
                            isLocal = false
                        }).ToList();
                    }
                }
                else
                {
                    // Fallback to DB if external API call fails
                    var dbJobs = await _db.JobPostings
                        .OrderByDescending(j => j.CreatedAt)
                        .Skip((page - 1) * 20)
                        .Take(20)
                        .ToListAsync();

                    clientJobs = dbJobs.Select(job => (object)new {
                        slug = job.Slug,
                        company_name = job.CompanyName,
                        title = job.Title,
                        description = job.Description,
                        remote = job.Remote,
                        url = job.Url,
                        tags = job.Tags != null ? job.Tags.Split(',').ToList() : new List<string>(),
                        job_types = job.JobTypes != null ? job.JobTypes.Split(',').ToList() : new List<string>(),
                        location = job.Location,
                        created_at = job.CreatedAt,
                        isLocal = job.IsLocal
                    }).ToList();

                    meta = new { current_page = page, next = clientJobs.Count == 20 ? page + 1 : (int?)null };
                }

                if (page == 1)
                {
                    var localPostings = await _db.JobPostings
                        .Where(j => j.IsLocal)
                        .OrderByDescending(j => j.CreatedAt)
                        .ToListAsync();

                    var mappedLocals = localPostings.Select(job => (object)new {
                        slug = job.Slug,
                        company_name = job.CompanyName,
                        title = job.Title,
                        description = job.Description,
                        remote = job.Remote,
                        url = job.Url,
                        tags = job.Tags != null ? job.Tags.Split(',').ToList() : new List<string>(),
                        job_types = job.JobTypes != null ? job.JobTypes.Split(',').ToList() : new List<string>(),
                        location = job.Location,
                        created_at = job.CreatedAt,
                        isLocal = true
                    });

                    clientJobs.InsertRange(0, mappedLocals);
                }

                Response.Headers.CacheControl = "public, max-age=1800"; // Cache for 30 minutes
                return Ok(new { data = clientJobs, links = links, meta = meta });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("detail/{slug}")]
        public async Task<IActionResult> GetJobDetail(string slug)
        {
            try
            {
                var job = await _db.JobPostings.FirstOrDefaultAsync(j => j.Slug == slug);
                if (job != null)
                {
                    return Ok(new {
                        slug = job.Slug,
                        company_name = job.CompanyName,
                        title = job.Title,
                        description = job.Description,
                        remote = job.Remote,
                        url = job.Url,
                        tags = job.Tags != null ? job.Tags.Split(',').ToList() : new List<string>(),
                        job_types = job.JobTypes != null ? job.JobTypes.Split(',').ToList() : new List<string>(),
                        location = job.Location,
                        created_at = job.CreatedAt,
                        isLocal = job.IsLocal
                    });
                }

                // Try searching on Arbeitnow API by slug words
                var query = slug.Replace("-", " ");
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(8);
                client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

                var response = await client.GetAsync($"https://www.arbeitnow.com/api/job-board-api?search={Uri.EscapeDataString(query)}");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<ArbeitnowResponse>(content, Shared.JsonSettings.CaseInsensitiveOptions);
                    if (apiResponse != null && apiResponse.data != null)
                    {
                        var apiJob = apiResponse.data.FirstOrDefault(j => j.slug == slug);
                        if (apiJob != null)
                        {
                            var newJob = new JobPosting
                            {
                                Slug = apiJob.slug,
                                CompanyName = apiJob.company_name,
                                Title = apiJob.title,
                                Description = apiJob.description,
                                Remote = apiJob.remote,
                                Url = apiJob.url,
                                Tags = apiJob.tags != null ? string.Join(",", apiJob.tags) : null,
                                JobTypes = apiJob.job_types != null ? string.Join(",", apiJob.job_types) : null,
                                Location = apiJob.location,
                                CreatedAt = apiJob.created_at,
                                IsLocal = false
                            };
                            _db.JobPostings.Add(newJob);
                            await _db.SaveChangesAsync();

                            return Ok(new {
                                slug = apiJob.slug,
                                company_name = apiJob.company_name,
                                title = apiJob.title,
                                description = apiJob.description,
                                remote = apiJob.remote,
                                url = apiJob.url,
                                tags = apiJob.tags ?? new List<string>(),
                                job_types = apiJob.job_types ?? new List<string>(),
                                location = apiJob.location,
                                created_at = apiJob.created_at,
                                isLocal = false
                            });
                        }
                    }
                }

                return NotFound(new { error = "Job posting not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("post")]
        public async Task<IActionResult> PostJob([FromBody] JobPostRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Title) || string.IsNullOrEmpty(request.CompanyName) || string.IsNullOrEmpty(request.Description))
                {
                    return BadRequest(new { error = "Title, Company Name, and Description are required." });
                }

                var cleanCompany = Regex.Replace(request.CompanyName.ToLower(), @"[^a-z0-9\s-]", "").Replace(" ", "-");
                var cleanTitle = Regex.Replace(request.Title.ToLower(), @"[^a-z0-9\s-]", "").Replace(" ", "-");
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var slug = $"{cleanCompany}-{cleanTitle}-{timestamp}";

                var job = new JobPosting
                {
                    Slug = slug,
                    CompanyName = request.CompanyName,
                    Title = request.Title,
                    Description = request.Description,
                    Remote = request.Remote,
                    Url = request.Url,
                    Tags = request.Tags != null ? string.Join(",", request.Tags) : null,
                    JobTypes = request.JobTypes != null ? string.Join(",", request.JobTypes) : null,
                    Location = request.Location,
                    CreatedAt = timestamp,
                    IsLocal = true
                };

                _db.JobPostings.Add(job);
                await _db.SaveChangesAsync();

                return Ok(new { success = true, slug = slug });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class ArbeitnowJob
    {
        public string slug { get; set; } = string.Empty;
        public string company_name { get; set; } = string.Empty;
        public string title { get; set; } = string.Empty;
        public string description { get; set; } = string.Empty;
        public bool remote { get; set; }
        public string url { get; set; } = string.Empty;
        public List<string>? tags { get; set; }
        public List<string>? job_types { get; set; }
        public string location { get; set; } = string.Empty;
        public long created_at { get; set; }
    }

    public class ArbeitnowResponse
    {
        public List<ArbeitnowJob> data { get; set; } = new();
        public object? links { get; set; }
        public object? meta { get; set; }
    }

    public class JobPostRequest
    {
        public string CompanyName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool Remote { get; set; }
        public string Url { get; set; } = string.Empty;
        public List<string>? Tags { get; set; }
        public List<string>? JobTypes { get; set; }
        public string Location { get; set; } = string.Empty;
    }
}
