const express = require('express');
const router = express.Router();
const protect      = require('../middleware/protect');
const requireAdmin = require('../middleware/requireAdmin');

const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    verifyUser,
    resetPassword,
    getUserStats
} = require('../controllers/userController-mongodb');

router.get('/',    protect, requireAdmin, getAllUsers);
router.get('/stats', protect, requireAdmin, getUserStats);
router.patch('/:id/reset-password', resetPassword);       // self-service — no auth needed
router.get('/:id',    protect, getUserById);
router.post('/',      createUser);                        // admin creates users via web
router.put('/:id',    protect, updateUser);
router.patch('/:id/verify', protect, requireAdmin, verifyUser);
router.delete('/:id', protect, requireAdmin, deleteUser);

module.exports = router;
