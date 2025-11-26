const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Question = sequelize.define('Question', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Quizzes',
        key: 'id'
      }
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('multiple-choice', 'true-false', 'short-answer'),
      defaultValue: 'multiple-choice'
    },
    options: {
      type: DataTypes.JSONB,
      defaultValue: [] // Array of {text, isCorrect}
    },
    correctAnswer: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: true
  });

  return Question;
};

