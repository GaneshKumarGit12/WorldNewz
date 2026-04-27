# 🌍 WORLDNEWZ - Multi-Category News Aggregator

A full-stack web application for discovering, searching, and exploring news across multiple categories including general news, sports, business, shopping, and weather.

## 📋 Project Structure

```
WorldNewz/
├── DB/                          # Database scripts
│   └── WorldNewsDBscripts.sql   # Initial database schema
├── WorldNewzWebAPI/             # .NET 6.0 REST API Backend
│   ├── Controllers/             # API endpoints
│   ├── Services/                # Business logic
│   ├── Models/                  # Data models
│   ├── Data/                    # Database context
│   ├── Program.cs               # Configuration & startup
│   ├── appsettings.json         # App settings
│   ├── .env                     # Environment variables (secrets)
│   └── .env.example             # Template for .env
├── worldnewz_UI/                # React + TypeScript Frontend
│   ├── src/
│   │   ├── pages/               # Page components
│   │   ├── components/          # Reusable components
│   │   ├── api/                 # API client
│   │   └── types.ts             # TypeScript types
│   ├── package.json             # Dependencies
│   └── vite.config.ts           # Vite build config
└── .gitignore                   # Git exclusion rules
```

---

## 🚀 Quick Start

### Prerequisites
- **.NET 6.0 SDK** (Backend)
- **Node.js 18+** (Frontend)
- **npm** or **yarn** (Package manager)

### 1. Backend Setup (API)

```bash
cd WorldNewzWebAPI

# Install dependencies
dotnet restore

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys

# Run the API
dotnet run
# API will start on http://localhost:5005
```

### 2. Frontend Setup (UI)

```bash
cd worldnewz_UI

# Install dependencies
npm install

# Configure environment (already set in .env)
# VITE_API_BASE_URL=http://localhost:5005/api

# Run the development server
npm run dev
# UI will start on http://localhost:5173
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **API Swagger Docs**: http://localhost:5005/
- **API Health Check**: http://localhost:5005/health

---

## 🔑 Environment Variables

### Backend (.env file)

```env
# Required API Keys
NEWS_API_KEY=your_newsapi_key_here
WORLDNEWS_API_KEY=your_worldnews_api_key_here
WEATHER_API_KEY=your_weather_api_key_here
SPORTS_API_KEY=your_sports_api_key_here
MONEY_API_KEY=your_money_api_key_here
SHOPPING_API_KEY=your_shopping_api_key_here
ALGOLIA_APP_ID=your_algolia_app_id_here

# Application Settings
ASPNETCORE_ENVIRONMENT=Development
DATABASE_PATH=worldnewz.db

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Logging
LOG_LEVEL=Information
```

### Frontend (.env file - already configured)

```env
VITE_API_BASE_URL=http://localhost:5005/api
```

---

## 📡 API Endpoints

See [API_ENDPOINTS.md](./WorldNewzWebAPI/API_ENDPOINTS.md) for detailed endpoint documentation.

### Core Endpoints:
- `GET /api/news/discover` - General headlines
- `GET /api/news/sports` - Sports news
- `GET /api/news/money` - Business/Finance news
- `GET /api/news/shopping` - Shopping content
- `GET /api/news/weather` - Weather forecast
- `GET /api/news/search` - Advanced search
- `GET /api/categories` - Available categories
- `GET /health` - Health check

---

## 🛠️ Development

### Building

**Backend**:
```bash
cd WorldNewzWebAPI
dotnet build
```

**Frontend**:
```bash
cd worldnewz_UI
npm run build
```

### Linting & Testing

**Backend**:
```bash
# Check for build issues
dotnet build --no-restore
```

**Frontend**:
```bash
# Lint code
npm run lint

# Build for production
npm run build
```

---

## 🔒 Security & Best Practices

### ✅ Implemented
- Environment variable-based configuration (no hardcoded secrets)
- Global exception handling middleware
- CORS policy enforcement
- API key validation at startup
- `.env` file excluded from version control

### 🛡️ Security Considerations
- Never commit `.env` file to Git
- Rotate API keys regularly
- Use environment-specific configurations (dev/staging/prod)
- Validate all API responses before using
- Implement rate limiting for production
- Use HTTPS in production environments

---

## 🗄️ Database

### Setup
```bash
# Execute the database initialization script
sqlite3 worldnews.db < DB/WorldNewsDBscripts.sql
```

### Configuration
Database path can be customized via `DATABASE_PATH` environment variable.

**Default Location**: `WorldNewzWebAPI/bin/Debug/net6.0/worldnews.db`

---

## 🐛 Troubleshooting

### API Won't Start
1. Check `.env` file exists and has required API keys
2. Verify port 5005 is not in use
3. Run: `dotnet clean && dotnet restore && dotnet run`

### Frontend Can't Connect to API
1. Verify API is running on http://localhost:5005
2. Check `VITE_API_BASE_URL` in `worldnewz_UI/.env`
3. Check browser console for CORS errors
4. Verify `CORS_ALLOWED_ORIGINS` in API `.env`

### No News Data Showing
1. Verify API keys are valid in `.env`
2. Check API rate limits (NewsAPI: 100/day free tier)
3. Check API response in Network tab (browser DevTools)
4. Review backend console for errors

---

## 📦 Dependencies

### Backend
- **ASP.NET Core 6.0** - Web framework
- **Entity Framework Core** - ORM
- **Swashbuckle** - Swagger/OpenAPI
- **Quartz** - Job scheduling
- **SQLite** - Database

### Frontend
- **React 19** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite 8** - Build tool
- **Axios** - HTTP client
- **Material-UI 7** - Component library
- **React Router 7** - Navigation
- **React Slick** - Carousel

---

## 📄 Configuration Files

### Backend
- **Program.cs** - Application startup and configuration
- **appsettings.json** - Production settings
- **appsettings.Development.json** - Development settings
- **WorldNewzWebAPI.csproj** - Project file and dependencies

### Frontend
- **package.json** - Project metadata and dependencies
- **tsconfig.json** - TypeScript configuration
- **vite.config.ts** - Vite build configuration
- **eslint.config.js** - Code quality rules

---

## 🚀 Deployment

### Production Build

**Backend**:
```bash
cd WorldNewzWebAPI
dotnet publish -c Release -o ./publish
# Deploy contents of ./publish folder
```

**Frontend**:
```bash
cd worldnewz_UI
npm run build
# Deploy contents of ./dist folder to web server
```

### Environment Configuration for Production
1. Set `ASPNETCORE_ENVIRONMENT=Production`
2. Use environment-specific `.env` file
3. Enable HTTPS
4. Configure appropriate CORS origins
5. Set up database backups

---

## 📝 License

[Add your license information here]

---

## 👥 Contributors

- Development Team

---

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review API documentation
3. Check console logs for error messages
4. Verify all environment variables are set correctly

---

**Last Updated**: 2026-04-26  
**Version**: 1.0.0
