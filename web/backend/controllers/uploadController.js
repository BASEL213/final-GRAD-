const fs = require('fs');
const path = require('path');
const Application = require('../models/Application');

// @desc    Upload documents for an application
// @route   POST /api/upload/documents
// @access  Public (for now, should be private in production)
exports.uploadDocuments = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadedFiles = {};
        const allowedFields = ['nationalIdCopy', 'incomeCertificate', 'birthCertificate', 'otherDocuments'];

        // Process each uploaded file
        for (const fieldName of allowedFields) {
            if (req.files[fieldName]) {
                const file = req.files[fieldName];
                
                // Validate file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    // Clean up uploaded file if too large
                    fs.unlinkSync(file.path);
                    return res.status(400).json({
                        success: false,
                        message: `${fieldName} file size exceeds 5MB limit`
                    });
                }

                // Store file information
                uploadedFiles[fieldName] = {
                    filename: file.filename,
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: file.path,
                    url: `/uploads/${file.filename}`
                };
            }
        }

        res.status(200).json({
            success: true,
            message: 'Files uploaded successfully',
            data: {
                uploadedFiles,
                count: Object.keys(uploadedFiles).length
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        
        // Clean up uploaded files on error
        if (req.files) {
            Object.values(req.files).forEach(file => {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during file upload',
            error: process.env.NODE_ENV === 'development' ? error.message : 'File upload failed'
        });
    }
};

// @desc    Upload documents and link them to a specific application
// @route   POST /api/upload/application-docs/:applicationId
exports.uploadApplicationDocs = async (req, res) => {
    try {
        const { applicationId } = req.params;
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            // Clean up any uploaded files
            Object.values(req.files).flat().forEach(f => {
                if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
            });
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const fieldMap = {
            nationalIdCopy: 'nationalIdCopy',
            incomeCertificate: 'incomeCertificate',
            familyStatusDocument: 'birthCertificate', // stored in birthCertificate field
        };

        const savedUrls = {};
        for (const [field, docKey] of Object.entries(fieldMap)) {
            if (req.files[field] && req.files[field][0]) {
                const f = req.files[field][0];
                const url = `/uploads/${f.filename}`;
                application.documents[docKey] = url;
                savedUrls[field] = url;
            }
        }

        await application.save();

        res.status(200).json({
            success: true,
            message: 'Documents uploaded and linked to application',
            data: { applicationId, documents: savedUrls },
        });
    } catch (error) {
        console.error('uploadApplicationDocs error:', error);
        if (req.files) {
            Object.values(req.files).flat().forEach(f => {
                if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
            });
        }
        res.status(500).json({ success: false, message: 'Server error during document upload' });
    }
};

// @desc    Get uploaded file information
// @route   GET /api/upload/file/:filename
// @access  Public
exports.getFileInfo = async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Get file stats
        const stats = fs.statSync(filePath);

        res.status(200).json({
            success: true,
            data: {
                filename,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                url: `/uploads/${filename}`
            }
        });
    } catch (error) {
        console.error('Get file info error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching file information',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch file info'
        });
    }
};

// @desc    Delete uploaded file
// @route   DELETE /api/upload/file/:filename
// @access  Private (should be admin only in production)
exports.deleteFile = async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Delete file
        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting file',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to delete file'
        });
    }
};

// @desc    Get all uploaded files (for admin)
// @route   GET /api/upload/files
// @access  Private (should be admin only in production)
exports.getAllFiles = async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../uploads');
        
        // Check if uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            return res.status(200).json({
                success: true,
                data: {
                    files: [],
                    count: 0
                }
            });
        }

        // Read directory
        const files = fs.readdirSync(uploadsDir);
        const fileList = [];

        // Get file information for each file
        for (const filename of files) {
            const filePath = path.join(uploadsDir, filename);
            const stats = fs.statSync(filePath);

            if (stats.isFile()) {
                fileList.push({
                    filename,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                    url: `/uploads/${filename}`
                });
            }
        }

        // Sort by creation date (newest first)
        fileList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({
            success: true,
            data: {
                files: fileList,
                count: fileList.length
            }
        });
    } catch (error) {
        console.error('Get all files error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching files',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch files'
        });
    }
};
