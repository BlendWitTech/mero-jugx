# Deployment Guide 🚀

Deploying Mero Jugx (NestJS API + Vite SPA).

## 1. Build Strategy

We deploy as two separate artifacts:
1.  **Frontend**: Static HTML/JS files (served by Nginx).
2.  **Backend**: Node.js process (PM2 or Docker).

### Building Frontend
```bash
cd app
npm run build
# Output: /app/dist
```

### Building Backend
```bash
cd api
npm run build
# Output: /api/dist
```

## 2. Nginx Configuration (Unified)

Use Nginx to serve the static frontend AND reverse-proxy the backend API.

```nginx
server {
    listen 80;
    server_name example.com;

    # 1. Serve Frontend (Static Files)
    location / {
        root /var/www/mero-jugx/app/dist;
        index index.html;
        try_files $uri $uri/ /index.html; # SPA Fallback
    }

    # 2. Proxy Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # 3. WebSocket Proxy (Socket.io)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 3. Docker Production Setup

Use `docker-compose.prod.yml` (if available) or build images manually.

```bash
# Backend Image
docker build -t mero-jugx-api ./api

# Frontend Image (Nginx wrapper)
docker build -t mero-jugx-web ./app
```

## 4. Environment Variables

Ensure these are set in Production:
*   `NODE_ENV=production`
*   `DB_HOST=...` (Managed Postgres)
*   `REDIS_HOST=...` (Managed Redis)
*   `CORS_ORIGIN=https://example.com` (Vital for security)
