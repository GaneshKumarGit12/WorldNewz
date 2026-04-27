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

// Get CORS allowed origins from environment or default
var corsOrigins = (Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")
                   ?? "http://localhost:5173,http://localhost:5174")
    .Split(',', StringSplitOptions.RemoveEmptyEntries)
    .Select(o => o.Trim())
    .ToArray();

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add HttpClient for external API calls
builder.Services.AddHttpClient();
builder.Services.AddHttpClient("NewsApiClient", client =>
{
    client.DefaultRequestHeaders.UserAgent.ParseAdd("WorldNewzApp/1.0 (+https://worldnewz.local)");
});
builder.Services.AddHttpClient<INewsApiService, NewsApiService>(client =>
{
    client.DefaultRequestHeaders.UserAgent.ParseAdd("WorldNewzApp/1.0 (+https://worldnewz.local)");
});

builder.Services.AddMemoryCache();
builder.Services.AddScoped<NewsService>();
builder.Services.AddHttpClient<WeatherService>();

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
Console.WriteLine($"✓ CORS Origins: {string.Join(", ", corsOrigins)}");
Console.WriteLine($"✓ Environment: {builder.Environment.EnvironmentName}");

// Bind to Render's dynamic port
var port = Environment.GetEnvironmentVariable("PORT") ?? "5005";
app.Urls.Add($"http://*:{port}");

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
}

app.UseCors("AllowFrontend");

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Worldnewz API v1");
});

app.UseAuthorization();
app.MapControllers();

// Root route for Render
app.MapGet("/", () => "WorldNewz API is running. Use /api/... endpoints.");

// Health check route
app.MapGet("/health", () => Results.Ok("API is running"));

app.Run();