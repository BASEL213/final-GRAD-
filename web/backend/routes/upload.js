const express = require('express');
const multer = require('multer');
const path = require('path');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp and random number
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and PDF files are allowed.'), false);
    }
};

// Configure multer for multiple file uploads
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 5 // Maximum 5 files at once
    },
    fileFilter: fileFilter
});

// @route   POST /api/upload/documents
// @desc    Upload multiple documents
// @access  Public (for now, should be private in production)
router.post('/documents', 
    upload.fields([
        { name: 'nationalIdCopy', maxCount: 1 },
        { name: 'incomeCertificate', maxCount: 1 },
        { name: 'birthCertificate', maxCount: 1 },
        { name: 'otherDocuments', maxCount: 2 }
    ]), 
    uploadController.uploadDocuments
);

// @route   POST /api/upload/application-docs/:applicationId
// @desc    Upload documents and link them to an application
// @access  Public
router.post('/application-docs/:applicationId',
    upload.fields([
        { name: 'nationalIdCopy', maxCount: 1 },
        { name: 'incomeCertificate', maxCount: 1 },
        { name: 'familyStatusDocument', maxCount: 1 },
    ]),
    uploadController.uploadApplicationDocs
);

// @route   POST /api/upload/single
// @desc    Upload single document
// @access  Public (for now, should be private in production)
router.post('/single',
    upload.single('document'),
    uploadController.uploadDocuments
);

// @route   GET /api/upload/file/:filename
// @desc    Get file information
// @access  Public
router.get('/file/:filename', uploadController.getFileInfo);

// @route   DELETE /api/upload/file/:filename
// @desc    Delete file
// @access  Private (should be admin only in production)
router.delete('/file/:filename', uploadController.deleteFile);

// @route   GET /api/upload/files
// @desc    Get all uploaded files
// @access  Private (should be admin only in production)
router.get('/files', uploadController.getAllFiles);

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB per file.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 5 files at once.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name. Allowed fields: nationalIdCopy, incomeCertificate, birthCertificate, otherDocuments'
            });
        }
    }
    
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    res.status(500).json({
        success: false,
        message: 'File upload error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Upload failed'
    });
});

module.exports = router;
