# WORLDNEWZ API Endpoints Documentation

**Base URL**: `http://localhost:5005/api`

---

## News Endpoints

### 1. Get Discover News
**Endpoint**: `GET /api/news/discover`
**Description**: Fetches general/top headlines news
**Query Parameters**:
- `country` (optional): Country code (default: "us")

**Example**:
```
GET /api/news/discover?country=us
```

**Response**:
```json
{
  "results": [
    {
      "title": "News Title",
      "description": "Article description",
      "url": "https://source.com/article",
      "urlToImage": "https://image.com/photo.jpg",
      "publishedAt": "2024-01-15T10:30:00Z",
      "source": {
        "id": "bbc-news",
        "name": "BBC News"
      }
    }
  ]
}
```

---

### 2. Get Sports News
**Endpoint**: `GET /api/news/sports`
**Description**: Fetches sports news articles
**Query Parameters**:
- `country` (optional): Country code (default: "us")

**Example**:
```
GET /api/news/sports?country=us
```

**Response**:
```json
{
  "status": "ok",
  "totalResults": 20,
  "articles": [...]
}
```

---

### 3. Get Money/Business News
**Endpoint**: `GET /api/news/money`
**Description**: Fetches financial and business news
**Query Parameters**:
- `country` (optional): Country code (default: "us")

**Example**:
```
GET /api/news/money?country=us
```

---

### 4. Get Shopping News
**Endpoint**: `GET /api/news/shopping`
**Description**: Fetches shopping and e-commerce related news
**Query Parameters**:
- `country` (optional): Country code (default: "in")

**Example**:
```
GET /api/news/shopping?country=in
```

---

### 5. Get Weather Information
**Endpoint**: `GET /api/news/weather`
**Description**: Fetches weather forecast and current weather
**Query Parameters**:
- `city` (optional): City name (auto-detected from IP if not provided)

**Example**:
```
GET /api/news/weather?city=Hyderabad
```

**Response**:
```json
{
  "location": "Hyderabad, India",
  "timezone": "Asia/Kolkata",
  "current_weather": {
    "temperature": 28.5,
    "description": "Partly Cloudy",
    "wind_speed": 12
  },
  "forecast": [
    {
      "date": "2024-01-15",
      "max_temp": 32,
      "min_temp": 24,
      "description": "Sunny"
    }
  ]
}
```

---

### 6. Search News
**Endpoint**: `GET /api/news/search`
**Description**: Search for news articles with flexible filters
**Query Parameters**:
- `query` (optional): Search keyword
- `category` (optional): News category
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Results per page (default: 9)
- `source` (optional): Source type (default: "news")
- `country` (optional): Country code (default: "us")
- `language` (optional): Language code (default: "en")

**Example**:
```
GET /api/news/search?query=technology&category=tech&page=1&pageSize=9
```

**Response**:
```json
{
  "results": [
    {
      "title": "Tech News Title",
      "description": "Description",
      "url": "https://...",
      "urlToImage": "https://...",
      "publishedAt": "2024-01-15T10:30:00Z",
      "source": {
        "id": "techcrunch",
        "name": "TechCrunch"
      }
    }
  ]
}
```

---

## Category Endpoints

### 7. Get All Categories
**Endpoint**: `GET /api/categories`
**Description**: Fetches all available news categories
**Query Parameters**: None

**Example**:
```
GET /api/categories
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "General"
  },
  {
    "id": 2,
    "name": "Sports"
  },
  {
    "id": 3,
    "name": "Business"
  }
]
```

---

## Health Check

### 8. Health Check
**Endpoint**: `GET /health`
**Description**: Verifies API is running
**Query Parameters**: None

**Example**:
```
GET /health
```

**Response**:
```
API is running
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

**Common HTTP Status Codes**:
- `200 OK` - Request successful
- `400 Bad Request` - Invalid parameters
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Supported Countries

Common country codes: `us`, `in`, `gb`, `au`, `ca`, `de`, `fr`, `jp`, `kr`, `br`

## Supported Languages

Common language codes: `en`, `hi`, `de`, `fr`, `es`, `pt`, `zh`, `ja`, `ko`

---

## Rate Limiting

- **NewsAPI**: 100 requests/day (free tier)
- **WorldNewsAPI**: 50 requests/day (fallback provider)
- The API automatically switches to fallback provider when primary limit is reached

---

## Authentication

No API key required for frontend requests. All external API keys are handled server-side.

---

## CORS Configuration

Allowed origins (configurable via `CORS_ALLOWED_ORIGINS` environment variable):
- `http://localhost:5173` (Default frontend dev port)
- `http://localhost:5174` (Alternative frontend dev port)

---

## Swagger/OpenAPI

Interactive API documentation available at: `http://localhost:5005/`

All endpoints are documented with request/response examples in the Swagger UI.
