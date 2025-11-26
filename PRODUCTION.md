# Production Deployment Guide

This guide will help you deploy the EduMaster LMS application to production.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- A production server (VPS, cloud instance, etc.)
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)

## Pre-Deployment Checklist

### 1. Environment Variables

#### Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/edumaster

# JWT Configuration (REQUIRED - Generate using: openssl rand -base64 32)
JWT_SECRET=your_secure_random_secret_here

# CORS Configuration (Set to your frontend domain)
CORS_ORIGIN=https://yourdomain.com
# Or for multiple origins:
# CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
BCRYPT_ROUNDS=10
```

#### Frontend Environment Variables

Create a `.env.production` file in the `frontend` directory:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_NODE_ENV=production
```

### 2. Database Setup

1. **Create Production Database**
   ```bash
   createdb edumaster_production
   # Or using psql
   psql -U postgres
   CREATE DATABASE edumaster_production;
   ```

2. **Run Database Migrations**
   ```bash
   cd backend
   node scripts/addMaterialAssociations.js
   ```

3. **Create Admin User**
   ```bash
   cd backend
   npm run seed:admin
   ```

### 3. Security Configuration

1. **Generate JWT Secret**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and set it as `JWT_SECRET` in your `.env` file.

2. **Update CORS Origin**
   - Set `CORS_ORIGIN` to your frontend domain
   - Never use `*` in production

3. **File Permissions**
   ```bash
   chmod 755 backend/uploads
   ```

## Deployment Steps

### Option 1: Using PM2 (Recommended for Node.js)

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install --production
   ```

4. **Start Backend with PM2**
   ```bash
   cd backend
   pm2 start server.js --name edumaster-backend
   pm2 save
   pm2 startup
   ```

5. **Serve Frontend**
   - Option A: Use a web server (Nginx/Apache) to serve the `frontend/dist` directory
   - Option B: Use PM2 with `serve`:
     ```bash
     npm install -g serve
     pm2 serve frontend/dist 3000 --name edumaster-frontend --spa
     ```

### Option 2: Using Docker

1. **Create Dockerfile for Backend**
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 5000
   CMD ["node", "server.js"]
   ```

2. **Create Dockerfile for Frontend**
   ```dockerfile
   FROM node:16-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **Build and Run**
   ```bash
   docker-compose up -d
   ```

### Option 3: Using Cloud Platforms

#### Heroku

1. **Install Heroku CLI**
2. **Create Heroku Apps**
   ```bash
   heroku create edumaster-backend
   heroku create edumaster-frontend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_secret
   heroku config:set DATABASE_URL=your_database_url
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

#### Render

1. Create a new Web Service for backend
2. Create a new Static Site for frontend
3. Set environment variables in the dashboard
4. Connect your GitHub repository

#### Railway

1. Create a new project
2. Add PostgreSQL service
3. Deploy backend and frontend as separate services
4. Set environment variables

## Nginx Configuration

If using Nginx as a reverse proxy:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL/HTTPS Setup

1. **Install Certbot**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Obtain SSL Certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Auto-renewal**
   Certbot sets up auto-renewal automatically.

## Monitoring and Maintenance

### Health Checks

The application includes a health check endpoint:
```
GET /health
```

### Logs

- **PM2 Logs**: `pm2 logs edumaster-backend`
- **Nginx Logs**: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- **Application Logs**: Check your logging service or PM2 logs

### Database Backups

Set up regular database backups:

```bash
# Daily backup script
pg_dump edumaster_production > backup_$(date +%Y%m%d).sql
```

### Updates

1. Pull latest changes
2. Run `npm install` in both frontend and backend
3. Build frontend: `npm run build`
4. Restart services: `pm2 restart edumaster-backend`

## Performance Optimization

1. **Enable Gzip Compression** (in Nginx)
2. **Use CDN** for static assets
3. **Enable Caching** for static files
4. **Database Indexing** - Ensure proper indexes on frequently queried columns
5. **Connection Pooling** - Configure Sequelize connection pool

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use strong, unique JWT secrets
3. ✅ Enable HTTPS/SSL
4. ✅ Set proper CORS origins
5. ✅ Use environment-specific configurations
6. ✅ Regular security updates
7. ✅ Implement rate limiting (already included)
8. ✅ Use parameterized queries (Sequelize handles this)
9. ✅ Validate all user inputs
10. ✅ Keep dependencies updated

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Verify network/firewall settings

### CORS Errors
- Verify `CORS_ORIGIN` matches your frontend domain
- Check browser console for specific errors

### File Upload Issues
- Verify `uploads` directory exists and has write permissions
- Check `MAX_FILE_SIZE` setting

### Performance Issues
- Check database query performance
- Monitor server resources (CPU, memory)
- Review application logs for errors

## Support

For issues and questions, please refer to the main README.md or open an issue in the repository.

