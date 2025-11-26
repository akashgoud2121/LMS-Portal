const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Quiz, Question, QuizAttempt, Course, User, Enrollment } = require('../models');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/quizzes/course/:courseId
// @desc    Get quizzes for a course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      where: {
        courseId: req.params.courseId,
        isPublished: true
      },
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Normalize to include _id
    // Add question counts to each quiz
    const normalizedQuizzes = await Promise.all(quizzes.map(async (quiz) => {
      const quizJson = quiz.toJSON();
      quizJson._id = quizJson.id;
      if (quizJson.instructor) {
        quizJson.instructor._id = quizJson.instructor.id;
      }
      
      // Get question count
      const questionCount = await Question.count({
        where: { quizId: quiz.id }
      });
      quizJson.questionCount = questionCount;
      // Add empty questions array with correct length for frontend compatibility
      quizJson.questions = questionCount > 0 ? [] : []; // Empty array, but frontend can use questionCount
      
      return quizJson;
    }));

    res.json(normalizedQuizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quizzes/:id
// @desc    Get quiz details (without answers for students)
router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'instructor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Question,
          as: 'questions',
          order: [['order', 'ASC']],
          required: false // Use left join to include quiz even if no questions
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const quizJson = quiz.toJSON();
    quizJson._id = quizJson.id;
    if (quizJson.course) quizJson.course._id = quizJson.course.id;
    if (quizJson.instructor) quizJson.instructor._id = quizJson.instructor.id;

    // Ensure questions array exists and is properly formatted
    if (!quizJson.questions || quizJson.questions.length === 0) {
      // If no questions in include, fetch them directly
      const questions = await Question.findAll({
        where: { quizId: quiz.id },
        order: [['order', 'ASC']]
      });
      quizJson.questions = questions.map(q => {
        const qJson = q.toJSON();
        qJson._id = qJson.id;
        return qJson;
      });
    } else {
      // Normalize question IDs
      quizJson.questions = quizJson.questions.map(q => {
        const qJson = { ...q };
        qJson._id = qJson.id || qJson._id;
        qJson.id = qJson.id || qJson._id;
        return qJson;
      });
    }
    
    // Add questionCount for consistency
    quizJson.questionCount = quizJson.questions.length;
    
    // Debug logging
    console.log('Quiz fetched:', {
      quizId: quizJson.id,
      title: quizJson.title,
      questionsCount: quizJson.questions.length,
      questionCount: quizJson.questionCount,
      totalPoints: quizJson.totalPoints,
      questionIds: quizJson.questions.map(q => q.id || q._id)
    });

    // If student, hide correct answers
    if (req.user.role === 'student') {
      quizJson.questions = quizJson.questions.map(q => {
        const questionJson = { ...q };
        questionJson._id = questionJson.id || questionJson._id;
        questionJson.id = questionJson.id || questionJson._id;
        
        if (questionJson.type === 'multiple-choice' && questionJson.options) {
          questionJson.options = questionJson.options.map(opt => {
            if (typeof opt === 'string') {
              return { text: opt };
            }
            return {
              text: opt.text || opt,
              isCorrect: undefined // Hide answer
            };
          });
        }
        delete questionJson.correctAnswer;
        return questionJson;
      });
      
      console.log('Quiz for student:', {
        quizId: quizJson.id,
        title: quizJson.title,
        questionsCount: quizJson.questions.length,
        questions: quizJson.questions.map(q => ({ id: q._id || q.id, type: q.type, hasOptions: !!q.options }))
      });
      
      return res.json(quizJson);
    }

    // Normalize questions for instructor/admin
    quizJson.questions = quizJson.questions.map(q => {
      q._id = q.id || q._id;
      q.id = q.id || q._id;
      return q;
    });

    res.json(quizJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/quizzes
// @desc    Create quiz (Instructor)
router.post('/', auth, authorize('instructor', 'admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('course').notEmpty().withMessage('Course is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.findByPk(req.body.course);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to create quiz for this course' });
    }

    // Calculate total points from questions
    const totalPoints = req.body.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0;

    // Create quiz
    const quiz = await Quiz.create({
      title: req.body.title,
      description: req.body.description || '',
      courseId: req.body.course,
      lessonId: req.body.lesson || null,
      instructorId: req.user.id,
      timeLimit: req.body.timeLimit || 0,
      passingScore: req.body.passingScore || 60,
      totalPoints: totalPoints,
      isPublished: req.body.isPublished || false
    });

    // Create questions if provided
    if (req.body.questions && Array.isArray(req.body.questions)) {
      const questionsData = req.body.questions.map((q, index) => ({
        quizId: quiz.id,
        question: q.question,
        type: q.type || 'multiple-choice',
        options: q.options || [],
        correctAnswer: q.correctAnswer || '',
        points: q.points || 1,
        order: index + 1
      }));

      await Question.bulkCreate(questionsData);
    }

    // Fetch quiz with relations
    const quizWithRelations = await Quiz.findByPk(quiz.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'instructor',
          attributes: ['id', 'name']
        }
      ]
    });

    const quizJson = quizWithRelations.toJSON();
    quizJson._id = quizJson.id;
    if (quizJson.course) quizJson.course._id = quizJson.course.id;
    if (quizJson.instructor) quizJson.instructor._id = quizJson.instructor.id;

    res.status(201).json(quizJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/quizzes/:id
// @desc    Update quiz (Instructor/Owner)
router.put('/:id', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (req.user.role !== 'admin' && quiz.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Calculate total points if questions are updated
    if (req.body.questions) {
      req.body.totalPoints = req.body.questions.reduce((sum, q) => sum + (q.points || 1), 0);
      
      // Delete existing questions and create new ones
      await Question.destroy({ where: { quizId: quiz.id } });
      
      const questionsData = req.body.questions.map((q, index) => ({
        quizId: quiz.id,
        question: q.question,
        type: q.type || 'multiple-choice',
        options: q.options || [],
        correctAnswer: q.correctAnswer || '',
        points: q.points || 1,
        order: index + 1
      }));

      await Question.bulkCreate(questionsData);
    }

    // Update quiz
    await quiz.update({
      title: req.body.title,
      description: req.body.description,
      timeLimit: req.body.timeLimit,
      passingScore: req.body.passingScore,
      totalPoints: req.body.totalPoints || quiz.totalPoints,
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished : quiz.isPublished
    });

    const updatedQuiz = await Quiz.findByPk(quiz.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'instructor',
          attributes: ['id', 'name']
        }
      ]
    });

    const quizJson = updatedQuiz.toJSON();
    quizJson._id = quizJson.id;
    if (quizJson.course) quizJson.course._id = quizJson.course.id;
    if (quizJson.instructor) quizJson.instructor._id = quizJson.instructor.id;

    res.json(quizJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/quizzes/:id/publish
// @desc    Toggle quiz publish state (Instructor/Owner)
router.patch('/:id/publish', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { isPublished } = req.body;

    if (typeof isPublished !== 'boolean') {
      return res.status(400).json({ message: 'isPublished flag must be provided as boolean' });
    }

    const quiz = await Quiz.findByPk(req.params.id, {
      include: [{
        model: Course,
        as: 'course',
        attributes: ['id', 'title']
      }]
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (req.user.role !== 'admin' && quiz.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    quiz.isPublished = isPublished;
    await quiz.save();

    const quizJson = quiz.toJSON();
    quizJson._id = quizJson.id;
    if (quizJson.course) {
      quizJson.course._id = quizJson.course.id;
    }

    res.json(quizJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/quizzes/:id
// @desc    Delete quiz (Instructor/Owner)
router.delete('/:id', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (req.user.role !== 'admin' && quiz.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete associated questions first
    await Question.destroy({ where: { quizId: quiz.id } });
    
    // Delete quiz
    await quiz.destroy();
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quizzes/instructor/my-quizzes
// @desc    Get instructor's quizzes
router.get('/instructor/my-quizzes', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      where: { instructorId: req.user.id },
      include: [{
        model: Course,
        as: 'course',
        attributes: ['id', 'title']
      }],
      order: [['createdAt', 'DESC']]
    });

    const normalizedQuizzes = quizzes.map(quiz => {
      const quizJson = quiz.toJSON();
      quizJson._id = quizJson.id;
      if (quizJson.course) {
        quizJson.course._id = quizJson.course.id;
      }
      return quizJson;
    });

    res.json(normalizedQuizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quizzes/student/available
// @desc    Get published quizzes for a student's enrolled courses
router.get('/student/available', auth, authorize('student'), async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { studentId: req.user.id },
      attributes: ['courseId']
    });

    if (!enrollments.length) {
      return res.json([]);
    }

    const courseIds = enrollments.map(enrollment => enrollment.courseId);

    const quizzes = await Quiz.findAll({
      where: {
        courseId: { [Op.in]: courseIds },
        isPublished: true
      },
      include: [{
        model: Course,
        as: 'course',
        attributes: ['id', 'title']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Add question counts to each quiz
    const normalizedQuizzes = await Promise.all(quizzes.map(async (quiz) => {
      const quizJson = quiz.toJSON();
      quizJson._id = quizJson.id;
      if (quizJson.course) {
        quizJson.course._id = quizJson.course.id;
      }
      
      // Get question count
      const questionCount = await Question.count({
        where: { quizId: quiz.id }
      });
      quizJson.questionCount = questionCount;
      quizJson.questions = []; // Empty array for list views
      
      return quizJson;
    }));

    res.json(normalizedQuizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/quizzes/:id/attempt
// @desc    Submit quiz attempt (Student)
router.post('/:id/attempt', auth, authorize('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [{
        model: Question,
        as: 'questions',
        order: [['order', 'ASC']]
      }, {
        model: Course,
        as: 'course',
        attributes: ['id']
      }]
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!quiz.isPublished) {
      return res.status(403).json({ message: 'Quiz is not available' });
    }

    // Check if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      where: {
        studentId: req.user.id,
        courseId: quiz.courseId
      }
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled in the course to take the quiz' });
    }

    const { answers: submittedAnswers, timeSpent } = req.body;
    let questions = quiz.questions || [];
    
    // If questions not included, fetch them directly
    if (!questions || questions.length === 0) {
      questions = await Question.findAll({
        where: { quizId: quiz.id },
        order: [['order', 'ASC']]
      });
      console.log('Fetched questions directly for quiz attempt:', {
        quizId: quiz.id,
        questionsCount: questions.length
      });
    }
    
    if (questions.length === 0) {
      return res.status(400).json({ message: 'Quiz has no questions' });
    }
    
    // Grade the quiz
    let score = 0;
    const gradedAnswers = submittedAnswers.map((submitted) => {
      const question = questions.find((q) => q.id === submitted.question || q._id === submitted.question);
      if (!question) return null;

      let isCorrect = false;
      let pointsEarned = 0;

      if (question.type === 'multiple-choice') {
        isCorrect = question.correctAnswer === submitted.answer;
      } else if (question.type === 'true-false') {
        // For true/false, compare case-insensitively
        const correctAnswer = question.correctAnswer ? question.correctAnswer.toLowerCase().trim() : '';
        const submittedAnswer = submitted.answer ? submitted.answer.toLowerCase().trim() : '';
        isCorrect = correctAnswer === submittedAnswer;
      } else if (question.type === 'text' || question.type === 'short-answer') {
        // For text answers, do simple comparison (case-insensitive, trimmed)
        const correctAnswer = question.correctAnswer ? question.correctAnswer.toLowerCase().trim() : '';
        const submittedAnswer = submitted.answer ? submitted.answer.toLowerCase().trim() : '';
        isCorrect = correctAnswer === submittedAnswer;
      }

      if (isCorrect) {
        pointsEarned = question.points || 1;
        score += pointsEarned;
      }

      return {
        questionId: question.id,
        answer: submitted.answer,
        isCorrect,
        pointsEarned
      };
    }).filter(Boolean);

    const totalPoints = quiz.totalPoints || questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    // Create quiz attempt
    const attempt = await QuizAttempt.create({
      studentId: req.user.id,
      quizId: quiz.id,
      courseId: quiz.courseId,
      answers: gradedAnswers,
      score,
      totalPoints,
      percentage,
      passed,
      submittedAt: new Date(),
      timeSpent: timeSpent || 0
    });

    const attemptJson = attempt.toJSON();
    attemptJson._id = attemptJson.id;

    res.json(attemptJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quizzes/:id/attempts
// @desc    Get quiz attempts (Student - own attempts, Instructor - all attempts)
router.get('/:id/attempts', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const where = { quizId: quiz.id };
    
    // Students can only see their own attempts
    if (req.user.role === 'student') {
      where.studentId = req.user.id;
    } else if (req.user.role !== 'admin' && quiz.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const attempts = await QuizAttempt.findAll({
      where,
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'email']
      }],
      order: [['submittedAt', 'DESC']]
    });

    const normalizedAttempts = attempts.map(attempt => {
      const attemptJson = attempt.toJSON();
      attemptJson._id = attemptJson.id;
      if (attemptJson.student) {
        attemptJson.student._id = attemptJson.student.id;
      }
      return attemptJson;
    });

    res.json(normalizedAttempts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
