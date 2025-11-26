// Script to view all tables and data in PostgreSQL database
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

async function viewDatabaseInfo() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established!\n');

    // Get all tables
    console.log('📊 DATABASE TABLES:');
    console.log('='.repeat(50));
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;",
      { type: QueryTypes.SELECT }
    );
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });

    // Get row counts for each table
    console.log('\n📈 ROW COUNTS:');
    console.log('='.repeat(50));
    for (const table of tables) {
      const tableName = table.table_name;
      const result = await sequelize.query(
        `SELECT COUNT(*) as count FROM "${tableName}";`,
        { type: QueryTypes.SELECT }
      );
      console.log(`${tableName}: ${result[0].count} rows`);
    }

    // Show Users table data
    console.log('\n👥 USERS TABLE:');
    console.log('='.repeat(50));
    const users = await sequelize.query('SELECT id, name, email, role, "isActive", "createdAt" FROM "Users" ORDER BY "createdAt" DESC LIMIT 10;', {
      type: QueryTypes.SELECT
    });
    console.table(users);

    // Show Courses table data
    console.log('\n📚 COURSES TABLE:');
    console.log('='.repeat(50));
    const courses = await sequelize.query('SELECT id, title, category, "isPublished", "instructorId", "createdAt" FROM "Courses" ORDER BY "createdAt" DESC LIMIT 10;', {
      type: QueryTypes.SELECT
    });
    console.table(courses);

    // Show Enrollments table data
    console.log('\n🎓 ENROLLMENTS TABLE:');
    console.log('='.repeat(50));
    const enrollments = await sequelize.query('SELECT id, "studentId", "courseId", progress, completed, "enrolledAt" FROM "Enrollments" ORDER BY "enrolledAt" DESC LIMIT 10;', {
      type: QueryTypes.SELECT
    });
    console.table(enrollments);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

viewDatabaseInfo();

