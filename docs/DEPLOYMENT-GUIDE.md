# Deployment Guide

## Overview

This guide covers deploying Mero Jugx to production environments.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ database
- Redis (optional, for caching/sessions)
- Domain name and SSL certificate
- Server with sufficient resources

## Server Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100Mbps

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1Gbps

## Pre-Deployment Checklist

- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificate obtained
- [ ] Domain DNS configured
- [ ] Backup strategy planned
- [ ] Monitoring setup ready
- [ ] Logging configured

## Deployment Steps

### 1. Server Setup

#### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Install PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Install Redis (Optional)
```bash
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis
```

#### Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Database Setup

#### Create Database
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE mero_jugx;
CREATE USER mero_jugx_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mero_jugx TO mero_jugx_user;
\q
```

#### Run Migrations
```bash
cd /path/to/mero-jugx
npm run migration:run
npm run seed:run
```

### 3. Application Setup

#### Clone Repository
```bash
cd /var/www
git clone <repository-url> mero-jugx
cd mero-jugx
```

#### Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

#### Build Application
```bash
# Build backend
npm run build

# Build frontend
cd frontend
npm run build
cd ..
```

### 4. Environment Configuration

Create `.env` file:
```bash
cp .env.example .env
nano .env
```

**Required Environment Variables**:
```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api
API_VERSION=v1
FRONTEND_URL=https://yourdomain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=mero_jugx_user
DB_PASSWORD=secure_password
DB_NAME=mero_jugx
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=Mero Jugx

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application URLs
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### 5. Process Management

#### Install PM2
```bash
sudo npm install -g pm2
```

#### Create PM2 Ecosystem File

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'mero-jugx-api',
    script: './dist/main.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

#### Start Application
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Nginx Configuration

Create Nginx configuration `/etc/nginx/sites-available/mero-jugx`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/mero-jugx/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/mero-jugx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL Certificate (Let's Encrypt)

#### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### Obtain Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

#### Auto-renewal
```bash
sudo certbot renew --dry-run
```

### 8. Firewall Configuration

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Post-Deployment

### 1. Verify Deployment

- [ ] API responds: `https://api.yourdomain.com/api/v1`
- [ ] Frontend loads: `https://yourdomain.com`
- [ ] Database connections working
- [ ] Email sending works
- [ ] SSL certificate valid

### 2. Monitoring Setup

#### PM2 Monitoring
```bash
pm2 monit
```

#### Setup Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. Backup Strategy

#### Database Backup Script

Create `backup-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mero-jugx"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U mero_jugx_user mero_jugx > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
```

#### Schedule Backups
```bash
chmod +x backup-db.sh
crontab -e
# Add: 0 2 * * * /path/to/backup-db.sh
```

## Docker Deployment (Alternative)

### Docker Compose

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: mero_jugx
      POSTGRES_USER: mero_jugx_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api
    restart: always

volumes:
  postgres_data:
```

### Deploy with Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (Nginx, HAProxy)
- Multiple API instances behind load balancer
- Shared Redis for sessions
- Database connection pooling

### Database Scaling

- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)
- Database indexing optimization

### Caching Strategy

- Redis for session storage
- Redis for frequently accessed data
- CDN for static assets

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Check logs: `pm2 logs`
   - Verify environment variables
   - Check database connection

2. **Database connection errors**
   - Verify PostgreSQL is running
   - Check credentials in `.env`
   - Verify firewall rules

3. **Nginx 502 errors**
   - Check API is running: `pm2 status`
   - Verify proxy_pass URL
   - Check Nginx error logs

4. **SSL certificate issues**
   - Verify domain DNS
   - Check certificate expiration
   - Renew if needed: `sudo certbot renew`

## Security Checklist

- [ ] Strong database passwords
- [ ] JWT secrets are secure and unique
- [ ] SSL/TLS enabled
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Database backups automated
- [ ] Log monitoring enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Environment variables secured

## Maintenance

### Regular Tasks

- Monitor logs daily
- Check disk space weekly
- Review security updates monthly
- Test backups monthly
- Performance monitoring ongoing

### Updates

1. Pull latest code
2. Install dependencies: `npm install`
3. Run migrations: `npm run migration:run`
4. Build: `npm run build`
5. Restart: `pm2 restart mero-jugx-api`

## Support

For deployment issues:
- Check logs: `pm2 logs`
- Review documentation
- Check GitHub issues
- Contact support team

