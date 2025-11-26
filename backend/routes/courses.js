const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { Course, Lesson, Enrollment, User, Material, sequelize } = require('../models');
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
          const jwtSecret = process.env.JWT_SECRET;
          if (!jwtSecret || jwtSecret === 'your_super_secret_jwt_key_change_this_in_production') {
            // Skip enrollment check if JWT_SECRET is not properly configured
            isEnrolled = false;
          } else {
            try {
              const decoded = jwt.verify(token, jwtSecret);
              const enrollment = await Enrollment.findOne({
                where: {
                  studentId: decoded.userId,
                  courseId: req.params.id
                }
              });
              isEnrolled = !!enrollment;
            } catch (error) {
              // Invalid token, skip enrollment check
              isEnrolled = false;
            }
          }
        }
      } catch (error) {
        // Token invalid or user not authenticated, continue with isEnrolled = false
        isEnrolled = false;
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
    
    // Fetch independent materials associated with this course
    const courseMaterials = await Material.findAll({
      where: {
        courseId: course.id,
        lessonId: null // Course-level materials (not lesson-specific)
      },
      attributes: ['id', 'title', 'description', 'type', 'url', 'fileUrl', 'fileName']
    });

    // Normalize lessons array and merge with independent materials
    if (courseJson.lessons && Array.isArray(courseJson.lessons)) {
      // Fetch all lesson-specific materials using the correct association name
      const lessonIds = courseJson.lessons.map(l => l.id);
      const lessonMaterials = await Material.findAll({
        where: {
          lessonId: { [Op.in]: lessonIds }
        },
        attributes: ['id', 'title', 'description', 'type', 'url', 'fileUrl', 'fileName', 'lessonId']
      });

      // Group lesson materials by lessonId
      const materialsByLesson = {};
      lessonMaterials.forEach(mat => {
        const lessonId = mat.lessonId;
        if (!materialsByLesson[lessonId]) {
          materialsByLesson[lessonId] = [];
        }
        materialsByLesson[lessonId].push({
          _id: mat.id,
          id: mat.id,
          name: mat.title,
          fileName: mat.fileName,
          fileUrl: mat.fileUrl || mat.url,
          url: mat.url,
          type: mat.type,
          description: mat.description,
          isIndependent: true // Flag to identify independent materials
        });
      });

      courseJson.lessons = courseJson.lessons.map((lesson) => {
        lesson._id = lesson.id;
        
        // Get lesson materials from JSONB field
        let lessonMaterialsFromJson = [];
        if (lesson.materials) {
          if (Array.isArray(lesson.materials)) {
            lessonMaterialsFromJson = lesson.materials;
          } else if (typeof lesson.materials === 'string') {
            try {
              lessonMaterialsFromJson = JSON.parse(lesson.materials);
            } catch (e) {
              lessonMaterialsFromJson = [];
            }
          }
        }

        // Get independent materials for this lesson
        const independentMaterials = materialsByLesson[lesson.id] || [];

        // Merge both types of materials (lesson materials first, then independent)
        lesson.materials = [
          ...lessonMaterialsFromJson.map(m => ({ ...m, isIndependent: false })),
          ...independentMaterials
        ];

        console.log('Lesson materials merged:', {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonMaterialsCount: lessonMaterialsFromJson.length,
          independentMaterialsCount: independentMaterials.length,
          totalMaterialsCount: lesson.materials.length
        });

        return lesson;
      });
    }

    // Add course-level materials to course object
    courseJson.courseMaterials = courseMaterials.map(mat => ({
      _id: mat.id,
      id: mat.id,
      name: mat.title,
      fileName: mat.fileName,
      fileUrl: mat.fileUrl || mat.url,
      url: mat.url,
      type: mat.type,
      description: mat.description,
      isIndependent: true
    }));

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

    // Check if trying to publish without lessons
    if (req.body.isPublished === true) {
      // Note: At creation time, there won't be any lessons yet, so we prevent publishing
      return res.status(400).json({ 
        message: 'Cannot publish course without at least one lesson. Please add lessons first.' 
      });
    }

    const course = await Course.create({
      ...req.body,
      instructorId: req.user.id,
      isPublished: false // Force to false on creation
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

    // Check if trying to publish without lessons
    if (req.body.isPublished === true) {
      const lessonCount = await Lesson.count({
        where: { courseId: course.id }
      });

      if (lessonCount === 0) {
        return res.status(400).json({ 
          message: 'Cannot publish course without at least one lesson. Please add lessons first.' 
        });
      }
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
      materials: Array.isArray(req.body.materials) ? req.body.materials : []
    };

    console.log('Creating lesson with data:', {
      title: lessonData.title,
      videoUrl: lessonData.videoUrl,
      courseId: lessonData.courseId,
      order: lessonData.order,
      materials: lessonData.materials,
      materialsCount: lessonData.materials.length
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

    // Prepare update data, ensuring materials is properly formatted
    const updateData = { ...req.body };
    if (updateData.materials !== undefined) {
      // Ensure materials is an array
      if (!Array.isArray(updateData.materials)) {
        updateData.materials = [];
      }
    }

    console.log('Updating lesson:', {
      lessonId: req.params.lessonId,
      materials: updateData.materials,
      materialsCount: Array.isArray(updateData.materials) ? updateData.materials.length : 0
    });

    await lesson.update(updateData);
    
    // Reload lesson to get updated data
    await lesson.reload();
    
    console.log('Lesson updated, materials after save:', {
      lessonId: lesson.id,
      materials: lesson.materials,
      materialsType: typeof lesson.materials,
      isArray: Array.isArray(lesson.materials)
    });

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
        // Ensure materials array is always present and properly formatted
        if (!l.materials) {
          l.materials = [];
        }
        if (!Array.isArray(l.materials)) {
          l.materials = [];
        }
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

// @route   POST /api/courses/:id/rate
// @desc    Allow enrolled students to rate a course
router.post('/:id/rate', auth, authorize('student'), [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment should be at most 1000 characters')
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

    const enrollment = await Enrollment.findOne({
      where: {
        studentId: req.user.id,
        courseId: course.id
      }
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled to rate this course' });
    }

    await enrollment.update({
      rating: req.body.rating,
      ratingComment: req.body.comment || null,
      ratedAt: new Date()
    });

    // Calculate rating statistics for THIS COURSE ONLY
    // Rating is calculated as the average of all ratings given by enrolled students for this specific course
    // Each student can rate a course once (or update their rating)
    // The average is: (sum of all ratings) / (number of students who rated)
    
    const allRatings = await Enrollment.findAll({
      where: {
        courseId: course.id,
        rating: { [Op.not]: null }
      },
      attributes: ['rating'],
      raw: true
    });

    let ratingCount = 0;
    let avgRating = 0;

    if (allRatings && allRatings.length > 0) {
      ratingCount = allRatings.length;
      const sum = allRatings.reduce((acc, enrollment) => {
        const ratingValue = parseInt(enrollment.rating) || 0;
        return acc + ratingValue;
      }, 0);
      avgRating = ratingCount > 0 ? parseFloat((sum / ratingCount).toFixed(1)) : 0;
      
      console.log(`Rating calculation for course ${course.id}:`, {
        ratings: allRatings.map(e => e.rating),
        sum,
        count: ratingCount,
        average: avgRating
      });
    }

    await course.update({
      rating: avgRating,
      ratingCount
    });

    res.json({
      message: 'Rating submitted successfully',
      rating: avgRating,
      ratingCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/:id/recalculate-rating
// @desc    Recalculate course rating (Admin/Instructor only) - Useful for fixing rating issues
router.post('/:id/recalculate-rating', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Recalculate rating for this course
    const allRatings = await Enrollment.findAll({
      where: {
        courseId: course.id,
        rating: { [Op.not]: null }
      },
      attributes: ['rating'],
      raw: true
    });

    let ratingCount = 0;
    let avgRating = 0;

    if (allRatings && allRatings.length > 0) {
      ratingCount = allRatings.length;
      const sum = allRatings.reduce((acc, enrollment) => {
        const ratingValue = parseInt(enrollment.rating) || 0;
        return acc + ratingValue;
      }, 0);
      avgRating = ratingCount > 0 ? parseFloat((sum / ratingCount).toFixed(1)) : 0;
    }

    await course.update({
      rating: avgRating,
      ratingCount
    });

    res.json({
      message: 'Rating recalculated successfully',
      rating: avgRating,
      ratingCount,
      details: {
        totalRatings: ratingCount,
        ratings: allRatings.map(e => e.rating),
        calculation: ratingCount > 0 ? `(${allRatings.map(e => e.rating).join(' + ')} / ${ratingCount} = ${avgRating})` : 'No ratings'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
