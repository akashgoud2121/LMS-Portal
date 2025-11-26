const express = require('express');
const { body, validationResult } = require('express-validator');
const { Material, User } = require('../models');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/materials
// @desc    Get instructor's materials
router.get('/', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const materials = await Material.findAll({
      where: { instructorId: req.user.id },
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Normalize response
    const normalizedMaterials = materials.map(material => {
      const materialJson = material.toJSON();
      materialJson._id = materialJson.id;
      if (materialJson.instructor) {
        materialJson.instructor._id = materialJson.instructor.id;
      }
      return materialJson;
    });

    res.json(normalizedMaterials);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/materials
// @desc    Create material (Instructor)
router.post('/', auth, authorize('instructor', 'admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('url').trim().notEmpty().withMessage('URL is required'),
  body('type').isIn(['video', 'document', 'link', 'file']).withMessage('Invalid material type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const material = await Material.create({
      title: req.body.title.trim(),
      description: req.body.description || '',
      type: req.body.type || 'video',
      url: req.body.url.trim(),
      fileUrl: req.body.fileUrl || '',
      fileName: req.body.fileName || '',
      instructorId: req.user.id
    });

    const materialWithInstructor = await Material.findByPk(material.id, {
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name']
      }]
    });

    const materialJson = materialWithInstructor.toJSON();
    materialJson._id = materialJson.id;
    if (materialJson.instructor) {
      materialJson.instructor._id = materialJson.instructor.id;
    }

    res.status(201).json(materialJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/materials/:id
// @desc    Update material (Instructor/Owner)
router.put('/:id', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (req.user.role !== 'admin' && material.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await material.update({
      title: req.body.title || material.title,
      description: req.body.description !== undefined ? req.body.description : material.description,
      type: req.body.type || material.type,
      url: req.body.url || material.url,
      fileUrl: req.body.fileUrl !== undefined ? req.body.fileUrl : material.fileUrl,
      fileName: req.body.fileName !== undefined ? req.body.fileName : material.fileName
    });

    const updatedMaterial = await Material.findByPk(material.id, {
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name']
      }]
    });

    const materialJson = updatedMaterial.toJSON();
    materialJson._id = materialJson.id;
    if (materialJson.instructor) {
      materialJson.instructor._id = materialJson.instructor.id;
    }

    res.json(materialJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/materials/:id
// @desc    Delete material (Instructor/Owner)
router.delete('/:id', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (req.user.role !== 'admin' && material.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await material.destroy();
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

