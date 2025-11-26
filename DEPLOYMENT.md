# Deployment Guide - EduMaster LMS

This guide covers deploying the EduMaster LMS application to production.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database (local or cloud)
- Git repository
- Hosting platform account (Render, Heroku, Vercel, etc.)

## Environment Setup

### Backend Environment Variables

Create a .env file in the ackend directory with the following variables:

`env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_strong_random_secret_key_here
CORS_ORIGIN=https://your-frontend-domain.com
`

**Important:**
- Generate a strong JWT_SECRET: openssl rand -base64 32
- Use a production PostgreSQL database (not localhost)
- Set CORS_ORIGIN to your frontend domain

### Frontend Environment Variables

Create a .env file in the rontend directory:

`env
VITE_API_URL=https://your-backend-api.com
`

## Database Setup

### 1. Create Production Database

`ash
# Using psql
psql -U postgres
CREATE DATABASE edumaster_production;
`

### 2. Run Migrations

The application uses Sequelize's sync() method. In production, ensure:
- NODE_ENV=production is set
- Database schema is created automatically on first run
- For production, consider using Sequelize migrations instead of sync()

### 3. Seed Admin User

`ash
cd backend
npm run seed:admin admin@yourdomain.com securepassword "Admin Name"
`

## Deployment Options

### Option 1: Render.com

#### Backend Deployment

1. Connect your GitHub repository
2. Create a new Web Service
3. Configure:
   - **Build Command**: cd backend && npm install
   - **Start Command**: cd backend && npm start
   - **Environment Variables**: Add all backend .env variables
4. Add PostgreSQL database and connect it

#### Frontend Deployment

1. Create a new Static Site
2. Configure:
   - **Build Command**: cd frontend && npm install && npm run build
   - **Publish Directory**: rontend/dist
3. Add environment variable: VITE_API_URL

### Option 2: Heroku

#### Backend Deployment

1. Install Heroku CLI
2. Create Heroku app:
   `ash
   heroku create your-app-name
   `
3. Add PostgreSQL addon:
   `ash
   heroku addons:create heroku-postgresql:hobby-dev
   `
4. Set environment variables:
   `ash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_secret_key
   `
5. Deploy:
   `ash
   git push heroku main
   `

#### Frontend Deployment

1. Use Heroku buildpack for static sites or deploy to Vercel/Netlify
2. Set VITE_API_URL environment variable

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

#### Backend (Railway/Render)
- Follow similar steps as Render.com above
- Ensure CORS is configured for your frontend domain

#### Frontend (Vercel)
1. Import your GitHub repository
2. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: rontend
   - **Build Command**: 
pm run build
   - **Output Directory**: dist
3. Add environment variable: VITE_API_URL

## Production Checklist

### Security
- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly (not *)
- [ ] Remove console.log statements (use proper logging)
- [ ] Set secure cookie flags if using cookies
- [ ] Enable rate limiting on API endpoints

### Database
- [ ] Use production PostgreSQL instance
- [ ] Enable database backups
- [ ] Set up connection pooling
- [ ] Monitor database performance

### Application
- [ ] Set NODE_ENV=production
- [ ] Disable database sync alterations (lter: false)
- [ ] Configure proper error handling
- [ ] Set up logging (Winston, Morgan, etc.)
- [ ] Configure file upload limits
- [ ] Set up CDN for static assets

### Frontend
- [ ] Build production bundle (
pm run build)
- [ ] Set correct API URL
- [ ] Enable source maps only for debugging
- [ ] Optimize images and assets
- [ ] Test on multiple browsers

## Post-Deployment

### 1. Verify Deployment

- Test API endpoints: https://your-api.com/api/auth/me
- Test frontend: https://your-frontend.com
- Verify database connection
- Test file uploads

### 2. Monitor

- Set up error tracking (Sentry, LogRocket)
- Monitor server logs
- Set up uptime monitoring
- Monitor database performance

### 3. Backup Strategy

- Regular database backups
- Backup uploaded files
- Version control for code

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format
- Check database firewall rules
- Ensure SSL is configured if required

### CORS Errors
- Verify CORS_ORIGIN matches frontend URL
- Check browser console for specific errors
- Ensure backend allows credentials if needed

### File Upload Issues
- Check upload directory permissions
- Verify file size limits
- Ensure storage is accessible

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors

## Scaling Considerations

- Use connection pooling for database
- Implement caching (Redis)
- Use CDN for static assets
- Consider load balancing for backend
- Optimize database queries
- Implement rate limiting

## Support

For deployment issues, check:
- Platform-specific documentation
- Application logs
- Database connection logs
- Browser console errors
