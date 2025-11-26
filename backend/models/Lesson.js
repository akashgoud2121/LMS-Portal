const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Lesson = sequelize.define('Lesson', {
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
    videoUrl: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    videoFile: {
      type: DataTypes.STRING,
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
    order: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // in minutes
    },
    materials: {
      type: DataTypes.JSONB,
      defaultValue: [] // Array of {name, fileUrl}
    }
  }, {
    timestamps: true
  });

  return Lesson;
};

