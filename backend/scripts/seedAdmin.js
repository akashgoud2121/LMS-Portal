const { User, sequelize } = require('../models');
const dotenv = require('dotenv');

dotenv.config();

const createAdmin = async () => {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection established.');

    const email = process.argv[2] || 'admin@edumaster.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Admin User';

    // Check if admin exists
    const existingAdmin = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingAdmin) {
      console.log('Admin user already exists with this email');
      await sequelize.close();
      process.exit(0);
    }

    // Create admin user - check if this is the master admin
    const isMasterAdmin = email.toLowerCase() === 'admin@edumaster.com';
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      isActive: true,
      isMasterAdmin: isMasterAdmin,
      approvalStatus: 'approved'
    });

    console.log('Admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\nPlease change the password after first login.');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    await sequelize.close();
    process.exit(1);
  }
};

createAdmin();
