const express = require('express');
const { getUsers, getUserById, updateUser, deleteUser, getOfficerAnalytics } = require('../controllers/userController');
const protect = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.get('/analytics', protect, authorize('officer'), getOfficerAnalytics);
router.get('/', protect, authorize('officer'), getUsers);
router.get('/:id', protect, authorize('officer'), getUserById);
router.put('/:id', protect, authorize('officer'), updateUser);
router.delete('/:id', protect, authorize('officer'), deleteUser);

module.exports = router;