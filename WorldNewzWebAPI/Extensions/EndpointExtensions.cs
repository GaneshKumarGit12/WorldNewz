using WorldNewzWebAPI.Hubs;

namespace WorldNewzWebAPI.Extensions
{
    public static class EndpointExtensions
    {
        public static void MapAppEndpoints(this WebApplication app)
        {
            app.MapControllers();
            app.MapHub<LeaderboardHub>("/hubs/leaderboard");

            // Root route for Render
            app.MapGet("/", () => "WorldNewz API is running. Use /api/... endpoints.");

            // Health check route
            app.MapGet("/health", () => Results.Ok("API is running"));
        }
    }
}
