module.exports = function requireAdmin(req, res, next) {
    if (req.userRole !== 'admin' && req.userRole !== 'employee') {
        return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    next();
};
