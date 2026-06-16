using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Services;
using Quartz;
using WorldNewzWebAPI.Jobs;
using DotNetEnv;

var builder = WebApplication.CreateBuilder(args);

// Try to load local .env file (safe for production if missing)
try
{
    Env.Load(builder.Environment.ContentRootPath + "/.env");
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️ No .env file found: {ex.Message}");
}

// Add environment variables into configuration
builder.Configuration.AddEnvironmentVariables();

// Get database path from environment or default
var dbPath = Environment.GetEnvironmentVariable("DATABASE_PATH") ?? "worldnews.db";
var isAbsoluteDbPath = Path.IsPathRooted(dbPath);
var dbDir = isAbsoluteDbPath ? Path.GetDirectoryName(dbPath) : AppContext.BaseDirectory;
if (!isAbsoluteDbPath)
{
    dbPath = Path.Combine(AppContext.BaseDirectory, dbPath);
}

var userDbPath = Environment.GetEnvironmentVariable("USER_POLLS_DATABASE_PATH");
if (string.IsNullOrEmpty(userDbPath))
{
    userDbPath = Path.Combine(dbDir ?? AppContext.BaseDirectory, "userpolls.db");
}
else if (!Path.IsPathRooted(userDbPath))
{
    userDbPath = Path.Combine(AppContext.BaseDirectory, userDbPath);
}

// Get database connection string if configured (DefaultConnection or DATABASE_CONNECTION_STRING)
var envConnection = Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING")
                    ?? Environment.GetEnvironmentVariable("DefaultConnection")
                    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

var isRender = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("RENDER"));
var connectionString = envConnection;

if (string.IsNullOrEmpty(connectionString) && !isRender)
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
}

// Clean up if it's pointing to localhost/127.0.0.1 on Render (since localhost has no SQL Server running in the container)
if (isRender && !string.IsNullOrEmpty(connectionString) && 
    (connectionString.Contains("localhost", StringComparison.OrdinalIgnoreCase) || 
     connectionString.Contains("127.0.0.1")))
{
    connectionString = null;
}

var envUserConnection = Environment.GetEnvironmentVariable("USER_POLLS_DATABASE_CONNECTION_STRING")
                        ?? Environment.GetEnvironmentVariable("UserPollsConnection")
                        ?? Environment.GetEnvironmentVariable("ConnectionStrings__UserPollsConnection");

var userPollsConnectionString = envUserConnection;
if (string.IsNullOrEmpty(userPollsConnectionString) && !isRender)
{
    userPollsConnectionString = builder.Configuration.GetConnectionString("UserPollsConnection");
}

if (isRender && !string.IsNullOrEmpty(userPollsConnectionString) && 
    (userPollsConnectionString.Contains("localhost", StringComparison.OrdinalIgnoreCase) || 
     userPollsConnectionString.Contains("127.0.0.1")))
{
    userPollsConnectionString = null;
}

if (string.IsNullOrEmpty(userPollsConnectionString))
{
    userPollsConnectionString = connectionString; // Fallback to DefaultConnection if not specified
}

if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<WorldNewsDbContext>(options =>
    {
        options.UseSqlServer(connectionString);
    });

    builder.Services.AddDbContext<UserPollsDbContext>(options =>
    {
        options.UseSqlServer(userPollsConnectionString);
    });
}
else
{
    // Add DbContext - using SQLite for development
    builder.Services.AddDbContext<WorldNewsDbContext>(options =>
    {
        options.UseSqlite($"Data Source={dbPath}");
    });

    builder.Services.AddDbContext<UserPollsDbContext>(options =>
    {
        options.UseSqlite($"Data Source={userDbPath}");
    });
}

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allow any origin (Vercel, Localhost, GitHub Pages, custom domains)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add HttpClient for external API calls (needed for RSSController)
builder.Services.AddHttpClient();
builder.Services.AddHttpClient("NewsApiClient", client =>
{
    client.DefaultRequestHeaders.UserAgent.ParseAdd("WorldNewzApp/1.0 (+https://worldnewz.local)");
});
builder.Services.AddHttpClient<INewsApiService, NewsApiService>(client =>
{
    client.DefaultRequestHeaders.UserAgent.ParseAdd("WorldNewzApp/1.0 (+https://worldnewz.local)");
});

