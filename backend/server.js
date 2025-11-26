const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
if (process.env.NODE_ENV === 'production') {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error(`FATAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  // Warn if using default JWT_SECRET in production
  if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_this_in_production') {
    console.error('FATAL ERROR: JWT_SECRET must be changed from default value in production!');
    process.exit(1);
  }
}

const app = express();

// Security middleware
const { securityHeaders, apiLimiter } = require('./middleware/security');
app.use(securityHeaders);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*')
    : (process.env.CORS_ORIGIN || '*'),
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
}, express.static('uploads'));

// Database connection
sequelize.authenticate()
  .then(() => {
    console.log('✓ PostgreSQL Database Connected');
    // Sync models - only use alter in development, never in production
    if (process.env.NODE_ENV === 'production') {
      // In production, use migrations instead of sync
      console.log('✓ Running in production mode - using migrations');
      return Promise.resolve();
    } else {
      // In development, allow schema alterations
      return sequelize.sync({ alter: true });
    }
  })
  .then(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('✓ Database models synchronized');
    }
  })
  .catch(err => {
    console.error('✗ Database connection error:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1); // Exit on database connection failure in production
    }
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/stats', require('./routes/stats'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('✓ Production mode enabled');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    sequelize.close().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    sequelize.close().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

