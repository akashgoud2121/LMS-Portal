const { sequelize, Material } = require('../models');

async function addMaterialAssociations() {
  try {
    console.log('Adding courseId and lessonId columns to Materials table...');
    
    // Check if columns already exist
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Materials' 
      AND column_name IN ('courseId', 'lessonId')
    `);
    
    const existingColumns = results.map(r => r.column_name);
    
    if (!existingColumns.includes('courseId')) {
      await sequelize.query(`
        ALTER TABLE "Materials" 
        ADD COLUMN "courseId" UUID REFERENCES "Courses"(id) ON DELETE SET NULL
      `);
      console.log('✓ Added courseId column');
    } else {
      console.log('✓ courseId column already exists');
    }
    
    if (!existingColumns.includes('lessonId')) {
      await sequelize.query(`
        ALTER TABLE "Materials" 
        ADD COLUMN "lessonId" UUID REFERENCES "Lessons"(id) ON DELETE SET NULL
      `);
      console.log('✓ Added lessonId column');
    } else {
      console.log('✓ lessonId column already exists');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

addMaterialAssociations();

