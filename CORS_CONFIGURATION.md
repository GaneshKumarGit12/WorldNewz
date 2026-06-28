# CORS Configuration Guide

The CORS configuration for the WorldNewz API is fully configurable via environment variables, avoiding any hardcoded origins in the codebase.

## Configuration

Add or modify the following line in the backend `.env` file (`WorldNewzWebAPI/.env`) or within your production server environment variables:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

### Formatting Rules:
*   Use a comma (`,`) to separate multiple origins.
*   Do **NOT** include trailing slashes (e.g., use `http://localhost:5173`, not `http://localhost:5173/`).
*   Ensure the correct protocol (`http` vs `https`) is specified.

## Verification

When the API starts, the allowed origins are resolved dynamically. You can verify your CORS setup using a `curl` preflight check request:

```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -I http://localhost:5005/health
```

If configured correctly, the response headers will contain:
`Access-Control-Allow-Origin: http://localhost:5173`
