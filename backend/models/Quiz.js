const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Quiz = sequelize.define('Quiz', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Courses',
        key: 'id'
      }
    },
    lessonId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Lessons',
        key: 'id'
      }
    },
    instructorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // in minutes, 0 means no limit
    },
    passingScore: {
      type: DataTypes.INTEGER,
      defaultValue: 60 // percentage
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true
  });

  return Quiz;
};
