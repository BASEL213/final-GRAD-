const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const protect       = require('../middleware/protect');
const requireAdmin  = require('../middleware/requireAdmin');

const router = express.Router();

// Validation middleware
const validateProject = [
    body('name')
        .notEmpty()
        .withMessage('Project name is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Project name must be between 3 and 200 characters'),
    body('location')
        .notEmpty()
        .withMessage('Location is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Location must be between 3 and 100 characters'),
    body('totalUnits')
        .notEmpty()
        .withMessage('Total units is required')
        .isInt({ min: 1 })
        .withMessage('Total units must be at least 1'),
    body('availableUnits')
        .notEmpty()
        .withMessage('Available units is required')
        .isInt({ min: 0 })
        .withMessage('Available units must be at least 0'),
    body('priceRange')
        .notEmpty()
        .withMessage('Price range is required'),
    body('type')
        .isIn(['Apartments', 'Villas', 'Mixed'])
        .withMessage('Invalid project type'),
    body('status')
        .isIn(['active', 'completed', 'planning'])
        .withMessage('Invalid project status'),
    body('completionDate')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage('Invalid date format'),
    body('imageUrl')
        .optional({ nullable: true })
        .isURL()
        .withMessage('imageUrl must be a valid URL')
];

// Routes
router.get('/',    projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.post('/',    protect, requireAdmin, validateProject, projectController.createProject);
router.put('/:id',  protect, requireAdmin, validateProject, projectController.updateProject);
router.delete('/:id', protect, requireAdmin, projectController.deleteProject);

module.exports = router;