// ✅ Add MemoryCache (needed for RSSController caching)
builder.Services.AddMemoryCache();

// Enrichment Service
builder.Services.AddScoped<INewsEnrichmentService, NewsEnrichmentService>();

// Existing services
builder.Services.AddScoped<NewsService>();
builder.Services.AddHttpClient<WeatherService>();
builder.Services.AddScoped<SeoKeywordService>();
builder.Services.AddHttpClient<FacebookService>();
builder.Services.AddSingleton<IFacebookPostQueue, FacebookPostQueue>();
builder.Services.AddHostedService<FacebookWorkerService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHttpClient<MarketDataService>();

// Quartz Scheduler
builder.Services.AddQuartz(q =>
{
    q.UseMicrosoftDependencyInjectionJobFactory();

    var newsJobKey = new JobKey("NewsRefreshJob");
    q.AddJob<NewsRefreshJob>(opts => opts.WithIdentity(newsJobKey));
    q.AddTrigger(opts => opts
        .ForJob(newsJobKey)
        .WithIdentity("NewsRefreshJob-trigger")
        .WithSimpleSchedule(x => x.WithIntervalInHours(1).RepeatForever()));

    var keywordJobKey = new JobKey("DailyKeywordJob");
    q.AddJob<DailyKeywordJob>(opts => opts.WithIdentity(keywordJobKey));
    q.AddTrigger(opts => opts
        .ForJob(keywordJobKey)
        .WithIdentity("DailyKeywordJob-trigger")
        .WithCronSchedule("0 0 2 * * ?"));
});

builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ✅ Verify required environment variables at startup
var requiredEnvVars = new[] { "NEWS_API_KEY" };
var missingVars = new List<string>();

foreach (var envVar in requiredEnvVars)
{
    var value = Environment.GetEnvironmentVariable(envVar);
    if (string.IsNullOrEmpty(value))
    {
        missingVars.Add(envVar);
    }
    else
    {
        Console.WriteLine($"✓ {envVar} loaded: {value.Substring(0, Math.Min(5, value.Length))}...");
    }
}

if (missingVars.Count > 0)
{
    var message = $"Missing required environment variables: {string.Join(", ", missingVars)}. Please set them in your Render environment.";
    Console.WriteLine($"❌ ERROR: {message}");
    throw new InvalidOperationException(message);
}

if (!string.IsNullOrEmpty(connectionString))
{
    Console.WriteLine("✓ Database: SQL Server");
}
else
{
    Console.WriteLine($"✓ Database: SQLite ({dbPath})");
}
Console.WriteLine($"✓ CORS Origins: Allowed for ALL (Vercel, Localhost, etc.)");
Console.WriteLine($"✓ Environment: {builder.Environment.EnvironmentName}");

