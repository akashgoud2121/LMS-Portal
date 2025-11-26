const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuizAttempt = sequelize.define('QuizAttempt', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Quizzes',
        key: 'id'
      }
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Courses',
        key: 'id'
      }
    },
    answers: {
      type: DataTypes.JSONB,
      defaultValue: [] // Array of {questionId, answer, isCorrect, pointsEarned}
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    passed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // in minutes
    }
  }, {
    timestamps: true
  });

  return QuizAttempt;
};
