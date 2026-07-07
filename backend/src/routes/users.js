const express = require('express');
const { getUsers, getUserById, updateUser, deleteUser, getAdminAnalytics } = require('../controllers/userController');
const protect = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');



const router = express.Router();

router.get('/analytics', protect, adminOnly, getAdminAnalytics);
router.get('/', protect, adminOnly, getUsers);
router.get('/:id', protect, adminOnly, getUserById);
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;