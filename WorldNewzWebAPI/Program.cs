using DotNetEnv;
using WorldNewzWebAPI.Extensions;

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

// Verify required environment variables at startup
DatabaseExtensions.VerifyRequiredEnvVars();

// Configure Databases
builder.Services.AddAppDatabases(builder.Configuration);

// Add Application Services
builder.Services.AddAppServices();

// Add Quartz Scheduler
builder.Services.AddAppQuartz();

// Add Compression, Security headers, and HSTS
builder.Services.AddAppCompressionAndSecurity();

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

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

var app = builder.Build();

// Initialize database tables, verify schema alterations, and run seed data
app.InitializeDatabaseSchema();

// Bind to Render's dynamic port or local default
var port = Environment.GetEnvironmentVariable("PORT") ?? "5005";
app.Urls.Add($"http://*:{port}");

// CORS MUST be first, followed by compression
app.UseCors("AllowFrontend");
app.UseResponseCompression();

// Configure custom middleware pipeline
app.UseAppExceptionHandler(app.Environment);
app.UseAppSecurityHeaders();
app.UseAppOptimizedETag();
app.UseAppCacheControl();

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
    // app.UseHttpsRedirection(); // Disabled to prevent 307 preflight CORS redirect failures behind reverse proxy (Render load balancer terminates SSL)
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Worldnewz API v1");
    });
}

app.UseAuthorization();

// Map minimal routes, controllers, and SignalR hubs
app.MapAppEndpoints();

app.Run();
