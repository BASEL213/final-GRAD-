const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'findoor_secret_key';

/**
 * Optional auth middleware — decodes the Bearer token if present and attaches
 * req.userId / req.userRole to the request. Never blocks requests without a token
 * so public endpoints keep working unchanged.
 */
module.exports = function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.userId   = decoded.userId || decoded.id || decoded._id || null;
            req.userRole = decoded.role || null;
        } catch {
            // Invalid/expired token — treat as unauthenticated, don't block
        }
    }

    next();
};
