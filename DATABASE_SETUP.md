# Database Setup Guide

## Render.com PostgreSQL Database Configuration

Your Render.com database URL has been configured. Follow these steps to set it up:

### 1. Backend Environment Variables

Create or update `backend/.env` file with the following:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration (Render.com)
DATABASE_URL=postgresql://lms:XUeOy19jK7TqOYfZlHODYNndhi1n1Ii7@dpg-d4isao4hg0os73a63mbg-a.oregon-postgres.render.com/lmsdatabase_uctg

# JWT Configuration
# IMPORTANT: Generate a strong secret using: openssl rand -base64 32
JWT_SECRET=your_secure_jwt_secret_here

# CORS Configuration
# Set this to your frontend Vercel URL
CORS_ORIGIN=https://your-project.vercel.app

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
BCRYPT_ROUNDS=10

# Logging
LOG_LEVEL=info
```

### 2. SSL Configuration

The database configuration (`backend/config/database.js`) automatically detects Render.com databases and enables SSL. No additional configuration needed.

### 3. Test Database Connection

To test the database connection:

```bash
cd backend
node -e "const { sequelize } = require('./models'); sequelize.authenticate().then(() => { console.log('Database connected!'); process.exit(0); }).catch(err => { console.error('Connection failed:', err.message); process.exit(1); });"
```

### 4. Run Database Migrations

If you haven't run migrations yet:

```bash
cd backend
npm run migrate:materials
```

### 5. Create Admin User

Create your first admin user:

```bash
cd backend
npm run seed:admin
```

## Important Security Notes

⚠️ **SECURITY WARNING**: 
- Never commit your `.env` file to Git (it's already in `.gitignore`)
- Never share your database credentials publicly
- Change the default JWT_SECRET to a secure random string
- Use environment variables in your hosting platform (Render, Heroku, etc.)

## Render.com Database Features

- ✅ SSL/TLS encryption (automatically configured)
- ✅ Automatic backups
- ✅ High availability
- ✅ Connection pooling support

## Connection String Format

Your Render.com database connection string format:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

The configuration automatically:
- Detects `render.com` in the hostname
- Enables SSL with `require: true`
- Sets `rejectUnauthorized: false` (required for Render.com)

## Troubleshooting

### Connection Timeout
- Check if your IP is whitelisted (Render.com databases are accessible from anywhere by default)
- Verify the database is running in Render dashboard

### SSL Errors
- The configuration already handles SSL for Render.com
- If issues persist, check Render.com database status

### Authentication Failed
- Verify username and password are correct
- Check database name matches: `lmsdatabase_uctg`

## Production Deployment

When deploying to Render.com or other platforms:

1. **Set Environment Variables** in your hosting platform:
   - `DATABASE_URL` - Your Render.com database URL
   - `JWT_SECRET` - Secure random string
   - `CORS_ORIGIN` - Your frontend URL
   - `NODE_ENV=production`

2. **Database is External**: Your database is already hosted on Render.com, so you just need to connect to it.

3. **No Local Database Needed**: You can use the same database URL for both development and production, or use separate databases.