// Ensure database is created and schema is up to date
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WorldNewsDbContext>();
    db.Database.EnsureCreated();

    var userDb = scope.ServiceProvider.GetRequiredService<UserPollsDbContext>();
    userDb.Database.EnsureCreated();

    if (db.Database.IsSqlite())
    {
        // Ensure EnrichedArticles table exists
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS EnrichedArticles (
                Url TEXT PRIMARY KEY,
                Headline TEXT NOT NULL,
                Summary TEXT NOT NULL,
                Context TEXT NOT NULL,
                SocialMediaHook TEXT NOT NULL,
                Verified INTEGER NOT NULL,
                EnrichedAt TEXT NOT NULL
            );
        ");

        // Ensure FacebookPageSettings table exists
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS FacebookPageSettings (
                PageId TEXT PRIMARY KEY,
                PageName TEXT NOT NULL,
                AccessToken TEXT NOT NULL,
                IsActive INTEGER NOT NULL,
                LastPostTime TEXT
            );
        ");

        // Ensure Polls table exists
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS Polls (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Question TEXT NOT NULL,
                Description TEXT NOT NULL,
                CreatedAt TEXT NOT NULL
            );
        ");

        // Ensure PollOptions table exists
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS PollOptions (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                PollId INTEGER NOT NULL,
                OptionText TEXT NOT NULL,
                Votes INTEGER NOT NULL DEFAULT 0,
                IsCorrect INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (PollId) REFERENCES Polls(Id) ON DELETE CASCADE
            );
        ");

        try
        {
            db.Database.ExecuteSqlRaw("ALTER TABLE PollOptions ADD COLUMN IsCorrect INTEGER NOT NULL DEFAULT 0;");
        }
        catch { /* Column already exists */ }

        // Ensure PollSubmissions table exists in userDb database
        userDb.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS PollSubmissions (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                Email TEXT NOT NULL,
                Percentage REAL NOT NULL,
                Status TEXT NOT NULL,
                SubmittedAt TEXT NOT NULL
            );
        ");

        // Ensure SQLite database indexes exist for news queries & sitemaps optimization
        db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_NewsArticles_PublishedAt ON NewsArticles (PublishedAt);");
        db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_NewsArticles_CategoryId ON NewsArticles (CategoryId);");
        db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_NewsArticles_Url ON NewsArticles (Url);");
    }

    // Seed default categories
    var requiredCategories = new[] { "Discover", "Sports", "Money", "Weather", "Shopping", "Services", "Gaming", "Cartoons" };
    foreach (var catName in requiredCategories)
    {
        if (!db.Categories.Any(c => c.Name.ToLower() == catName.ToLower()))
        {
            db.Categories.Add(new WorldNewzWebAPI.Models.Category { Name = catName });
        }
    }
    db.SaveChanges();

    // Seed default polls
    if (db.Polls.Count() < 10 || !db.PollOptions.Any(o => o.IsCorrect))
    {
        // Clear existing polls and options if they don't have IsCorrect flagged or are outdated
        if (db.Polls.Any())
        {
            try
            {
                db.Polls.RemoveRange(db.Polls);
                db.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Could not clear old polls: {ex.Message}");
            }
        }

        var polls = new List<WorldNewzWebAPI.Models.Poll>
        {
            new WorldNewzWebAPI.Models.Poll
            {
                Question = "How will Artificial Intelligence impact your career in the next 5 years?",
                Description = "A poll tracking general public sentiment regarding automated systems and career displacement/enhancement.",
                CreatedAt = DateTime.UtcNow.AddDays(-9),
                Options = new List<WorldNewzWebAPI.Models.PollOption>
                {
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Very Positively", Votes = 245, IsCorrect = true },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Somewhat Positively", Votes = 312, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Neutral / No Impact", Votes = 98, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Negatively / Risk of Layoff", Votes = 156, IsCorrect = false }
                }
            },
            new WorldNewzWebAPI.Models.Poll
            {
                Question = "What is your primary source of daily technology news?",
                Description = "Identifying news distribution preference among modern readers.",
                CreatedAt = DateTime.UtcNow.AddDays(-8),
                Options = new List<WorldNewzWebAPI.Models.PollOption>
                {
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Social Media Platforms (Twitter, Reddit)", Votes = 189, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Dedicated News Sites (WorldNewzs, BBC)", Votes = 224, IsCorrect = true },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Email Newsletters", Votes = 87, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Video Tech Creators", Votes = 143, IsCorrect = false }
                }
            },
            new WorldNewzWebAPI.Models.Poll
            {
                Question = "Which cricket format do you prefer watching the most?",
                Description = "Sports preference tracking for regional news targeting.",
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                Options = new List<WorldNewzWebAPI.Models.PollOption>
                {
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Test Cricket (Traditional)", Votes = 112, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "One Day Internationals (ODI)", Votes = 95, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "T20 Internationals", Votes = 342, IsCorrect = true },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "IPL / Domestic Franchise Leagues", Votes = 489, IsCorrect = false }
                }
            },
            new WorldNewzWebAPI.Models.Poll
            {
                Question = "What is the most critical factor for successful remote team collaboration?",
                Description = "Corporate and industry development survey on workplace methods.",
                CreatedAt = DateTime.UtcNow.AddDays(-6),
                Options = new List<WorldNewzWebAPI.Models.PollOption>
                {
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Clear Communication Protocols", Votes = 190, IsCorrect = true },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Robust Project Management Tools", Votes = 120, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Flexible Working Hours", Votes = 75, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Regular Virtual Meetings", Votes = 60, IsCorrect = false }
                }
            },
            new WorldNewzWebAPI.Models.Poll
            {
                Question = "Which renewable energy source has the highest potential for global adoption?",
                Description = "Environmental and science survey tracking sustainable energy preference.",
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                Options = new List<WorldNewzWebAPI.Models.PollOption>
                {
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Solar Power", Votes = 420, IsCorrect = true },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Wind Energy", Votes = 280, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Hydroelectric Energy", Votes = 150, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Geothermal Energy", Votes = 85, IsCorrect = false }
                }
            },
            new WorldNewzWebAPI.Models.Poll
            {
                Question = "What is the best way to improve cybersecurity awareness in an organization?",
                Description = "Assessing IT security posture and training effectiveness in businesses.",
                CreatedAt = DateTime.UtcNow.AddDays(-4),
                Options = new List<WorldNewzWebAPI.Models.PollOption>
                {
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Regular Training and Simulations", Votes = 310, IsCorrect = true },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Strict IT Security Policies", Votes = 145, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Advanced Threat Detection Systems", Votes = 98, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Encrypted Communication Tools", Votes = 55, IsCorrect = false }
                }
            },
            new WorldNewzWebAPI.Models.Poll
            {
                Question = "Which platform do you prefer for professional networking?",
                Description = "Career navigation and digital networking preference research.",
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                Options = new List<WorldNewzWebAPI.Models.PollOption>
                {
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "LinkedIn", Votes = 520, IsCorrect = true },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "GitHub", Votes = 160, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Twitter/X", Votes = 110, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Dedicated Slack Communities", Votes = 95, IsCorrect = false }
                }
            },
            new WorldNewzWebAPI.Models.Poll
            {
                Question = "What is the primary benefit of deploying applications to the cloud?",
                Description = "Tracking software engineering infrastructure trends.",
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                Options = new List<WorldNewzWebAPI.Models.PollOption>
                {
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Scalability and Flexibility", Votes = 340, IsCorrect = true },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Reduced Maintenance Costs", Votes = 210, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Enhanced Built-in Security", Votes = 125, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Simplified Version Control", Votes = 45, IsCorrect = false }
                }
            },
            new WorldNewzWebAPI.Models.Poll
            {
                Question = "Which programming paradigm do you use most frequently?",
                Description = "Assessing developer preferences and methodology.",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                Options = new List<WorldNewzWebAPI.Models.PollOption>
                {
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Object-Oriented Programming", Votes = 450, IsCorrect = true },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Functional Programming", Votes = 180, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Procedural Programming", Votes = 65, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Event-Driven Programming", Votes = 135, IsCorrect = false }
                }
            },
            new WorldNewzWebAPI.Models.Poll
            {
                Question = "What is the main advantage of Agile project management over Waterfall?",
                Description = "Software project lifecycle management preference survey.",
                CreatedAt = DateTime.UtcNow,
                Options = new List<WorldNewzWebAPI.Models.PollOption>
                {
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Adaptability to Changing Requirements", Votes = 380, IsCorrect = true },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Predictable Project Timelines", Votes = 95, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Fixed Budget Constraints", Votes = 60, IsCorrect = false },
                    new WorldNewzWebAPI.Models.PollOption { OptionText = "Comprehensive Initial Documentation", Votes = 45, IsCorrect = false }
                }
            }
        };
        db.Polls.AddRange(polls);
        db.SaveChanges();
        Console.WriteLine("✓ Seeded 10 default polls to database with correct answers");
    }

    // Seed default Ad slots if table is empty
    if (!db.Ads.Any())
    {
        db.Ads.AddRange(
            new WorldNewzWebAPI.Models.Ad
            {
                AdType = "responsive",
                Placement = "between-articles",
                Script = "<ins class=\"adsbygoogle\" style=\"display:block\" data-ad-client=\"ca-pub-7547748414764075\" data-ad-slot=\"7829102931\" data-ad-format=\"auto\" data-ad-full-width-responsive=\"true\"></ins>"
            },
            new WorldNewzWebAPI.Models.Ad
            {
                AdType = "responsive",
                Placement = "sidebar",
                Script = "<ins class=\"adsbygoogle\" style=\"display:block\" data-ad-client=\"ca-pub-7547748414764075\" data-ad-slot=\"1829302910\" data-ad-format=\"auto\" data-ad-full-width-responsive=\"true\"></ins>"
            }
        );
        db.SaveChanges();
        Console.WriteLine("✓ Seeded default AdSense slots to database");
    }
}

