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
      
      // Ensure completedLessons is always an array
      if (!Array.isArray(enrollmentJson.completedLessons)) {
        enrollmentJson.completedLessons = [];
      }
      
      // Ensure progress is a number
      if (typeof enrollmentJson.progress !== 'number') {
        enrollmentJson.progress = 0;
      }
      
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

// Helper function to normalize lesson ID for comparison
const normalizeLessonId = (id) => {
  if (!id) return null;
  return String(id).trim();
};

// Helper function to find lesson in completed lessons array
const findLessonInCompleted = (completedLessons, lessonId) => {
  const normalizedLessonId = normalizeLessonId(lessonId);
  if (!normalizedLessonId) return -1;
  
  return completedLessons.findIndex(cl => {
    if (!cl) return false;
    // Try multiple formats
    const clId = normalizeLessonId(cl.lessonId || cl.lesson || cl);
    if (!clId) return false;
    
    const match = clId === normalizedLessonId;
    if (match) {
      console.log('Found lesson match:', {
        lessonId: normalizedLessonId,
        completedLessonId: clId,
        completedLesson: cl
      });
    }
    return match;
  });
};

// Helper function to update enrollment progress and completion status
const updateEnrollmentProgress = async (enrollment, completedLessons) => {
  // Get total lessons count
  const lessonCount = await Lesson.count({
    where: { courseId: enrollment.courseId }
  });

  if (lessonCount > 0) {
    const progress = Math.round(
      (completedLessons.length / lessonCount) * 100
    );

    const updateData = {
      completedLessons,
      progress
    };

    // Only mark as completed if ALL lessons are completed
    if (progress === 100 && completedLessons.length === lessonCount) {
      updateData.completed = true;
      updateData.completedAt = new Date();
    } else {
      // If progress is not 100%, mark as not completed
      updateData.completed = false;
      updateData.completedAt = null;
    }

    await enrollment.update(updateData);
  } else {
    // If no lessons, just update completedLessons
    await enrollment.update({ 
      completedLessons,
      progress: 0,
      completed: false,
      completedAt: null
    });
  }
};

// @route   POST /api/enrollments/:enrollmentId/mark-complete
// @desc    Mark lesson as completed
router.post('/:enrollmentId/mark-complete', auth, authorize('student'), async (req, res) => {
  try {
    const { lessonId } = req.body;
    const enrollment = await Enrollment.findByPk(req.params.enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (enrollment.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!lessonId) {
      return res.status(400).json({ message: 'Lesson ID is required' });
    }

    // Get completed lessons array (JSONB field)
    const completedLessons = Array.isArray(enrollment.completedLessons) 
      ? [...enrollment.completedLessons] 
      : [];

    // Check if already completed
    const lessonIndex = findLessonInCompleted(completedLessons, lessonId);

    if (lessonIndex === -1) {
      // Add to completed lessons
      completedLessons.push({
        lessonId: normalizeLessonId(lessonId),
        completedAt: new Date().toISOString()
      });
    }

    // Update progress and completion status
    await updateEnrollmentProgress(enrollment, completedLessons);

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

// @route   POST /api/enrollments/:enrollmentId/mark-incomplete
// @desc    Mark lesson as incomplete
router.post('/:enrollmentId/mark-incomplete', auth, authorize('student'), async (req, res) => {
  try {
    const { lessonId } = req.body;
    const enrollment = await Enrollment.findByPk(req.params.enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (enrollment.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!lessonId) {
      return res.status(400).json({ message: 'Lesson ID is required' });
    }

    // Get completed lessons array (JSONB field)
    const completedLessons = Array.isArray(enrollment.completedLessons) 
      ? [...enrollment.completedLessons] 
      : [];

    // Find and remove from completed lessons
    const lessonIndex = findLessonInCompleted(completedLessons, lessonId);

    console.log('Marking lesson as incomplete:', {
      enrollmentId: req.params.enrollmentId,
      lessonId: lessonId,
      lessonIndex: lessonIndex,
      completedLessonsBefore: completedLessons.length,
      completedLessonsArray: completedLessons
    });

    if (lessonIndex !== -1) {
      // Remove from completed lessons
      completedLessons.splice(lessonIndex, 1);
      console.log('Removed lesson from completed, new count:', completedLessons.length);
    } else {
      console.log('Lesson not found in completed lessons array');
    }

    // Update progress and completion status (this will mark course as incomplete if needed)
    await updateEnrollmentProgress(enrollment, completedLessons);
    
    console.log('Enrollment updated after marking incomplete:', {
      enrollmentId: enrollment.id,
      completedLessonsCount: completedLessons.length,
      progress: enrollment.progress,
      completed: enrollment.completed
    });

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

// @route   POST /api/enrollments/:enrollmentId/complete-lesson
// @desc    Mark lesson as completed (legacy endpoint for backward compatibility)
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
    const completedLessons = Array.isArray(enrollment.completedLessons) 
      ? [...enrollment.completedLessons] 
      : [];

    // Check if already completed
    const lessonIndex = findLessonInCompleted(completedLessons, lessonId);

    const alreadyCompleted = lessonIndex !== -1;

    // Toggle completion status
    if (alreadyCompleted) {
      // Remove from completed lessons
      completedLessons.splice(lessonIndex, 1);
    } else {
      // Add to completed lessons
      completedLessons.push({
        lessonId: normalizeLessonId(lessonId),
        completedAt: new Date().toISOString()
      });
    }

    // Update progress and completion status
    await updateEnrollmentProgress(enrollment, completedLessons);

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
