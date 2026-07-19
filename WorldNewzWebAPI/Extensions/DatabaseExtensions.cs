using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;
using Microsoft.Extensions.Logging;

namespace WorldNewzWebAPI.Extensions
{
    public static class DatabaseExtensions
    {
        public static void VerifyRequiredEnvVars()
        {
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
                Console.WriteLine($"⚠️ WARNING: Missing required environment variables: {string.Join(", ", missingVars)}. The app will fall back to the free Saurav Tech NewsAPI mirror.");
            }
        }

        public static void InitializeDatabaseSchema(this IApplicationBuilder app)
        {
            using (var scope = app.ApplicationServices.CreateScope())
            {
                var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseExtensions");
                var db = scope.ServiceProvider.GetRequiredService<WorldNewsDbContext>();
                var userDb = scope.ServiceProvider.GetRequiredService<UserPollsDbContext>();

                try
                {
                    db.Database.EnsureCreated();
                    logger.LogInformation("✓ WorldNewsDbContext EnsureCreated completed.");

                    try
                    {
                        db.Database.ExecuteSqlRaw("ALTER TABLE \"EnrichedArticles\" ADD COLUMN \"RefinedImageUrl\" TEXT;");
                        logger.LogInformation("✓ Added RefinedImageUrl column to EnrichedArticles table.");
                    }
                    catch (Exception)
                    {
                        // Column already exists, ignore
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "❌ WorldNewsDbContext EnsureCreated failed.");
                }

                try
                {
                    userDb.Database.EnsureCreated();
                    logger.LogInformation("✓ UserPollsDbContext EnsureCreated completed.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "❌ UserPollsDbContext EnsureCreated failed.");
                }

                // Verify and create tables for PostgreSQL if provider matches
                try
                {
                    if (db.Database.ProviderName != null && db.Database.ProviderName.Contains("PostgreSQL"))
                    {
                        logger.LogInformation("✓ Running PostgreSQL table creation verification...");
                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""Polls"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""Question"" TEXT NOT NULL,
                                ""Description"" TEXT NOT NULL,
                                ""CreatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL
                            );
                        ", "Polls", logger);

                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""PollOptions"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""PollId"" INTEGER NOT NULL,
                                ""OptionText"" TEXT NOT NULL,
                                ""Votes"" INTEGER NOT NULL DEFAULT 0,
                                ""IsCorrect"" BOOLEAN NOT NULL DEFAULT FALSE,
                                CONSTRAINT ""FK_PollOptions_Polls_PollId"" FOREIGN KEY (""PollId"") REFERENCES ""Polls"" (""Id"") ON DELETE CASCADE
                            );
                        ", "PollOptions", logger);

                        SafeExecuteSql(userDb, @"
                            CREATE TABLE IF NOT EXISTS ""PollSubmissions"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""Name"" TEXT NOT NULL,
                                ""Email"" TEXT NOT NULL,
                                ""Percentage"" DOUBLE PRECISION NOT NULL,
                                ""Status"" TEXT NOT NULL,
                                ""SubmittedAt"" TIMESTAMP WITH TIME ZONE NOT NULL
                            );
                        ", "PollSubmissions", logger);

                        SafeExecuteSql(userDb, @"
                            CREATE TABLE IF NOT EXISTS ""QuizSubmissions"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""Name"" TEXT NOT NULL,
                                ""Email"" TEXT NOT NULL,
                                ""Score"" INTEGER NOT NULL,
                                ""Coins"" INTEGER NOT NULL,
                                ""Percentage"" DOUBLE PRECISION NOT NULL,
                                ""Status"" TEXT NOT NULL,
                                ""SubmittedAt"" TIMESTAMP WITH TIME ZONE NOT NULL
                            );
                        ", "QuizSubmissions", logger);

                        SafeExecuteSql(userDb, @"
                            CREATE TABLE IF NOT EXISTS ""NewsletterSubscribers"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""Email"" TEXT NOT NULL UNIQUE,
                                ""Name"" TEXT NULL,
                                ""SubscriptionType"" TEXT NOT NULL,
                                ""SubscribedAt"" TIMESTAMP WITH TIME ZONE NOT NULL,
                                ""IsVerified"" BOOLEAN NOT NULL DEFAULT FALSE,
                                ""VerificationToken"" TEXT NULL
                            );
                        ", "NewsletterSubscribers", logger);

                        SafeExecuteSql(userDb, @"
                            CREATE TABLE IF NOT EXISTS ""Scores"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""Username"" TEXT NOT NULL,
                                ""Points"" INTEGER NOT NULL,
                                ""CreatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL
                            );
                        ", "Scores", logger);

                        try
                        {
                            userDb.Database.ExecuteSqlRaw(@"ALTER TABLE ""NewsletterSubscribers"" ADD COLUMN IF NOT EXISTS ""IsVerified"" BOOLEAN NOT NULL DEFAULT FALSE;");
                            userDb.Database.ExecuteSqlRaw(@"ALTER TABLE ""NewsletterSubscribers"" ADD COLUMN IF NOT EXISTS ""VerificationToken"" TEXT;");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"⚠️ Error altering PostgreSQL NewsletterSubscribers table: {ex.Message}");
                        }

                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""AmazonProducts"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""Asin"" TEXT NOT NULL,
                                ""Title"" TEXT NOT NULL,
                                ""Description"" TEXT NOT NULL,
                                ""ImageUrl"" TEXT NOT NULL,
                                ""Price"" NUMERIC NOT NULL,
                                ""OriginalPrice"" NUMERIC NOT NULL,
                                ""Rating"" DOUBLE PRECISION NOT NULL,
                                ""ReviewCount"" INTEGER NOT NULL,
                                ""Category"" TEXT NOT NULL,
                                ""ProductUrl"" TEXT NOT NULL,
                                ""LastUpdated"" TIMESTAMP WITH TIME ZONE NOT NULL
                            );
                        ", "AmazonProducts", logger);

                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""SeoKeywords"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""Category"" TEXT NOT NULL,
                                ""Primary"" TEXT NOT NULL,
                                ""Longtail"" TEXT NOT NULL,
                                ""Trending"" TEXT NOT NULL,
                                ""MetaDesc"" TEXT NOT NULL,
                                ""Date"" TIMESTAMP WITH TIME ZONE NOT NULL,
                                ""CreatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL
                            );
                        ", "SeoKeywords", logger);

                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""JobPostings"" (
                                ""Slug"" TEXT PRIMARY KEY,
                                ""CompanyName"" TEXT NOT NULL,
                                ""Title"" TEXT NOT NULL,
                                ""Description"" TEXT NOT NULL,
                                ""Remote"" BOOLEAN NOT NULL,
                                ""Url"" TEXT NOT NULL,
                                ""Tags"" TEXT NULL,
                                ""JobTypes"" TEXT NULL,
                                ""Location"" TEXT NOT NULL,
                                ""CreatedAt"" BIGINT NOT NULL,
                                ""IsLocal"" BOOLEAN NOT NULL DEFAULT FALSE
                            );
                        ", "JobPostings", logger);

                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""CabDrivers"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""Name"" TEXT NOT NULL,
                                ""VehicleType"" TEXT NOT NULL,
                                ""VehicleNumber"" TEXT NOT NULL,
                                ""Latitude"" DOUBLE PRECISION NOT NULL,
                                ""Longitude"" DOUBLE PRECISION NOT NULL,
                                ""IsAvailable"" BOOLEAN NOT NULL DEFAULT TRUE,
                                ""Rating"" DOUBLE PRECISION NOT NULL DEFAULT 4.5
                            );
                        ", "CabDrivers", logger);

                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""RideBookings"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""UserEmail"" TEXT NOT NULL,
                                ""PickupLocation"" TEXT NOT NULL,
                                ""Destination"" TEXT NOT NULL,
                                ""VehicleType"" TEXT NOT NULL,
                                ""Price"" DOUBLE PRECISION NOT NULL,
                                ""Status"" TEXT NOT NULL,
                                ""CreatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL,
                                ""ETA"" INTEGER NOT NULL,
                                ""MatchedDriverId"" INTEGER NULL,
                                ""DriverName"" TEXT NULL,
                                ""VehicleNumber"" TEXT NULL
                            );
                        ", "RideBookings", logger);

                        // PlayGames Tables
                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""PlayGamesPlayers"" (
                                ""Id"" TEXT PRIMARY KEY,
                                ""GoogleUserId"" TEXT NOT NULL,
                                ""DisplayName"" TEXT NOT NULL,
                                ""Email"" TEXT NOT NULL,
                                ""AvatarUrl"" TEXT NOT NULL,
                                ""Level"" INTEGER NOT NULL,
                                ""XpPoints"" BIGINT NOT NULL,
                                ""CreatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL,
                                ""LastLoginAt"" TIMESTAMP WITH TIME ZONE NOT NULL
                            );
                        ", "PlayGamesPlayers", logger);

                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""PlayGamesLeaderboards"" (
                                ""Id"" TEXT PRIMARY KEY,
                                ""Title"" TEXT NOT NULL,
                                ""GameCategory"" TEXT NOT NULL,
                                ""IconUrl"" TEXT NOT NULL,
                                ""SortOrder"" TEXT NOT NULL
                            );
                        ", "PlayGamesLeaderboards", logger);

                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""PlayGamesScores"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""LeaderboardId"" TEXT NOT NULL,
                                ""PlayerId"" TEXT NOT NULL,
                                ""PlayerName"" TEXT NOT NULL,
                                ""AvatarUrl"" TEXT NOT NULL,
                                ""ScoreValue"" BIGINT NOT NULL,
                                ""FormattedValue"" TEXT NOT NULL,
                                ""SubmittedAt"" TIMESTAMP WITH TIME ZONE NOT NULL
                            );
                        ", "PlayGamesScores", logger);

                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""PlayGamesAchievements"" (
                                ""Id"" TEXT PRIMARY KEY,
                                ""Title"" TEXT NOT NULL,
                                ""Description"" TEXT NOT NULL,
                                ""IconUrl"" TEXT NOT NULL,
                                ""UnlockedIconUrl"" TEXT NOT NULL,
                                ""Rarity"" TEXT NOT NULL,
                                ""TotalSteps"" INTEGER NOT NULL,
                                ""XpReward"" INTEGER NOT NULL
                            );
                        ", "PlayGamesAchievements", logger);

                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""PlayGamesPlayerAchievements"" (
                                ""Id"" SERIAL PRIMARY KEY,
                                ""PlayerId"" TEXT NOT NULL,
                                ""AchievementId"" TEXT NOT NULL,
                                ""CurrentSteps"" INTEGER NOT NULL,
                                ""IsUnlocked"" BOOLEAN NOT NULL,
                                ""UnlockedAt"" TIMESTAMP WITH TIME ZONE NULL
                            );
                        ", "PlayGamesPlayerAchievements", logger);

                        SafeExecuteSql(db, @"
                            CREATE TABLE IF NOT EXISTS ""PlayGamesSavedGames"" (
                                ""Id"" TEXT PRIMARY KEY,
                                ""PlayerId"" TEXT NOT NULL,
                                ""SaveName"" TEXT NOT NULL,
                                ""GameId"" TEXT NOT NULL,
                                ""DataJson"" TEXT NOT NULL,
                                ""CoverImageUrl"" TEXT NOT NULL,
                                ""LastModifiedAt"" TIMESTAMP WITH TIME ZONE NOT NULL
                            );
                        ", "PlayGamesSavedGames", logger);

                        logger.LogInformation("✓ PostgreSQL tables verified successfully.");
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "❌ PostgreSQL table creation verification failed.");
                }

                // Verify and create tables for SQLite if provider matches
                try
                {
                    if (db.Database.IsSqlite())
                    {
                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS EnrichedArticles (
                                Url TEXT PRIMARY KEY,
                                Headline TEXT NOT NULL,
                                Summary TEXT NOT NULL,
                                Context TEXT NOT NULL,
                                SocialMediaHook TEXT NOT NULL,
                                Verified INTEGER NOT NULL,
                                EnrichedAt TEXT NOT NULL,
                                FullContent TEXT NULL
                            );
                        ");

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS FacebookPageSettings (
                                PageId TEXT PRIMARY KEY,
                                PageName TEXT NOT NULL,
                                AccessToken TEXT NOT NULL,
                                IsActive INTEGER NOT NULL,
                                LastPostTime TEXT
                            );
                        ");

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS Polls (
                                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                Question TEXT NOT NULL,
                                Description TEXT NOT NULL,
                                CreatedAt TEXT NOT NULL
                            );
                        ");

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

                        try
                        {
                            db.Database.ExecuteSqlRaw("ALTER TABLE Polls ADD COLUMN Category TEXT NOT NULL DEFAULT 'General';");
                        }
                        catch { /* Column already exists */ }

                        try
                        {
                            db.Database.ExecuteSqlRaw("ALTER TABLE Polls ADD COLUMN Subcategory TEXT NOT NULL DEFAULT 'General';");
                        }
                        catch { /* Column already exists */ }

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

                        userDb.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS QuizSubmissions (
                                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                Name TEXT NOT NULL,
                                Email TEXT NOT NULL,
                                Score INTEGER NOT NULL,
                                Coins INTEGER NOT NULL,
                                Percentage REAL NOT NULL,
                                Status TEXT NOT NULL,
                                SubmittedAt TEXT NOT NULL
                            );
                        ");

                        userDb.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS NewsletterSubscribers (
                                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                Email TEXT NOT NULL UNIQUE,
                                Name TEXT NULL,
                                SubscriptionType TEXT NOT NULL,
                                SubscribedAt TEXT NOT NULL,
                                IsVerified INTEGER NOT NULL DEFAULT 0,
                                VerificationToken TEXT NULL
                            );
                        ");

                        try
                        {
                            userDb.Database.ExecuteSqlRaw("ALTER TABLE NewsletterSubscribers ADD COLUMN IsVerified INTEGER NOT NULL DEFAULT 0;");
                        }
                        catch { /* Column already exists */ }

                        try
                        {
                            userDb.Database.ExecuteSqlRaw("ALTER TABLE NewsletterSubscribers ADD COLUMN VerificationToken TEXT;");
                        }
                        catch { /* Column already exists */ }

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS JobPostings (
                                Slug TEXT PRIMARY KEY,
                                CompanyName TEXT NOT NULL,
                                Title TEXT NOT NULL,
                                Description TEXT NOT NULL,
                                Remote INTEGER NOT NULL,
                                Url TEXT NOT NULL,
                                Tags TEXT NULL,
                                JobTypes TEXT NULL,
                                Location TEXT NOT NULL,
                                CreatedAt INTEGER NOT NULL,
                                IsLocal INTEGER NOT NULL DEFAULT 0
                            );
                        ");

                        db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_NewsArticles_PublishedAt ON NewsArticles (PublishedAt);");
                        db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_NewsArticles_CategoryId ON NewsArticles (CategoryId);");
                        db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_NewsArticles_Url ON NewsArticles (Url);");

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS AmazonProducts (
                                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                Asin TEXT NOT NULL,
                                Title TEXT NOT NULL,
                                Description TEXT NOT NULL,
                                ImageUrl TEXT NOT NULL,
                                Price REAL NOT NULL,
                                OriginalPrice REAL NOT NULL,
                                Rating REAL NOT NULL,
                                ReviewCount INTEGER NOT NULL,
                                Category TEXT NOT NULL,
                                ProductUrl TEXT NOT NULL,
                                LastUpdated TEXT NOT NULL
                            );
                        ");

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS SeoKeywords (
                                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                Category TEXT NOT NULL,
                                [Primary] TEXT NOT NULL,
                                Longtail TEXT NOT NULL,
                                Trending TEXT NOT NULL,
                                MetaDesc TEXT NOT NULL,
                                Date TEXT NOT NULL,
                                CreatedAt TEXT NOT NULL
                            );
                        ");

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS CabDrivers (
                                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                Name TEXT NOT NULL,
                                VehicleType TEXT NOT NULL,
                                VehicleNumber TEXT NOT NULL,
                                Latitude REAL NOT NULL,
                                Longitude REAL NOT NULL,
                                IsAvailable INTEGER NOT NULL DEFAULT 1,
                                Rating REAL NOT NULL DEFAULT 4.5
                            );
                        ");

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS RideBookings (
                                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                UserEmail TEXT NOT NULL,
                                PickupLocation TEXT NOT NULL,
                                Destination TEXT NOT NULL,
                                VehicleType TEXT NOT NULL,
                                Price REAL NOT NULL,
                                Status TEXT NOT NULL,
                                CreatedAt TEXT NOT NULL,
                                ETA INTEGER NOT NULL,
                                MatchedDriverId INTEGER NULL,
                                DriverName TEXT NULL,
                                VehicleNumber TEXT NULL
                            );
                        ");

                        // PlayGames Tables
                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS PlayGamesPlayers (
                                Id TEXT PRIMARY KEY,
                                GoogleUserId TEXT NOT NULL,
                                DisplayName TEXT NOT NULL,
                                Email TEXT NOT NULL,
                                AvatarUrl TEXT NOT NULL,
                                Level INTEGER NOT NULL,
                                XpPoints INTEGER NOT NULL,
                                CreatedAt TEXT NOT NULL,
                                LastLoginAt TEXT NOT NULL
                            );
                        ");

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS PlayGamesLeaderboards (
                                Id TEXT PRIMARY KEY,
                                Title TEXT NOT NULL,
                                GameCategory TEXT NOT NULL,
                                IconUrl TEXT NOT NULL,
                                SortOrder TEXT NOT NULL
                            );
                        ");

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS PlayGamesScores (
                                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                LeaderboardId TEXT NOT NULL,
                                PlayerId TEXT NOT NULL,
                                PlayerName TEXT NOT NULL,
                                AvatarUrl TEXT NOT NULL,
                                ScoreValue INTEGER NOT NULL,
                                FormattedValue TEXT NOT NULL,
                                SubmittedAt TEXT NOT NULL
                            );
                        ");

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS PlayGamesAchievements (
                                Id TEXT PRIMARY KEY,
                                Title TEXT NOT NULL,
                                Description TEXT NOT NULL,
                                IconUrl TEXT NOT NULL,
                                UnlockedIconUrl TEXT NOT NULL,
                                Rarity TEXT NOT NULL,
                                TotalSteps INTEGER NOT NULL,
                                XpReward INTEGER NOT NULL
                            );
                        ");

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS PlayGamesPlayerAchievements (
                                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                PlayerId TEXT NOT NULL,
                                AchievementId TEXT NOT NULL,
                                CurrentSteps INTEGER NOT NULL,
                                IsUnlocked INTEGER NOT NULL,
                                UnlockedAt TEXT NULL
                            );
                        ");

                        db.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS PlayGamesSavedGames (
                                Id TEXT PRIMARY KEY,
                                PlayerId TEXT NOT NULL,
                                SaveName TEXT NOT NULL,
                                GameId TEXT NOT NULL,
                                DataJson TEXT NOT NULL,
                                CoverImageUrl TEXT NOT NULL,
                                LastModifiedAt TEXT NOT NULL
                            );
                        ");
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "❌ SQLite table creation verification failed.");
                }

                // Run general schema additions (FullContent)
                try
                {
                    if (db.Database.IsSqlite())
                    {
                        db.Database.ExecuteSqlRaw("ALTER TABLE EnrichedArticles ADD COLUMN FullContent TEXT NULL;");
                        logger.LogInformation("✓ SQLite EnrichedArticles table FullContent column verified.");
                    }
                    else if (db.Database.ProviderName != null && db.Database.ProviderName.Contains("PostgreSQL"))
                    {
                        db.Database.ExecuteSqlRaw(@"ALTER TABLE ""EnrichedArticles"" ADD COLUMN IF NOT EXISTS ""FullContent"" TEXT NULL;");
                        logger.LogInformation("✓ PostgreSQL EnrichedArticles table FullContent column verified.");
                    }
                    else // SQL Server
                    {
                        db.Database.ExecuteSqlRaw(@"
                            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[EnrichedArticles]') AND name = 'FullContent') 
                            ALTER TABLE [dbo].[EnrichedArticles] ADD [FullContent] NVARCHAR(MAX) NULL;");
                        logger.LogInformation("✓ SQL Server EnrichedArticles table FullContent column verified.");
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning($"⚠️ Non-critical schema alteration check: {ex.Message}");
                }

                // Seed Default Categories
                var requiredCategories = new[] { "Discover", "Sports", "Money", "Weather", "Shopping", "Services", "Gaming", "Cartoons", "Politics", "Technology", "Business", "Science-Health", "Lifestyle", "Education", "Entertainment", "Food", "Travel" };
                foreach (var catName in requiredCategories)
                {
                    if (!db.Categories.Any(c => c.Name.ToLower() == catName.ToLower()))
                    {
                        db.Categories.Add(new Category { Name = catName });
                    }
                }
                db.SaveChanges();

                // Seed Default Cab Drivers
                if (!db.CabDrivers.Any())
                {
                    db.CabDrivers.AddRange(new[]
                    {
                        new CabDriver { Name = "Ramesh Kumar", VehicleType = "Bike", VehicleNumber = "DL-3C-AB-1234", Latitude = 28.6139, Longitude = 77.2090, IsAvailable = true, Rating = 4.8 },
                        new CabDriver { Name = "Amit Singh", VehicleType = "Auto", VehicleNumber = "HR-26-XY-5678", Latitude = 28.6250, Longitude = 77.2150, IsAvailable = true, Rating = 4.6 },
                        new CabDriver { Name = "Sanjay Dutt", VehicleType = "Sedan", VehicleNumber = "UP-16-CD-9012", Latitude = 28.6100, Longitude = 77.2300, IsAvailable = true, Rating = 4.7 },
                        new CabDriver { Name = "Vikram Aditya", VehicleType = "Premium", VehicleNumber = "DL-1C-ZZ-0007", Latitude = 28.5900, Longitude = 77.2000, IsAvailable = true, Rating = 4.9 },
                        new CabDriver { Name = "Priya Sharma", VehicleType = "Bike", VehicleNumber = "MH-02-AA-1111", Latitude = 28.6012, Longitude = 77.2250, IsAvailable = true, Rating = 4.9 },
                        new CabDriver { Name = "Rahul Mehta", VehicleType = "Sedan", VehicleNumber = "KA-03-BB-2222", Latitude = 28.6300, Longitude = 77.1950, IsAvailable = true, Rating = 4.5 }
                    });
                    db.SaveChanges();
                }

                // Seed Default Polls
                if (db.Polls.Count() < 10 || !db.PollOptions.Any(o => o.IsCorrect))
                {
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

                    var polls = new List<Poll>
                    {
                        new Poll
                        {
                            Question = "How will Artificial Intelligence impact your career in the next 5 years?",
                            Description = "A poll tracking general public sentiment regarding automated systems and career displacement/enhancement.",
                            CreatedAt = DateTime.UtcNow.AddDays(-9),
                            Options = new List<PollOption>
                            {
                                new PollOption { OptionText = "Very Positively", Votes = 245, IsCorrect = true },
                                new PollOption { OptionText = "Somewhat Positively", Votes = 312, IsCorrect = false },
                                new PollOption { OptionText = "Neutral / No Impact", Votes = 98, IsCorrect = false },
                                new PollOption { OptionText = "Negatively / Risk of Layoff", Votes = 156, IsCorrect = false }
                            }
                        },
                        new Poll
                        {
                            Question = "What is your primary source of daily technology news?",
                            Description = "Identifying news distribution preference among modern readers.",
                            CreatedAt = DateTime.UtcNow.AddDays(-8),
                            Options = new List<PollOption>
                            {
                                new PollOption { OptionText = "Social Media Platforms (Twitter, Reddit)", Votes = 189, IsCorrect = false },
                                new PollOption { OptionText = "Dedicated News Sites (WorldNewzs, BBC)", Votes = 224, IsCorrect = true },
                                new PollOption { OptionText = "Email Newsletters", Votes = 87, IsCorrect = false },
                                new PollOption { OptionText = "Video Tech Creators", Votes = 143, IsCorrect = false }
                            }
                        },
                        new Poll
                        {
                            Question = "Which cricket format do you prefer watching the most?",
                            Description = "Sports preference tracking for regional news targeting.",
                            CreatedAt = DateTime.UtcNow.AddDays(-7),
                            Options = new List<PollOption>
                            {
                                new PollOption { OptionText = "Test Cricket (Traditional)", Votes = 112, IsCorrect = false },
                                new PollOption { OptionText = "One Day Internationals (ODI)", Votes = 95, IsCorrect = false },
                                new PollOption { OptionText = "T20 Internationals", Votes = 342, IsCorrect = true },
                                new PollOption { OptionText = "IPL / Domestic Franchise Leagues", Votes = 489, IsCorrect = false }
                            }
                        },
                        new Poll
                        {
                            Question = "What is the most critical factor for successful remote team collaboration?",
                            Description = "Corporate and industry development survey on workplace methods.",
                            CreatedAt = DateTime.UtcNow.AddDays(-6),
                            Options = new List<PollOption>
                            {
                                new PollOption { OptionText = "Clear Communication Protocols", Votes = 190, IsCorrect = true },
                                new PollOption { OptionText = "Robust Project Management Tools", Votes = 120, IsCorrect = false },
                                new PollOption { OptionText = "Flexible Working Hours", Votes = 75, IsCorrect = false },
                                new PollOption { OptionText = "Regular Virtual Meetings", Votes = 60, IsCorrect = false }
                            }
                        },
                        new Poll
                        {
                            Question = "Which renewable energy source has the highest potential for global adoption?",
                            Description = "Environmental and science survey tracking sustainable energy preference.",
                            CreatedAt = DateTime.UtcNow.AddDays(-5),
                            Options = new List<PollOption>
                            {
                                new PollOption { OptionText = "Solar Power", Votes = 420, IsCorrect = true },
                                new PollOption { OptionText = "Wind Energy", Votes = 280, IsCorrect = false },
                                new PollOption { OptionText = "Hydroelectric Energy", Votes = 150, IsCorrect = false },
                                new PollOption { OptionText = "Geothermal Energy", Votes = 85, IsCorrect = false }
                            }
                        },
                        new Poll
                        {
                            Question = "What is the best way to improve cybersecurity awareness in an organization?",
                            Description = "Assessing IT security posture and training effectiveness in businesses.",
                            CreatedAt = DateTime.UtcNow.AddDays(-4),
                            Options = new List<PollOption>
                            {
                                new PollOption { OptionText = "Regular Training and Simulations", Votes = 310, IsCorrect = true },
                                new PollOption { OptionText = "Strict IT Security Policies", Votes = 145, IsCorrect = false },
                                new PollOption { OptionText = "Advanced Threat Detection Systems", Votes = 98, IsCorrect = false },
                                new PollOption { OptionText = "Encrypted Communication Tools", Votes = 55, IsCorrect = false }
                            }
                        },
                        new Poll
                        {
                            Question = "Which platform do you prefer for professional networking?",
                            Description = "Career navigation and digital networking preference research.",
                            CreatedAt = DateTime.UtcNow.AddDays(-3),
                            Options = new List<PollOption>
                            {
                                new PollOption { OptionText = "LinkedIn", Votes = 520, IsCorrect = true },
                                new PollOption { OptionText = "GitHub", Votes = 160, IsCorrect = false },
                                new PollOption { OptionText = "Twitter/X", Votes = 110, IsCorrect = false },
                                new PollOption { OptionText = "Dedicated Slack Communities", Votes = 95, IsCorrect = false }
                            }
                        },
                        new Poll
                        {
                            Question = "What is the primary benefit of deploying applications to the cloud?",
                            Description = "Tracking software engineering infrastructure trends.",
                            CreatedAt = DateTime.UtcNow.AddDays(-2),
                            Options = new List<PollOption>
                            {
                                new PollOption { OptionText = "Scalability and Flexibility", Votes = 340, IsCorrect = true },
                                new PollOption { OptionText = "Reduced Maintenance Costs", Votes = 210, IsCorrect = false },
                                new PollOption { OptionText = "Enhanced Built-in Security", Votes = 125, IsCorrect = false },
                                new PollOption { OptionText = "Simplified Version Control", Votes = 45, IsCorrect = false }
                            }
                        },
                        new Poll
                        {
                            Question = "Which programming paradigm do you use most frequently?",
                            Description = "Assessing developer preferences and methodology.",
                            CreatedAt = DateTime.UtcNow.AddDays(-1),
                            Options = new List<PollOption>
                            {
                                new PollOption { OptionText = "Object-Oriented Programming", Votes = 450, IsCorrect = true },
                                new PollOption { OptionText = "Functional Programming", Votes = 180, IsCorrect = false },
                                new PollOption { OptionText = "Procedural Programming", Votes = 65, IsCorrect = false },
                                new PollOption { OptionText = "Event-Driven Programming", Votes = 135, IsCorrect = false }
                            }
                        },
                        new Poll
                        {
                            Question = "What is the main advantage of Agile project management over Waterfall?",
                            Description = "Software project lifecycle management preference survey.",
                            CreatedAt = DateTime.UtcNow,
                            Options = new List<PollOption>
                            {
                                new PollOption { OptionText = "Adaptability to Changing Requirements", Votes = 380, IsCorrect = true },
                                new PollOption { OptionText = "Predictable Project Timelines", Votes = 95, IsCorrect = false },
                                new PollOption { OptionText = "Fixed Budget Constraints", Votes = 60, IsCorrect = false },
                                new PollOption { OptionText = "Comprehensive Initial Documentation", Votes = 45, IsCorrect = false }
                            }
                        }
                    };
                    db.Polls.AddRange(polls);
                    db.SaveChanges();
                    Console.WriteLine("✓ Seeded 10 default polls to database with correct answers");
                }

                // Seed Default Ads
                if (!db.Ads.Any())
                {
                    db.Ads.AddRange(
                        new Ad
                        {
                            AdType = "responsive",
                            Placement = "between-articles",
                            Script = "<ins class=\"adsbygoogle\" style=\"display:block\" data-ad-client=\"ca-pub-7547748414764075\" data-ad-slot=\"7829102931\" data-ad-format=\"auto\" data-ad-full-width-responsive=\"true\"></ins>"
                        },
                        new Ad
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
        }

        private static void SafeExecuteSql(DbContext db, string sql, string tableName, ILogger logger)
        {
            try
            {
                db.Database.ExecuteSqlRaw(sql);
                logger.LogInformation($"✓ Verified/created table/schema: {tableName}");
            }
            catch (Exception ex)
            {
                logger.LogWarning($"⚠️ Non-critical verification failed for table {tableName}: {ex.Message}");
            }
        }
    }
}
