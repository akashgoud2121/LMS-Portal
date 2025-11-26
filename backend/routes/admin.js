const express = require('express');
const { QueryTypes, Op } = require('sequelize');
const { body } = require('express-validator');
const { User, Course, Enrollment, Quiz, QuizAttempt, Lesson, sequelize } = require('../models');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin role
router.use(auth);
router.use(authorize('admin'));

// @route   GET /api/admin/users
// @desc    Get all users (excludes admin users by default unless role filter is set to 'admin')
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    const where = {};

    if (role) {
      where.role = role;
    } else {
      // By default, exclude admin users from the list (admin is not a regular user)
      where.role = { [Op.ne]: 'admin' };
    }
    
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    // Include isMasterAdmin in response
    const usersWithMasterFlag = users.map(u => {
      const userObj = u.toJSON();
      return userObj;
    });
    res.json(usersWithMasterFlag);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (activate/deactivate, change role, approve/reject)
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent modifying master admin
    if (user.isMasterAdmin && req.user.id !== user.id) {
      // Allow master admin to modify themselves, but prevent others from modifying master admin
      if (role || isActive !== undefined) {
        return res.status(403).json({ message: 'Master admin cannot be modified by other admins' });
      }
    }

    const { role, isActive, approvalStatus, rejectionReason } = req.body;
    if (role && !user.isMasterAdmin) user.role = role; // Don't change master admin role
    if (isActive !== undefined && !user.isMasterAdmin) user.isActive = isActive; // Don't deactivate master admin
    if (approvalStatus) user.approvalStatus = approvalStatus;
    if (rejectionReason !== undefined) user.rejectionReason = rejectionReason;

    await user.save();
    const userObj = user.toJSON();
    delete userObj.password;

    res.json(userObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/users/:id/approve
// @desc    Approve a pending user
router.post('/users/:id/approve', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.approvalStatus = 'approved';
    user.rejectionReason = null;
    await user.save();

    const userObj = user.toJSON();
    delete userObj.password;

    res.json({ message: 'User approved successfully', user: userObj });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/users/:id/reject
// @desc    Reject a pending user
router.post('/users/:id/reject', [
  body('rejectionReason').optional().trim()
], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.approvalStatus = 'rejected';
    user.rejectionReason = req.body.rejectionReason || 'No reason provided';
    await user.save();

    const userObj = user.toJSON();
    delete userObj.password;

    res.json({ message: 'User rejected', user: userObj });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users/pending
// @desc    Get all pending users (students, instructors, and admins)
router.get('/users/pending', async (req, res) => {
  try {
    const { role } = req.query;
    const where = { approvalStatus: 'pending' };
    
    if (role) {
      where.role = role;
    } else {
      // If no role filter, exclude master admin from pending list
      where.isMasterAdmin = false;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users/approval-stats
// @desc    Get approval statistics (pending, approved, rejected counts)
router.get('/users/approval-stats', async (req, res) => {
  try {
    const pendingCount = await User.count({
      where: {
        approvalStatus: 'pending',
        isMasterAdmin: false
      }
    });

    const approvedCount = await User.count({
      where: {
        approvalStatus: 'approved'
      }
    });

    const rejectedCount = await User.count({
      where: {
        approvalStatus: 'rejected'
      }
    });

    res.json({
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (master admin cannot be deleted)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of master admin
    if (user.isMasterAdmin) {
      return res.status(403).json({ message: 'Master admin cannot be deleted' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/register
// @desc    Register a new admin (only master admin can create other admins)
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check if current user is master admin
    const currentUser = await User.findByPk(req.user.id);
    if (!currentUser || !currentUser.isMasterAdmin) {
      return res.status(403).json({ message: 'Only master admin can create new admins' });
    }

    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create admin user (not master admin)
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      isActive: true,
      isMasterAdmin: false,
      approvalStatus: 'approved'
    });

    const adminObj = admin.toJSON();
    delete adminObj.password;

    res.status(201).json({
      message: 'Admin created successfully',
      user: adminObj
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during admin registration' });
  }
});

// @route   GET /api/admin/courses
// @desc    Get all courses (admin view)
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }, {
        model: Lesson,
        as: 'lessons',
        attributes: ['id']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Format response to include totalLessons and enrolledStudents count
    const formattedCourses = await Promise.all(courses.map(async (course) => {
      const courseJson = course.toJSON();
      courseJson.totalLessons = course.lessons ? course.lessons.length : 0;
      
      // Count enrollments
      const enrollmentCount = await Enrollment.count({
        where: { courseId: course.id }
      });
      courseJson.enrolledStudents = enrollmentCount;
      
      return courseJson;
    }));

    res.json(formattedCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/courses/:id/publish
// @desc    Publish/unpublish course
router.put('/courses/:id/publish', async (req, res) => {
  try {
    const { isPublished } = req.body;
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.isPublished = isPublished !== undefined ? isPublished : !course.isPublished;
    await course.save();
    
    const updatedCourse = await Course.findByPk(course.id, {
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json(updatedCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    // Exclude admin users from total count (admin is not a regular user)
    const totalUsers = await User.count({ where: { role: { [Op.ne]: 'admin' } } });
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalInstructors = await User.count({ where: { role: 'instructor' } });
    const totalCourses = await Course.count();
    const publishedCourses = await Course.count({ where: { isPublished: true } });
    const totalEnrollments = await Enrollment.count();
    
    // Safely get quiz attempts count
    let totalQuizAttempts = 0;
    try {
      if (QuizAttempt) {
        totalQuizAttempts = await QuizAttempt.count();
      }
    } catch (err) {
      console.log('QuizAttempt count error:', err.message);
    }

    // Recent activity
    let recentEnrollments = [];
    try {
      const enrollments = await Enrollment.findAll({
        include: [
          { model: User, as: 'student', attributes: ['id', 'name'], required: false },
          { model: Course, as: 'course', attributes: ['id', 'title'], required: false }
        ],
        order: [['enrolledAt', 'DESC']],
        limit: 10
      });
      
      // Format enrollment data for frontend
      recentEnrollments = enrollments.map(enrollment => {
        const enrollmentData = enrollment.toJSON();
        return {
          id: enrollmentData.id,
          student: enrollmentData.student || { name: 'Unknown' },
          course: enrollmentData.course || { title: 'Unknown Course' },
          enrolledAt: enrollmentData.enrolledAt || enrollmentData.createdAt || new Date().toISOString()
        };
      });
    } catch (err) {
      console.log('Recent enrollments error:', err.message);
      recentEnrollments = [];
    }

    // Generate real chart data for last 6 months
    const enrollmentStats = [];
    const userGrowthStats = [];
    
    try {
      // Get last 6 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const last6Months = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
          year: date.getFullYear(),
          month: date.getMonth(),
          name: monthNames[date.getMonth()]
        });
      }
      
      // Calculate enrollment stats by month
      for (const { year, month, name } of last6Months) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
        
        // Count enrollments in this month
        const enrollmentsCount = await Enrollment.count({
          where: {
            enrolledAt: {
              [Op.between]: [startDate, endDate]
            }
          }
        });
        
        enrollmentStats.push({
          month: name,
          enrollments: enrollmentsCount
        });
        
        // Count users created in this month (cumulative) - exclude admin users
        const usersCount = await User.count({
          where: {
            createdAt: {
              [Op.lte]: endDate
            },
            role: { [Op.ne]: 'admin' }
          }
        });
        
        userGrowthStats.push({
          month: name,
          users: usersCount
        });
      }
    } catch (err) {
      console.log('Chart data calculation error:', err.message);
      // If error, return empty arrays - frontend will handle gracefully
    }

    res.json({
      overview: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        totalQuizAttempts
      },
      recentEnrollments: recentEnrollments || [],
      enrollmentStats: enrollmentStats || [],
      userGrowthStats: userGrowthStats || []
    });
  } catch (error) {
    console.error('Analytics endpoint error:', error);
    console.error('Error stack:', error.stack);
    
    // Return default structure even on error so frontend doesn't break
    res.status(200).json({
      overview: {
        totalUsers: 0,
        totalStudents: 0,
        totalInstructors: 0,
        totalCourses: 0,
        publishedCourses: 0,
        totalEnrollments: 0,
        totalQuizAttempts: 0
      },
      recentEnrollments: [],
      enrollmentStats: [],
      userGrowthStats: []
    });
  }
});

// @route   GET /api/admin/database-info
// @desc    Get database information (tables, row counts)
router.get('/database-info', async (req, res) => {
  try {
    // Get all tables
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;",
      { type: QueryTypes.SELECT }
    );
    
    // Get row counts for each table
    const stats = {};
    for (const table of tables) {
      const result = await sequelize.query(
        `SELECT COUNT(*) as count FROM "${table.table_name}";`,
        { type: QueryTypes.SELECT }
      );
      stats[table.table_name] = parseInt(result[0].count);
    }
    
    // Get sample data from each table
    const sampleData = {};
    for (const table of tables) {
      const tableName = table.table_name;
      try {
        const data = await sequelize.query(
          `SELECT * FROM "${tableName}" LIMIT 5;`,
          { type: QueryTypes.SELECT }
        );
        sampleData[tableName] = data;
      } catch (err) {
        sampleData[tableName] = { error: 'Could not fetch data' };
      }
    }
    
    res.json({
      tables: tables.map(t => t.table_name),
      rowCounts: stats,
      sampleData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
