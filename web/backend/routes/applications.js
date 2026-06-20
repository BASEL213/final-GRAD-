const express = require('express');
const { body } = require('express-validator');
const applicationController = require('../controllers/applicationController');
const protect      = require('../middleware/protect');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// Validation middleware
const validateApplication = [
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Name must be between 3 and 100 characters'),
    body('nationalId')
        .notEmpty()
        .withMessage('National ID is required')
        .isLength({ min: 14, max: 14 })
        .withMessage('National ID must be exactly 14 digits')
        .isNumeric()
        .withMessage('National ID must contain only numbers'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^01[0-9]{9}$/)
        .withMessage('Phone number must start with 01 and be 11 digits'),
    body('projectId')
        .notEmpty()
        .withMessage('Project ID is required'),
    // projectName is derived from the DB in the controller — not validated here
    body('income')
        .isNumeric()
        .withMessage('Income must be a number')
        .isFloat({ min: 0 })
        .withMessage('Income must be a positive number'),
    body('familySize')
        .isInt({ min: 1, max: 20 })
        .withMessage('Family size must be between 1 and 20'),
    body('currentHousing')
        .notEmpty()
        .withMessage('Current housing information is required')
        .isLength({ min: 10, max: 200 })
        .withMessage('Current housing must be between 10 and 200 characters')
];

router.get('/',       protect, requireAdmin, applicationController.getAllApplications);
router.get('/stats',  protect, requireAdmin, applicationController.getApplicationStats);
router.get('/recent', protect, requireAdmin, applicationController.getRecentApplications);
router.get('/:id',    protect, applicationController.getApplicationById);
router.post('/',      validateApplication,   applicationController.createApplication);

router.put('/:id/status', protect, requireAdmin, [
    body('status')
        .isIn(['approved', 'rejected'])
        .withMessage('Status must be approved or rejected'),
    body('rejectionReason')
        .if(body('status').equals('rejected'))
        .notEmpty()
        .withMessage('Rejection reason is required when rejecting'),
    body('reviewedBy')
        .optional()
        .isString()
        .withMessage('Reviewed by must be a string')
], applicationController.updateApplicationStatus);

router.delete('/:id', protect, requireAdmin, applicationController.deleteApplication);
router.put('/:id',    protect, requireAdmin, applicationController.updateApplication);

module.exports = router;
