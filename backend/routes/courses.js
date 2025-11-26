const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { Course, Lesson, Enrollment, User } = require('../models');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all published courses (with filters)
router.get('/', async (req, res) => {
  try {
    const { category, search, instructor } = req.query;
    const where = { isPublished: true };

    if (category) where.category = category;
    if (instructor) where.instructorId = instructor;

    const includeOptions = [{
      model: User,
      as: 'instructor',
      attributes: ['id', 'name', 'email', 'avatar']
    }, {
      model: Lesson,
      as: 'lessons',
      attributes: ['id', 'title', 'order']
    }];

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const courses = await Course.findAll({
      where,
      include: includeOptions,
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
      
      // Normalize to include both id and _id for frontend compatibility
      courseJson._id = courseJson.id;
      
      return courseJson;
    }));

    res.json(formattedCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'instructor',
          attributes: ['id', 'name', 'email', 'avatar', 'bio']
        },
        {
          model: Lesson,
          as: 'lessons',
          order: [['order', 'ASC']]
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is enrolled (if authenticated)
    let isEnrolled = false;
    if (req.header('Authorization')) {
      try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production');
          const enrollment = await Enrollment.findOne({
            where: {
              studentId: decoded.userId,
              courseId: req.params.id
            }
          });
          isEnrolled = !!enrollment;
        }
      } catch (error) {
        // Token invalid or user not authenticated, continue with isEnrolled = false
      }
    }

    const courseJson = course.toJSON();
    courseJson.totalLessons = course.lessons ? course.lessons.length : 0;
    
    // Count enrollments
    const enrollmentCount = await Enrollment.count({
      where: { courseId: course.id }
    });
    courseJson.enrolledStudents = enrollmentCount;

    // Normalize to include both id and _id for frontend compatibility
    courseJson._id = courseJson.id;
    
    // Normalize instructor object
    if (courseJson.instructor) {
      courseJson.instructor._id = courseJson.instructor.id;
    }
    
    // Normalize lessons array
    if (courseJson.lessons && Array.isArray(courseJson.lessons)) {
      courseJson.lessons = courseJson.lessons.map((lesson) => {
        lesson._id = lesson.id;
        return lesson;
      });
    }

    res.json({ course: courseJson, isEnrolled });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses
// @desc    Create a new course (Instructor only)
router.post('/', auth, authorize('instructor', 'admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.create({
      ...req.body,
      instructorId: req.user.id
    });

    const courseWithInstructor = await Course.findByPk(course.id, {
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email', 'avatar']
      }]
    });

    // Normalize response to include both id and _id for frontend compatibility
    const courseData = courseWithInstructor.toJSON();
    courseData._id = courseData.id;

    res.status(201).json(courseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course (Instructor/Owner or Admin)
router.put('/:id', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    await course.update(req.body);

    const updatedCourse = await Course.findByPk(course.id, {
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email', 'avatar']
      }]
    });

    res.json(updatedCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course (Instructor/Owner or Admin)
router.delete('/:id', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    await course.destroy();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/:id/lessons
// @desc    Add lesson to course (Instructor/Owner)
router.post('/:id/lessons', auth, authorize('instructor', 'admin'), [
  body('title').trim().notEmpty().withMessage('Lesson title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get current lesson count to determine order
    const lessonCount = await Lesson.count({ where: { courseId: course.id } });
    const order = lessonCount + 1;

    // Prepare lesson data
    const lessonData = {
      title: req.body.title.trim(),
      description: req.body.description || '',
      videoUrl: req.body.videoUrl || '',
      videoFile: req.body.videoFile || '',
      courseId: course.id,
      order,
      duration: req.body.duration || 0,
      materials: req.body.materials || []
    };

    console.log('Creating lesson with data:', {
      title: lessonData.title,
      videoUrl: lessonData.videoUrl,
      courseId: lessonData.courseId,
      order: lessonData.order
    });

    const lesson = await Lesson.create(lessonData);
    
    console.log('Lesson created successfully:', {
      id: lesson.id,
      title: lesson.title,
      videoUrl: lesson.videoUrl
    });

    // Update course totalLessons
    await course.update({ totalLessons: lessonCount + 1 });

    const courseWithLessons = await Course.findByPk(course.id, {
      include: [{
        model: Lesson,
        as: 'lessons',
        order: [['order', 'ASC']]
      }]
    });

    // Normalize response
    const courseJson = courseWithLessons.toJSON();
    courseJson._id = courseJson.id;
    if (courseJson.lessons) {
      courseJson.lessons = courseJson.lessons.map((l) => {
        l._id = l.id;
        return l;
      });
    }

    res.status(201).json(courseJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id/lessons/:lessonId
// @desc    Update lesson (Instructor/Owner)
router.put('/:id/lessons/:lessonId', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lesson = await Lesson.findByPk(req.params.lessonId);
    if (!lesson || lesson.courseId !== course.id) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    await lesson.update(req.body);

    const courseWithLessons = await Course.findByPk(course.id, {
      include: [{
        model: Lesson,
        as: 'lessons',
        order: [['order', 'ASC']]
      }]
    });

    // Normalize response
    const courseJson = courseWithLessons.toJSON();
    courseJson._id = courseJson.id;
    if (courseJson.lessons) {
      courseJson.lessons = courseJson.lessons.map((l) => {
        l._id = l.id;
        return l;
      });
    }

    res.json(courseJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id/lessons/:lessonId
// @desc    Delete lesson (Instructor/Owner)
router.delete('/:id/lessons/:lessonId', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lesson = await Lesson.findByPk(req.params.lessonId);
    if (!lesson || lesson.courseId !== course.id) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    await lesson.destroy();

    // Update course totalLessons
    const lessonCount = await Lesson.count({ where: { courseId: course.id } });
    await course.update({ totalLessons: lessonCount });

    // Reorder remaining lessons
    const remainingLessons = await Lesson.findAll({
      where: { courseId: course.id },
      order: [['order', 'ASC']]
    });

    for (let i = 0; i < remainingLessons.length; i++) {
      await remainingLessons[i].update({ order: i + 1 });
    }

    const courseWithLessons = await Course.findByPk(course.id, {
      include: [{
        model: Lesson,
        as: 'lessons',
        order: [['order', 'ASC']]
      }]
    });

    res.json(courseWithLessons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/instructor/my-courses
// @desc    Get instructor's courses
router.get('/instructor/my-courses', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { instructorId: req.user.id },
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email', 'avatar']
      }, {
        model: Lesson,
        as: 'lessons',
        attributes: ['id']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Add totalLessons and enrolledStudents counts
    const formattedCourses = await Promise.all(courses.map(async (course) => {
      const courseJson = course.toJSON();
      courseJson.totalLessons = course.lessons ? course.lessons.length : 0;
      
      const enrollmentCount = await Enrollment.count({
        where: { courseId: course.id }
      });
      courseJson.enrolledStudents = enrollmentCount;
      
      // Normalize to include both id and _id for frontend compatibility
      courseJson._id = courseJson.id;
      
      return courseJson;
    }));

    res.json(formattedCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/instructor/unique-students-count
// @desc    Get unique student count across all instructor's courses
router.get('/instructor/unique-students-count', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    // Get all course IDs for this instructor
    const courses = await Course.findAll({
      where: { instructorId: req.user.id },
      attributes: ['id']
    });

    const courseIds = courses.map(course => course.id);

    if (courseIds.length === 0) {
      return res.json({ uniqueStudentsCount: 0 });
    }

    // Get all enrollments for these courses and count distinct students
    const enrollments = await Enrollment.findAll({
      where: {
        courseId: { [Op.in]: courseIds }
      },
      attributes: ['studentId']
    });

    // Count unique student IDs
    const uniqueStudentIds = new Set(enrollments.map(e => e.studentId));
    const uniqueStudentsCount = uniqueStudentIds.size;

    res.json({ uniqueStudentsCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/instructor/performance-metrics
// @desc    Get performance metrics for instructor's courses
router.get('/instructor/performance-metrics', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    // Get all course IDs for this instructor
    const courses = await Course.findAll({
      where: { instructorId: req.user.id },
      attributes: ['id']
    });

    const courseIds = courses.map(course => course.id);

    if (courseIds.length === 0) {
      return res.json({
        totalEnrollments: 0,
        completedEnrollments: 0,
        completionRate: 0,
        averageProgress: 0,
        activeStudents: 0
      });
    }

    // Get all enrollments for these courses
    const enrollments = await Enrollment.findAll({
      where: {
        courseId: { [Op.in]: courseIds }
      },
      attributes: ['progress', 'completed', 'studentId']
    });

    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter(e => e.completed === true).length;
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
    
    // Calculate average progress
    const totalProgress = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
    const averageProgress = totalEnrollments > 0 ? Math.round(totalProgress / totalEnrollments) : 0;
    
    // Count active students (students with progress > 0)
    const activeStudentIds = new Set(
      enrollments.filter(e => (e.progress || 0) > 0).map(e => e.studentId)
    );
    const activeStudents = activeStudentIds.size;

    res.json({
      totalEnrollments,
      completedEnrollments,
      completionRate,
      averageProgress,
      activeStudents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
