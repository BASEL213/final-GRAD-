const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'findoor_jwt_secret_2024_housing_system';

module.exports = function protect(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId   = decoded.userId || decoded.id || decoded._id || null;
        req.userRole = decoded.role || null;
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};
