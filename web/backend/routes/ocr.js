const express = require('express');
const multer  = require('multer');
const router  = express.Router();

// Connect directly to the Flask OCR server — no FastAPI middleman
const FLASK_OCR_URL = process.env.FLASK_OCR_URL || 'http://127.0.0.1:5001';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only JPEG and PNG images are allowed'));
    },
});

// POST /api/ocr/extract
// Multipart body: image (file)
router.post('/extract', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No image file provided (field name: "image")',
        });
    }

    // PaddleOCR (offline fallback) can take ~220 s — use 6-minute timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 360_000);

    try {
        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('image', blob, req.file.originalname || 'nid.jpg');

        const response = await fetch(`${FLASK_OCR_URL}/ocr/extract`, {
            method: 'POST',
            body:   formData,
            signal: controller.signal,
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        const isDown    = err.cause?.code === 'ECONNREFUSED' || err.code === 'ECONNREFUSED';
        const isTimeout = err.name === 'AbortError';

        if (isDown) {
            return res.status(503).json({
                success: false,
                message: 'OCR service unavailable — ensure the Flask OCR server is running on port 5001',
            });
        }
        if (isTimeout) {
            return res.status(504).json({
                success: false,
                message: 'OCR request timed out — the server may still be loading its model. Try again in 30 seconds.',
            });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
        clearTimeout(timer);
    }
});

// Multer error handler (file type / size violations)
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message?.includes('Only JPEG')) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
});

module.exports = router;
