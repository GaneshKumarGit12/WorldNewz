using Microsoft.EntityFrameworkCore;
using Quartz;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Services;
using WorldNewzWebAPI.Jobs;
using System.IO.Compression;
using Microsoft.AspNetCore.ResponseCompression;

namespace WorldNewzWebAPI.Extensions
{
    public static class ServiceExtensions
    {
        private static string ParsePostgresUrl(string url)
        {
            if (string.IsNullOrEmpty(url) || (!url.StartsWith("postgres://") && !url.StartsWith("postgresql://")))
            {
                return url;
            }

            try
            {
                string scheme = url.StartsWith("postgres://") ? "postgres://" : "postgresql://";
                string remainder = url.Substring(scheme.Length);

                int lastAt = remainder.LastIndexOf('@');
                if (lastAt == -1)
                {
                    return url;
                }

                string userInfoPart = remainder.Substring(0, lastAt);
                string hostDbPart = remainder.Substring(lastAt + 1);

                int firstColon = userInfoPart.IndexOf(':');
                string username = firstColon == -1 ? userInfoPart : userInfoPart.Substring(0, firstColon);
                string password = firstColon == -1 ? "" : userInfoPart.Substring(firstColon + 1);

                int firstSlash = hostDbPart.IndexOf('/');
                string hostPort = firstSlash == -1 ? hostDbPart : hostDbPart.Substring(0, firstSlash);
                string database = firstSlash == -1 ? "" : hostDbPart.Substring(firstSlash + 1);

                int questionMark = database.IndexOf('?');
                if (questionMark != -1)
                {
                    database = database.Substring(0, questionMark);
                }

                int lastColonInHost = hostPort.LastIndexOf(':');
                string host = lastColonInHost == -1 ? hostPort : hostPort.Substring(0, lastColonInHost);
                string portStr = lastColonInHost == -1 ? "5432" : hostPort.Substring(lastColonInHost + 1);

                return $"Host={host};Port={portStr};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error parsing PostgreSQL URL: {ex.Message}");
                return url;
            }
        }

        public static void AddAppDatabases(this IServiceCollection services, IConfiguration configuration)
        {
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

            var envConnection = Environment.GetEnvironmentVariable("DATABASE_URL")
                                ?? Environment.GetEnvironmentVariable("DataBase_URL")
                                ?? Environment.GetEnvironmentVariable("database_url")
                                ?? Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING")
                                ?? Environment.GetEnvironmentVariable("DefaultConnection")
                                ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

            var isRender = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("RENDER"));
            var connectionString = envConnection;

            if (string.IsNullOrEmpty(connectionString) && !isRender)
            {
                connectionString = configuration.GetConnectionString("DefaultConnection");
            }

