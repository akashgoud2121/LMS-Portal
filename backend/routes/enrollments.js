const express = require('express');
const { Enrollment, Course, User, Lesson } = require('../models');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/enrollments/:courseId
// @desc    Enroll in a course (Student)
router.post('/:courseId', auth, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isPublished) {
      return res.status(400).json({ message: 'Course is not available for enrollment' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      where: {
        studentId: req.user.id,
        courseId: req.params.courseId
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const enrollment = await Enrollment.create({
      studentId: req.user.id,
      courseId: req.params.courseId
    });

    const enrollmentWithCourse = await Enrollment.findByPk(enrollment.id, {
      include: [{
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'thumbnail']
      }]
    });

    res.status(201).json(enrollmentWithCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments/my-enrollments
// @desc    Get student's enrollments
router.get('/my-enrollments', auth, authorize('student'), async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { studentId: req.user.id },
      include: [{
        model: Course,
        as: 'course',
        include: [{
          model: User,
          as: 'instructor',
          attributes: ['id', 'name', 'email', 'avatar']
        }]
      }],
      order: [['enrolledAt', 'DESC']]
    });

    // Normalize to include both id and _id for frontend compatibility
    const normalizedEnrollments = enrollments.map(enrollment => {
      const enrollmentJson = enrollment.toJSON();
      enrollmentJson._id = enrollmentJson.id;
      
      if (enrollmentJson.course) {
        enrollmentJson.course._id = enrollmentJson.course.id;
        if (enrollmentJson.course.instructor) {
          enrollmentJson.course.instructor._id = enrollmentJson.course.instructor.id;
        }
      }
      
      return enrollmentJson;
    });

    res.json(normalizedEnrollments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments/:enrollmentId
// @desc    Get enrollment details
router.get('/:enrollmentId', auth, authorize('student'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.enrollmentId, {
      include: [{
        model: Course,
        as: 'course',
        include: [{
          model: User,
          as: 'instructor',
          attributes: ['id', 'name', 'email', 'avatar']
        }]
      }]
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (enrollment.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(enrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/enrollments/:enrollmentId/complete-lesson
// @desc    Mark lesson as completed
router.post('/:enrollmentId/complete-lesson', auth, authorize('student'), async (req, res) => {
  try {
    const { lessonId } = req.body;
    const enrollment = await Enrollment.findByPk(req.params.enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (enrollment.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get completed lessons array (JSONB field)
    const completedLessons = enrollment.completedLessons || [];

    // Check if already completed
    const alreadyCompleted = completedLessons.some(
      cl => cl.lessonId === lessonId || cl.lesson === lessonId
    );

    if (!alreadyCompleted) {
      completedLessons.push({
        lessonId: lessonId,
        completedAt: new Date().toISOString()
      });

      // Update progress
      const course = await Course.findByPk(enrollment.courseId, {
        include: [{
          model: Lesson,
          as: 'lessons'
        }]
      });

      if (course && course.lessons && course.lessons.length > 0) {
        const progress = Math.round(
          (completedLessons.length / course.lessons.length) * 100
        );

        const updateData = {
          completedLessons,
          progress
        };

        if (progress === 100) {
          updateData.completed = true;
          updateData.completedAt = new Date();
        }

        await enrollment.update(updateData);
      } else {
        await enrollment.update({ completedLessons });
      }
    }

    const updatedEnrollment = await Enrollment.findByPk(enrollment.id, {
      include: [{
        model: Course,
        as: 'course'
      }]
    });

    res.json(updatedEnrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments/check/:courseId
// @desc    Check if student is enrolled
router.get('/check/:courseId', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      where: {
        studentId: req.user.id,
        courseId: req.params.courseId
      }
    });

    if (enrollment) {
      const enrollmentJson = enrollment.toJSON();
      enrollmentJson._id = enrollmentJson.id;
      res.json({ isEnrolled: true, enrollment: enrollmentJson });
    } else {
      res.json({ isEnrolled: false, enrollment: null });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
