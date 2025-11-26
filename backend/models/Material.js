const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Material = sequelize.define('Material', {
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
    type: {
      type: DataTypes.ENUM('video', 'document', 'link', 'file'),
      defaultValue: 'video'
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    instructorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: true,
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
    fileUrl: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    fileName: {
      type: DataTypes.STRING,
      defaultValue: ''
    }
  }, {
    timestamps: true
  });

  return Material;
};

