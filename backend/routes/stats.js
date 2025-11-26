const express = require('express');
const { sequelize, User, Course } = require('../models');

const router = express.Router();

// @route   GET /api/stats/overview
// @desc    Public stats for marketing/homepage
router.get('/overview', async (req, res) => {
  try {
    const [studentCount, instructorCount, publishedCourseCount, ratingResult] = await Promise.all([
      User.count({ where: { role: 'student' } }),
      User.count({ where: { role: 'instructor' } }),
      Course.count({ where: { isPublished: true } }),
      Course.findAll({
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
        raw: true
      })
    ]);

    const rawAvgRating = ratingResult?.[0]?.avgRating;
    const avgRating = rawAvgRating
      ? parseFloat(Number(rawAvgRating).toFixed(1))
      : 0;

    res.json({
      activeStudents: studentCount,
      expertCourses: publishedCourseCount,
      instructors: instructorCount,
      averageRating: avgRating
    });
  } catch (error) {
    console.error('Stats overview error:', error);
    res.status(500).json({ message: 'Unable to fetch stats' });
  }
});

module.exports = router;

