# WORLDNEWZ Development Guide

Complete guide for maintaining, debugging, and extending the WORLDNEWZ project.

---

## 📋 Table of Contents

1. [Project Architecture](#project-architecture)
2. [Development Setup](#development-setup)
3. [API Development](#api-development)
4. [Frontend Development](#frontend-development)
5. [Database Management](#database-management)
6. [Debugging & Troubleshooting](#debugging--troubleshooting)
7. [Deployment Checklist](#deployment-checklist)
8. [Code Standards](#code-standards)

---

## 🏗️ Project Architecture

### Technology Stack

| Component | Tech Stack | Port |
|-----------|-----------|------|
| Backend | .NET 6.0, C#, ASP.NET Core | 5005 |
| Frontend | React 19, TypeScript, Vite | 5173 |
| Database | SQLite | Local |
| APIs Used | NewsAPI, WorldNewsAPI, OpenMeteo | External |

### Data Flow

```
[UI Browser]
    ↓
[Axios HTTP Client]
    ↓
[React Components]
    ↓
[API Client (apiClient.ts)]
    ↓
[Backend API (Port 5005)]
    ↓
[Controllers & Services]
    ↓
[External APIs: NewsAPI, Weather, etc.]
    ↓
[Data Response]
    ↓
[UI Display]
```

### Project Dependencies

```
Frontend depends on:
  - API running on http://localhost:5005

Backend depends on:
  - External APIs (NewsAPI, WorldNewsAPI, Open-Meteo)
  - Environment variables (.env)
  - SQLite Database

Database:
  - SQLite (worldnews.db)
  - Schema from WorldNewsDBscripts.sql
```

---

## 🚀 Development Setup

### Initial Setup (First Time)

```bash
# 1. Clone/Extract the project
cd C:\WorldNewz

# 2. Setup Backend
cd WorldNewzWebAPI
dotnet restore
cp .env.example .env

# Edit .env with your API keys:
# - Get NEWS_API_KEY from https://newsapi.org
# - Get WORLDNEWS_API_KEY from https://www.worldnewsapi.com
# - Weather API is free (open-meteo.com)

# 3. Initialize database
sqlite3 worldnews.db < ../DB/WorldNewsDBscripts.sql

# 4. Run API
dotnet run
# Should start on http://localhost:5005

# 5. Setup Frontend (in new terminal)
cd worldnewz_UI
npm install
npm run dev
# Should start on http://localhost:5173
```

### Daily Development

```bash
# Terminal 1: Backend
cd C:\WorldNewz\WorldNewzWebAPI
dotnet run

# Terminal 2: Frontend
cd C:\WorldNewz\worldnewz_UI
npm run dev
```

---

## 🔧 API Development

### Project Structure

```
WorldNewzWebAPI/
├── Controllers/              # API endpoints
│   ├── NewsController.cs     # /api/news/* endpoints
│   ├── WeatherController.cs  # /api/news/weather
│   ├── SportsController.cs   # /api/news/sports
│   ├── MoneyController.cs    # /api/news/money
│   ├── ShoppingController.cs # /api/news/shopping
│   └── CategoriesController.cs
├── Services/
│   ├── NewsApiService.cs     # News API logic
│   ├── WeatherService.cs     # Weather API logic
│   └── NewsService.cs        # General news service
├── Models/
│   ├── NewsArticle.cs
│   ├── Category.cs
│   ├── NewsQueryContext.cs
│   └── NewsApiModels.cs
└── Data/
    └── WorldNewsDbContext.cs # Entity Framework context
```

### Adding a New Endpoint

1. **Create Controller** (if needed):
```csharp
[ApiController]
[Route("api/[controller]")]
public class MyController : ControllerBase
{
    [HttpGet("my-endpoint")]
    public async Task<IActionResult> GetData([FromQuery] string? param)
    {
        try
        {
            // Implementation
            return Ok(data);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
```

2. **Register Service** in `Program.cs`:
```csharp
builder.Services.AddScoped<MyService>();
```

3. **Test Endpoint**:
   - Use Swagger UI: http://localhost:5005/
   - Or use REST Client in VS Code
   - Check `WorldNewzWebAPI.http` for examples

### API Conventions

- Use `async/await` for all I/O operations
- Return `IActionResult` for flexibility
- Always handle exceptions
- Use proper HTTP status codes:
  - `200 OK` - Success
  - `400 Bad Request` - Invalid input
  - `429 Too Many Requests` - Rate limited
  - `500 Internal Server Error` - Server error
- Log errors to console (to be enhanced with proper logging)

### Debugging API

```bash
# 1. Check logs in terminal
cd WorldNewzWebAPI
dotnet run
# Look for error messages

# 2. Use Swagger UI for manual testing
# http://localhost:5005/

# 3. Test specific endpoint
curl http://localhost:5005/api/news/discover

# 4. Check environment variables
# Review .env file is loaded correctly

# 5. Monitor external API calls
# Check console output for API URLs being called
```

---

## 🎨 Frontend Development

### Project Structure

```
worldnewz_UI/src/
├── pages/              # Full page components
│   ├── DiscoverPage.tsx
│   ├── SportsPage.tsx
│   ├── MoneyPage.tsx
│   ├── ShoppingPage.tsx
│   ├── WeatherPage.tsx
│   └── SearchPage.tsx
├── components/         # Reusable components
│   ├── Header.tsx
│   ├── NewsCard.tsx
│   ├── Navigation.tsx
│   └── ...
├── api/
│   └── apiClient.ts    # Axios API client
├── context/            # React context
├── hooks/              # Custom hooks
├── types.ts            # TypeScript type definitions
├── theme.ts            # Material-UI theme
└── App.tsx             # Root component
```

### Building Features

1. **Create Page Component**:
```typescript
import { useEffect, useState } from 'react';
import { fetchNews } from '../api/apiClient';

export function MyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    fetchNews()
      .then(res => setData(res.data.results))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);
  
  return <div>{/* Render data */}</div>;
}
```

2. **Add API Call** in `src/api/apiClient.ts`:
```typescript
export const fetchMyData = () => apiClient.get("/endpoint");
```

3. **Import & Use**:
```typescript
import { fetchMyData } from '../api/apiClient';
```

### Debugging Frontend

1. **Browser DevTools**:
   - F12 or Right-click → Inspect
   - Console tab: Check for errors
   - Network tab: Monitor API calls
   - React DevTools extension: Inspect components

2. **Common Issues**:
   - API connection: Check Network tab for CORS errors
   - Data not showing: Check if API returns data
   - Build errors: Run `npm run build` to see issues
   - TypeScript errors: Check `npm run lint`

---

## 🗄️ Database Management

### Database Structure

```
Tables:
├── Categories
│   ├── Id (PK)
│   ├── Name
│   └── Description
├── NewsArticles
│   ├── Id (PK)
│   ├── Title
│   ├── Description
│   ├── Url
│   ├── ImageUrl
│   ├── PublishedAt
│   ├── CachedAt
│   └── CategoryId (FK)
└── Ads
    ├── Id (PK)
    ├── Title
    ├── Content
    └── ...
```

### Database Operations

```bash
# View database contents
sqlite3 worldnews.db

# Run query
sqlite3 worldnews.db "SELECT * FROM Categories;"

# Backup database
cp worldnews.db worldnews.db.backup

# Reset database
rm worldnews.db
sqlite3 worldnews.db < ../DB/WorldNewsDBscripts.sql
```

### Modifying Schema

1. **Create Migration** (if using EF Core):
```bash
cd WorldNewzWebAPI
dotnet ef migrations add MigrationName
dotnet ef database update
```

2. **Update DbContext** in `Data/WorldNewsDbContext.cs`:
```csharp
public DbSet<NewEntity> NewEntities { get; set; }
```

---

## 🐛 Debugging & Troubleshooting

### Common Issues

#### Issue: "API is not running"
```
Solution:
1. Check port 5005 is not in use: netstat -ano | findstr :5005
2. Run: dotnet run
3. Verify http://localhost:5005/health returns response
```

#### Issue: "CORS error in browser"
```
Solution:
1. Verify CORS_ALLOWED_ORIGINS includes your frontend URL
2. Check .env has correct CORS settings
3. Restart API after .env changes
4. Check browser DevTools Network tab for preflight (OPTIONS) requests
```

#### Issue: "API returns empty results"
```
Solution:
1. Check API keys in .env are valid
2. Check rate limits: NewsAPI has 100 requests/day free
3. Check API response in Network tab
4. Review console logs for detailed error messages
```

#### Issue: "Database connection error"
```
Solution:
1. Verify worldnews.db file exists
2. Check DATABASE_PATH in .env
3. Reinitialize database: sqlite3 worldnews.db < DB/WorldNewsDBscripts.sql
4. Check file permissions
```

### Debug Mode

1. **Add Console Logging**:
```csharp
Console.WriteLine($"[DEBUG] Variable value: {value}");
```

2. **Use Breakpoints in VS Code**:
   - Install "C# Dev Kit" extension
   - Click line number to add breakpoint
   - Run: `dotnet run`
   - Execution will pause at breakpoint

3. **Log API Responses**:
```typescript
const response = await fetchMyData();
console.log('API Response:', response);
```

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Environment variables configured correctly
- [ ] Database schema up to date
- [ ] API keys are valid
- [ ] HTTPS certificate ready (for production)
- [ ] CORS origins updated for production domain

### Backend Deployment

```bash
# Build for production
cd WorldNewzWebAPI
dotnet publish -c Release -o ./publish

# Output in ./publish/ ready to deploy
# Copy to hosting server
```

### Frontend Deployment

```bash
# Build for production
cd worldnewz_UI
npm run build

# Output in ./dist/ ready to deploy
# Copy to web server static hosting
```

### Post-Deployment

- [ ] Verify API endpoint responses
- [ ] Check frontend loads and connects to API
- [ ] Test all major features
- [ ] Monitor error logs
- [ ] Set up automated backups

---

## 📝 Code Standards

### Backend (C#)

```csharp
// Naming conventions
public class NewsArticle { }        // PascalCase for classes
public string Title { get; set; }   // PascalCase for properties
public async Task<IActionResult>    // PascalCase for methods
private readonly HttpClient;         // _camelCase for private fields

// Always use async/await
public async Task<Data> FetchData()
{
    var response = await _httpClient.GetAsync(url);
    return await response.Content.ReadAsAsync<Data>();
}

// Proper error handling
try
{
    // Code
}
catch (HttpRequestException ex)
{
    Console.WriteLine($"Error: {ex.Message}");
    return new ErrorResponse(ex.Message);
}
```

### Frontend (TypeScript)

```typescript
// Naming conventions
interface IUser { }              // PascalCase + I prefix for interfaces
type User = { }                  // PascalCase for types
const userName = "";             // camelCase for variables
const CONSTANT_VALUE = 42;       // UPPER_SNAKE_CASE for constants
function getUserData() { }       // camelCase for functions

// Use async/await
const fetchData = async () => {
  try {
    const response = await apiClient.get('/endpoint');
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Props typing
interface NewsCardProps {
  title: string;
  description: string;
  imageUrl?: string;  // Optional property
  onClick: () => void;
}
```

### Comments

- Use comments for **why**, not **what**
- Keep comments up-to-date with code
- Remove debug comments before committing

```csharp
// BAD - Comments describe what code does
// Get the user name
string name = user.FirstName;

// GOOD - Comments explain intent
// Extract first name for display in header
string name = user.FirstName;
```

---

## 🔗 Useful Resources

- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [NewsAPI Documentation](https://newsapi.org/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Entity Framework Core](https://docs.microsoft.com/ef/core/)

---

**Last Updated**: 2026-04-26  
**Version**: 1.0.0
