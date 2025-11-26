const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.POSTGRESQL_URI, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.DATABASE_URL?.includes('render.com') || process.env.POSTGRESQL_URI?.includes('render.com') ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

module.exports = sequelize;

