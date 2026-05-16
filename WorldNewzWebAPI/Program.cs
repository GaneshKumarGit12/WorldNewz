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
dbPath = Path.Combine(AppContext.BaseDirectory, dbPath);

// Add DbContext - using SQLite for development
builder.Services.AddDbContext<WorldNewsDbContext>(options =>
{
    options.UseSqlite($"Data Source={dbPath}");
});

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allow any origin (Vercel, Localhost, etc.)
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

// Existing services
builder.Services.AddScoped<NewsService>();
builder.Services.AddHttpClient<WeatherService>();
builder.Services.AddScoped<SeoKeywordService>();

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

Console.WriteLine($"✓ Database: {dbPath}");
Console.WriteLine($"✓ CORS Origins: Allowed for ALL (Vercel, Localhost, etc.)");
Console.WriteLine($"✓ Environment: {builder.Environment.EnvironmentName}");

// Ensure database is created and schema is up to date
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WorldNewsDbContext>();
    db.Database.EnsureCreated();
}

// Bind to Render's dynamic port
var port = Environment.GetEnvironmentVariable("PORT") ?? "5005";
app.Urls.Add($"http://*:{port}");

// ✅ CORS MUST be first
app.UseCors("AllowFrontend");

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
