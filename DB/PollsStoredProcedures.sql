-- Database Schema and Stored Procedures for Polls and Leaderboard
-- Designed for MS SQL Server / Transact-SQL environments

-- Step 1: Create PollSubmissions Table (if not exists)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PollSubmissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PollSubmissions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL,
        [Email] NVARCHAR(100) NOT NULL,
        [Percentage] REAL NOT NULL,
        [Status] NVARCHAR(50) NOT NULL,
        [SubmittedAt] DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_PollSubmissions_Email ON [dbo].[PollSubmissions](Email);
    CREATE INDEX IX_PollSubmissions_Percentage ON [dbo].[PollSubmissions](Percentage);
END
GO

-- Step 2: Stored Procedure to Submit Poll Answers
CREATE OR ALTER PROCEDURE dbo.sp_SubmitPollAnswers
    @Name NVARCHAR(100),
    @Email NVARCHAR(100),
    @Percentage REAL,
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO [dbo].[PollSubmissions] (Name, Email, Percentage, Status, SubmittedAt)
    VALUES (@Name, @Email, @Percentage, @Status, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS NewSubmissionId;
END;
GO

-- Step 3: Stored Procedure to Fetch Leaderboard
-- Retrieves users who achieved a 100% correct score, returning their latest submission (distinct by email).
CREATE OR ALTER PROCEDURE dbo.sp_GetLeaderboard
AS
BEGIN
    SET NOCOUNT ON;
    
    WITH LatestSubmissions AS (
        SELECT 
            [Id],
            [Name], 
            [Email], 
            [Percentage], 
            [Status], 
            [SubmittedAt],
            ROW_NUMBER() OVER (PARTITION BY Email ORDER BY SubmittedAt DESC) as rn
        FROM [dbo].[PollSubmissions]
        WHERE [Percentage] = 100.0
    )
    SELECT [Id], [Name], [Email], [Percentage], [Status], [SubmittedAt]
    FROM LatestSubmissions
    WHERE rn = 1
    ORDER BY [SubmittedAt] DESC;
END;
GO
