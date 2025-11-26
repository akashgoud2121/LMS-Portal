const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./models');

dotenv.config();

const app = express();

// Middleware
// CORS configuration - update for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // Set specific origin in production
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
}, express.static('uploads'));

// Database connection
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL Database Connected');
    // Sync models - only use alter in development, never in production
    const syncOptions = process.env.NODE_ENV === 'production' 
      ? { alter: false }  // In production, use migrations instead
      : { alter: true };   // In development, allow schema alterations
    return sequelize.sync(syncOptions);
  })
  .then(() => {
    console.log('Database models synchronized');
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1); // Exit on database connection failure
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

