const express = require('express');
const router  = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:5000';
const AI_API_KEY  = process.env.AI_API_KEY  ||
    '5b45743ddd3ded9ba2524b40cc5704b5d9839a3438a0534b4c07cfabe431eef2';

async function proxyToFastAPI(path, body) {
    const response = await fetch(`${FASTAPI_URL}${path}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': AI_API_KEY },
        body:    JSON.stringify(body),
    });
    const data = await response.json();
    return { status: response.status, data };
}

// POST /api/ai/chat
// Body: { message: string, session_id?: string }
router.post('/chat', async (req, res) => {
    const { message, session_id = 'default' } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: "'message' is required" });
    }

    try {
        const { status, data } = await proxyToFastAPI('/api/chat', {
            message: message.trim(),
            session_id,
        });

        if (!data.success) {
            return res.status(status).json({ success: false, message: data.detail || 'AI service error' });
        }

        res.json(data);
    } catch (err) {
        const isDown = err.cause?.code === 'ECONNREFUSED' || err.code === 'ECONNREFUSED';
        if (isDown) {
            return res.status(503).json({
                success: false,
                message: 'AI service unavailable — ensure the FastAPI server is running on port 5000',
            });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/ai/chat/clear
// Body: { session_id?: string }
router.post('/chat/clear', async (req, res) => {
    const { session_id = 'default' } = req.body;

    try {
        const { data } = await proxyToFastAPI('/api/chat/clear', { session_id });
        res.json(data);
    } catch {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
