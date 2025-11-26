const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRESQL_URI;

// Detect if using Render.com database (requires SSL)
const isRenderDatabase = databaseUrl?.includes('render.com') || databaseUrl?.includes('oregon-postgres.render.com');

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: isRenderDatabase ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  // Connection pool settings for production
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;

