
-- Step 3: Create Categories table
CREATE TABLE Categories (
    Id INT PRIMARY KEY IDENTITY,
    Name NVARCHAR(50) NOT NULL UNIQUE
);

-- Step 4: Create NewsArticles table
CREATE TABLE NewsArticles (
    Id INT PRIMARY KEY IDENTITY,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    Url NVARCHAR(255),
    ImageUrl NVARCHAR(255),
    CategoryId INT NOT NULL FOREIGN KEY REFERENCES Categories(Id),
    PublishedAt DATETIME,
    CachedAt DATETIME DEFAULT GETDATE()
);

-- Step 5: Create Ads table
CREATE TABLE Ads (
    Id INT PRIMARY KEY IDENTITY,
    AdType NVARCHAR(50),       -- e.g., banner, sidebar
    Placement NVARCHAR(50),    -- e.g., header, between articles
    Script NVARCHAR(MAX)       -- AdSense script snippet
);

-- Step 6: Create Users table (optional, for admin panel)
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) DEFAULT 'User'
);

-- Step 7: Seed initial categories
INSERT INTO Categories (Name) VALUES
('Discover'),
('Sports'),
('Money'),
('Weather'),
('Shopping');