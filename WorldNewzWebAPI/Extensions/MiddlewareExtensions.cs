using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;
using System.Text.Json;

namespace WorldNewzWebAPI.Extensions
{
    public static class MiddlewareExtensions
    {
        public static IApplicationBuilder UseAppSecurityHeaders(this IApplicationBuilder app)
        {
            return app.Use(async (context, next) =>
            {
                context.Response.Headers["X-Content-Type-Options"] = "nosniff";
                context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
                context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
                context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
                context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";
                context.Response.Headers["Cross-Origin-Opener-Policy"] = "unsafe-none";
                await next();
            });
        }

        public static IApplicationBuilder UseAppCacheControl(this IApplicationBuilder app)
        {
            return app.Use(async (context, next) =>
            {
                if (HttpMethods.IsGet(context.Request.Method))
                {
                    var path = context.Request.Path.Value ?? "";
                    if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
                    {
                        if (path.Contains("polls", StringComparison.OrdinalIgnoreCase) || 
                            path.Contains("facebooksettings", StringComparison.OrdinalIgnoreCase) ||
                            path.Contains("amazonproducts", StringComparison.OrdinalIgnoreCase))
                        {
                            context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
                            context.Response.Headers["Pragma"] = "no-cache";
                            context.Response.Headers["Expires"] = "0";
                        }
                        else if (!path.Contains("swagger", StringComparison.OrdinalIgnoreCase))
                        {
                            context.Response.Headers["Cache-Control"] = "public, max-age=300, s-maxage=600, stale-while-revalidate=60";
                        }
                    }
                }
                await next();
            });
        }

        public static IApplicationBuilder UseAppOptimizedETag(this IApplicationBuilder app)
        {
            return app.Use(async (context, next) =>
            {
                // Only process GET requests
                if (context.Request.Method != HttpMethods.Get)
                {
                    await next();
                    return;
                }

                // Skip ETag if request is for swagger or SignalR hubs
                var path = context.Request.Path.Value ?? "";
                if (path.Contains("swagger", StringComparison.OrdinalIgnoreCase) || 
                    path.Contains("/hubs/", StringComparison.OrdinalIgnoreCase))
                {
                    await next();
                    return;
                }

                var originalBodyStream = context.Response.Body;
                using var memoryStream = new MemoryStream();
                context.Response.Body = memoryStream;

                try
                {
                    await next();

                    // Skip ETag generation for large responses (>1MB) to prevent memory pressure
                    if (context.Response.StatusCode == StatusCodes.Status200OK && 
                        memoryStream.Length > 0 && 
                        memoryStream.Length < 1024 * 1024)
                    {
                        memoryStream.Position = 0;
                        using var md5 = MD5.Create();
                        var hash = md5.ComputeHash(memoryStream);
                        var etag = $"\"{Convert.ToBase64String(hash)}\"";

                        context.Response.Headers.ETag = etag;

                        if (context.Request.Headers.TryGetValue("If-None-Match", out var ifNoneMatch) && ifNoneMatch == etag)
                        {
                            context.Response.StatusCode = StatusCodes.Status304NotModified;
                            context.Response.ContentLength = 0;
                            return; // Done, body remains empty
                        }
                    }

                    // Copy buffered body back to the original response stream
                    memoryStream.Position = 0;
                    await memoryStream.CopyToAsync(originalBodyStream);
                }
                finally
                {
                    context.Response.Body = originalBodyStream;
                }
            });
        }

        public static IApplicationBuilder UseAppExceptionHandler(this IApplicationBuilder app, IWebHostEnvironment env)
        {
            return app.Use(async (context, next) =>
            {
                try
                {
                    await next();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Exception: {ex.GetType().Name} - {ex.Message}");
                    
                    if (context.Request.Headers.TryGetValue("Origin", out var originValues) && originValues.Count > 0)
                    {
                        context.Response.Headers["Access-Control-Allow-Origin"] = originValues[0];
                        context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
                    }
                    else
                    {
                        context.Response.Headers["Access-Control-Allow-Origin"] = "*";
                    }

                    context.Response.ContentType = "application/json";
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;

                    var response = new Dictionary<string, string>
                    {
                        { "error", "An unexpected error occurred on the server." }
                    };

                    // Hide stack details in production environments
                    if (env.IsDevelopment())
                    {
                        response.Add("details", ex.Message);
                        response.Add("stackTrace", ex.StackTrace ?? "");
                    }

                    await context.Response.WriteAsync(JsonSerializer.Serialize(response));
                }
            });
        }
    }
}