            if (!string.IsNullOrEmpty(connectionString) && (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://")))
            {
                connectionString = ParsePostgresUrl(connectionString);
            }

            if (isRender && !string.IsNullOrEmpty(connectionString) && 
                (connectionString.Contains("localhost", StringComparison.OrdinalIgnoreCase) || 
                 connectionString.Contains("127.0.0.1")))
            {
                connectionString = null;
            }

            var envUserConnection = Environment.GetEnvironmentVariable("USER_POLLS_DATABASE_URL")
                                    ?? Environment.GetEnvironmentVariable("UserPollsDataBase_URL")
                                    ?? Environment.GetEnvironmentVariable("user_polls_database_url")
                                    ?? Environment.GetEnvironmentVariable("USER_POLLS_DATABASE_CONNECTION_STRING")
                                    ?? Environment.GetEnvironmentVariable("UserPollsConnection")
                                    ?? Environment.GetEnvironmentVariable("ConnectionStrings__UserPollsConnection");

            var userPollsConnectionString = envUserConnection;
            if (string.IsNullOrEmpty(userPollsConnectionString) && !isRender)
            {
                userPollsConnectionString = configuration.GetConnectionString("UserPollsConnection");
            }

            if (!string.IsNullOrEmpty(userPollsConnectionString) && (userPollsConnectionString.StartsWith("postgres://") || userPollsConnectionString.StartsWith("postgresql://")))
            {
                userPollsConnectionString = ParsePostgresUrl(userPollsConnectionString);
            }

            if (isRender && !string.IsNullOrEmpty(userPollsConnectionString) && 
                (userPollsConnectionString.Contains("localhost", StringComparison.OrdinalIgnoreCase) || 
                 userPollsConnectionString.Contains("127.0.0.1")))
            {
                userPollsConnectionString = null;
            }

            if (string.IsNullOrEmpty(userPollsConnectionString))
            {
                userPollsConnectionString = connectionString;
            }

            if (!string.IsNullOrEmpty(connectionString))
            {
                if (connectionString.Contains("Host=") || connectionString.Contains("Port="))
                {
                    var hostMatch = System.Text.RegularExpressions.Regex.Match(connectionString, @"Host=([^;]+)");
                    var dbMatch = System.Text.RegularExpressions.Regex.Match(connectionString, @"Database=([^;]+)");
                    var hostName = hostMatch.Success ? hostMatch.Groups[1].Value : "Unknown";
                    var dbName = dbMatch.Success ? dbMatch.Groups[1].Value : "Unknown";

                    Console.WriteLine($"✓ Database: PostgreSQL (Host: {hostName}, Database: {dbName})");
                    services.AddDbContext<WorldNewsDbContext>(options => options.UseNpgsql(connectionString));
                    services.AddDbContext<UserPollsDbContext>(options => options.UseNpgsql(userPollsConnectionString));
                }
                else
                {
                    Console.WriteLine("✓ Database: SQL Server");
                    services.AddDbContext<WorldNewsDbContext>(options => options.UseSqlServer(connectionString));
                    services.AddDbContext<UserPollsDbContext>(options => options.UseSqlServer(userPollsConnectionString));
                }
            }
            else
            {
                Console.WriteLine($"✓ Database: SQLite ({dbPath})");
                services.AddDbContext<WorldNewsDbContext>(options => options.UseSqlite($"Data Source={dbPath}"));
                services.AddDbContext<UserPollsDbContext>(options => options.UseSqlite($"Data Source={userDbPath}"));
            }
        }

        public static void AddAppServices(this IServiceCollection services)
        {
            // Memory Cache
            services.AddMemoryCache();

            // Scoped Services
            services.AddScoped<INewsEnrichmentService, NewsEnrichmentService>();
            services.AddScoped<ITextRefinementService, TextRefinementService>();
            services.AddScoped<NewsService>();
            services.AddScoped<AmazonProductService>();
            services.AddScoped<SeoKeywordService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IGoogleSearchService, GoogleSearchService>();
            services.AddScoped<IPlayGamesService, PlayGamesService>();

            // Singletons
            services.AddSingleton<IFacebookPostQueue, FacebookPostQueue>();
            services.AddSingleton<SitemapPingService>();

            // Hosted Services
            services.AddHostedService<FacebookWorkerService>();
            services.AddHostedService<AmazonTokenBackgroundRefreshService>();

            // Http Clients
            services.AddHttpClient();
            services.AddHttpClient<AmazonCreatorApiService>(client =>
            {
                client.DefaultRequestHeaders.UserAgent.ParseAdd("WorldNewzApp/1.0 (+https://worldnewzs.in)");
            });
            services.AddHttpClient("NewsApiClient", client =>
            {
                client.DefaultRequestHeaders.UserAgent.ParseAdd("WorldNewzApp/1.0 (+https://worldnewzs.in)");
            });
            services.AddHttpClient<INewsApiService, NewsApiService>(client =>
            {
                client.DefaultRequestHeaders.UserAgent.ParseAdd("WorldNewzApp/1.0 (+https://worldnewz.local)");
            });
            services.AddHttpClient<IGNewsService, GNewsService>(client =>
            {
                client.DefaultRequestHeaders.UserAgent.ParseAdd("WorldNewzApp/1.0 (+https://worldnewz.local)");
            });
            services.AddHttpClient<ShortVideoService>();
            services.AddHttpClient<WeatherService>();
            services.AddHttpClient<FacebookService>();
            services.AddHttpClient<MarketDataService>();

            services.AddHttpClient<IFreeToGameService, FreeToGameService>(client =>
            {
                client.BaseAddress = new Uri("https://www.freetogame.com/api/");
                client.DefaultRequestHeaders.UserAgent.ParseAdd("WorldNewzApp/1.0 (+https://worldnewz.local)");
            });

            services.AddHttpClient<IMovieDbService, MovieDbService>(client =>
            {
                client.BaseAddress = new Uri("https://api.themoviedb.org/3/");
                client.DefaultRequestHeaders.UserAgent.ParseAdd("WorldNewzApp/1.0 (+https://worldnewz.local)");
            });

            services.AddHttpClient<ISpoonacularService, SpoonacularService>(client =>
            {
                client.BaseAddress = new Uri("https://api.spoonacular.com/");
                client.DefaultRequestHeaders.UserAgent.ParseAdd("WorldNewzApp/1.0 (+https://worldnewz.local)");
            });
        }

        public static void AddAppQuartz(this IServiceCollection services)
        {
            services.AddQuartz(q =>
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

                var amazonJobKey = new JobKey("AmazonProductRefreshJob");
                q.AddJob<AmazonProductRefreshJob>(opts => opts.WithIdentity(amazonJobKey));
                q.AddTrigger(opts => opts
                    .ForJob(amazonJobKey)
                    .WithIdentity("AmazonProductRefreshJob-trigger")
                    .WithCronSchedule("0 30 2 * * ?"));
            });

            services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);
        }

        public static void AddAppCompressionAndSecurity(this IServiceCollection services)
        {
            services.AddResponseCompression(options =>
            {
                options.EnableForHttps = true;
                options.Providers.Add<BrotliCompressionProvider>();
                options.Providers.Add<GzipCompressionProvider>();
            });

            services.Configure<BrotliCompressionProviderOptions>(options =>
            {
                options.Level = CompressionLevel.Fastest;
            });

            services.AddHsts(options =>
            {
                options.Preload = true;
                options.IncludeSubDomains = true;
                options.MaxAge = TimeSpan.FromDays(365);
            });
        }
    }
}
