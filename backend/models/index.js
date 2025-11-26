const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const Course = require('./Course')(sequelize);
const Lesson = require('./Lesson')(sequelize);
const Enrollment = require('./Enrollment')(sequelize);
const Quiz = require('./Quiz')(sequelize);
const Question = require('./Question')(sequelize);
const QuizAttempt = require('./QuizAttempt')(sequelize);
const Material = require('./Material')(sequelize);

// Define associations
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });
User.hasMany(Course, { foreignKey: 'instructorId', as: 'courses' });

Lesson.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Course.hasMany(Lesson, { foreignKey: 'courseId', as: 'lessons' });

Enrollment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
User.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });

Quiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Quiz.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });
Quiz.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });
Course.hasMany(Quiz, { foreignKey: 'courseId', as: 'quizzes' });
User.hasMany(Quiz, { foreignKey: 'instructorId', as: 'quizzes' });

Question.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
Quiz.hasMany(Question, { foreignKey: 'quizId', as: 'questions' });

QuizAttempt.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
QuizAttempt.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
User.hasMany(QuizAttempt, { foreignKey: 'studentId', as: 'quizAttempts' });

Material.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });
User.hasMany(Material, { foreignKey: 'instructorId', as: 'materials' });

module.exports = {
  sequelize,
  User,
  Course,
  Lesson,
  Enrollment,
  Quiz,
  Question,
  QuizAttempt,
  Material
};
