# Deployment Guide

Complete guide for deploying Mero Jugx to production environments, including server setup, configuration, and production checklist.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Production Checklist](#production-checklist)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ database
- Redis (optional, for caching/sessions)
- Domain name and SSL certificate
- Server with sufficient resources

---

## 🖥️ Server Setup

### Server Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100Mbps

#### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1Gbps

### Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Redis (Optional)

```bash
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis
```

### Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🗄️ Database Setup

### Create Database

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE mero_jugx;
CREATE USER mero_jugx_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mero_jugx TO mero_jugx_user;
\q
```

### Run Migrations

```bash
cd /path/to/mero-jugx
npm run migration:run
npm run seed:run
```

---

## 🚀 Application Deployment

### Clone Repository

```bash
cd /var/www
git clone <repository-url> mero-jugx
cd mero-jugx
```

### Install Dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### Build Application

```bash
# Build backend
npm run build

# Build frontend
cd frontend
npm run build
cd ..
```

### Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
nano .env
```

**Required Environment Variables:**
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

# Application URLs
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Process Management

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

### Nginx Configuration

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

### SSL Certificate (Let's Encrypt)

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

### Firewall Configuration

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## ✅ Production Checklist

### Pre-Deployment

#### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Code linted and formatted (`npm run lint`)
- [ ] No console.log statements in production code
- [ ] Error handling implemented
- [ ] Input validation on all endpoints

#### Documentation
- [ ] README.md updated
- [ ] API documentation complete
- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] Changelog updated

#### Security
- [ ] All secrets changed from development values
- [ ] JWT secrets are strong and unique
- [ ] Database passwords are strong
- [ ] SMTP credentials configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input sanitization implemented
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF protection configured (if applicable)

### Environment Configuration

#### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT` configured correctly
- [ ] `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` set
- [ ] `DB_SYNCHRONIZE=false` (never true in production!)
- [ ] `DB_LOGGING=false` (or appropriate level)
- [ ] `JWT_SECRET` is strong and unique
- [ ] `JWT_REFRESH_SECRET` is strong and unique
- [ ] `SMTP_*` variables configured
- [ ] `FRONTEND_URL` set to production URL
- [ ] `APP_URL` set to production API URL
- [ ] All URLs use HTTPS

#### Database
- [ ] Database created and configured
- [ ] Database user has appropriate permissions
- [ ] Migrations tested and ready
- [ ] Seed data reviewed (remove test data if needed)
- [ ] Database backups configured
- [ ] Connection pooling configured
- [ ] Indexes optimized

#### Redis (if used)
- [ ] Redis server running
- [ ] Redis password set (if applicable)
- [ ] Redis persistence configured
- [ ] Redis memory limits set

### Server Configuration

#### Server Setup
- [ ] Server meets minimum requirements
- [ ] Operating system updated
- [ ] Firewall configured
- [ ] SSH access secured
- [ ] Non-root user created for application
- [ ] SSL certificate obtained and configured
- [ ] Domain DNS configured correctly

#### Process Management
- [ ] PM2 or similar process manager installed
- [ ] Process manager configured for auto-restart
- [ ] Log rotation configured
- [ ] Resource limits set (memory, CPU)

#### Web Server (Nginx)
- [ ] Web server installed and configured
- [ ] Reverse proxy configured
- [ ] SSL/TLS configured
- [ ] HTTP to HTTPS redirect configured
- [ ] Security headers configured
- [ ] Gzip compression enabled
- [ ] Static file serving configured

### Application Deployment

#### Build
- [ ] Backend built successfully (`npm run build`)
- [ ] Frontend built successfully (`cd frontend && npm run build`)
- [ ] Build artifacts in correct location
- [ ] No development dependencies in production build

#### Database
- [ ] Migrations run successfully
- [ ] Seed data loaded (if applicable)
- [ ] Database schema verified
- [ ] Foreign keys and constraints verified

#### Application Start
- [ ] Application starts without errors
- [ ] Health check endpoint responds
- [ ] API endpoints accessible
- [ ] Frontend loads correctly
- [ ] API documentation accessible

### Monitoring & Logging

#### Logging
- [ ] Logging configured
- [ ] Log levels appropriate for production
- [ ] Log rotation configured
- [ ] Error logging working
- [ ] Access logging enabled

#### Monitoring
- [ ] Application monitoring setup (if applicable)
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring configured
- [ ] Performance monitoring enabled
- [ ] Database monitoring enabled

#### Alerts
- [ ] Error alerts configured
- [ ] Uptime alerts configured
- [ ] Resource usage alerts configured
- [ ] Alert recipients configured

### Backup & Recovery

#### Backups
- [ ] Database backup script created
- [ ] Backup schedule configured (daily recommended)
- [ ] Backup retention policy set
- [ ] Backup storage location secure
- [ ] Backup restoration tested

#### Disaster Recovery
- [ ] Recovery procedure documented
- [ ] Recovery tested
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined

### Performance

#### Optimization
- [ ] Database queries optimized
- [ ] Database indexes created
- [ ] Caching configured (if applicable)
- [ ] CDN configured for static assets (if applicable)
- [ ] Image optimization implemented
- [ ] Code minification enabled

#### Load Testing
- [ ] Load testing performed
- [ ] Performance benchmarks met
- [ ] Scalability plan in place

### Security Audit

#### Security Checks
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Password policies enforced
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Authentication required for protected routes
- [ ] Authorization checks implemented
- [ ] Sensitive data encrypted
- [ ] Secrets not in code or logs

#### Vulnerability Scan
- [ ] Dependencies updated
- [ ] Known vulnerabilities checked
- [ ] Security patches applied
- [ ] Penetration testing considered

### Testing

#### Functionality
- [ ] All features tested
- [ ] Critical paths tested
- [ ] Edge cases tested
- [ ] Error scenarios tested

#### Integration
- [ ] API endpoints tested
- [ ] Database operations tested
- [ ] Email sending tested
- [ ] External integrations tested (if any)

#### User Acceptance
- [ ] User flows tested
- [ ] UI/UX verified
- [ ] Cross-browser testing done
- [ ] Mobile responsiveness verified

### Critical Items (Must Complete)

1. **Security**: All secrets changed, HTTPS configured
2. **Database**: Migrations run, backups configured
3. **Environment**: All variables set correctly
4. **Monitoring**: Logging and monitoring active
5. **Testing**: All critical paths tested

### Important Reminders

- Never use development credentials in production
- Always test in staging environment first
- Keep backups before major changes
- Monitor closely after deployment
- Have rollback plan ready

---

## 🔍 Post-Deployment

### Verify Deployment

- [ ] Application accessible via production URL
- [ ] API responding correctly
- [ ] Frontend loading correctly
- [ ] Database connections working
- [ ] Email sending working
- [ ] SSL certificate valid
- [ ] All features functional

### Monitoring Setup

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

### Backup Strategy

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

---

## 🐛 Troubleshooting

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

---

## 📚 Additional Resources

- [Environment Setup](./ENVIRONMENT-SETUP.md) - Environment configuration
- [Database Guide](./DATABASE-GUIDE.md) - Database setup and troubleshooting
- [Production Checklist](#production-checklist) - Complete checklist above
- [Developer Guide](../DEVELOPER_GUIDE.md) - Development setup

---

**Last Updated**: 2025-11-22