// Bind to Render's dynamic port
var port = Environment.GetEnvironmentVariable("PORT") ?? "5005";
app.Urls.Add($"http://*:{port}");

// ✅ CORS MUST be first
app.UseCors("AllowFrontend");
app.UseResponseCompression();

// Cache-Control middleware for HTTP GET requests
app.Use(async (context, next) =>
{
    if (HttpMethods.IsGet(context.Request.Method))
    {
        var path = context.Request.Path.Value ?? "";
        if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
        {
            if (path.Contains("polls", StringComparison.OrdinalIgnoreCase) || 
                path.Contains("facebooksettings", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
                context.Response.Headers["Pragma"] = "no-cache";
                context.Response.Headers["Expires"] = "0";
            }
            else if (!path.Contains("swagger", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.Headers["Cache-Control"] = "public,max-age=600";
            }
        }
    }
    await next();
});

// ETag middleware for HTTP GET requests
app.Use(async (context, next) =>
{
    if (context.Request.Method != HttpMethods.Get)
    {
        await next();
        return;
    }

    var originalBodyStream = context.Response.Body;
    using var memoryStream = new MemoryStream();
    context.Response.Body = memoryStream;

    await next();

    if (context.Response.StatusCode == StatusCodes.Status200OK && memoryStream.Length > 0)
    {
        memoryStream.Position = 0;
        using var md5 = System.Security.Cryptography.MD5.Create();
        var hash = md5.ComputeHash(memoryStream);
        var etag = $"\"{Convert.ToBase64String(hash)}\"";

        context.Response.Headers.ETag = etag;

        if (context.Request.Headers.TryGetValue("If-None-Match", out var ifNoneMatch) && ifNoneMatch == etag)
        {
            context.Response.StatusCode = StatusCodes.Status304NotModified;
            context.Response.ContentLength = 0;
            return;
        }
    }

    memoryStream.Position = 0;
    await memoryStream.CopyToAsync(originalBodyStream);
});

// Add security headers middleware
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    await next();
});

// Global exception handling middleware
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Exception: {ex.GetType().Name} - {ex.Message}");
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { error = "An unexpected error occurred", details = ex.Message });
    }
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Worldnewz API v1");
        c.RoutePrefix = string.Empty;
    });
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Worldnewz API v1");
    });
}

app.UseAuthorization();
app.MapControllers();

// Root route for Render
app.MapGet("/", () => "WorldNewz API is running. Use /api/... endpoints.");

// Health check route
app.MapGet("/health", () => Results.Ok("API is running"));

app.Run();
