const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getUsers, deleteUser, updateUser, getUserById } = require('../controllers/userController');
const protect = require('../middleware/authMiddleware').protect;

router.get('/', protect, getUsers);

// specific routes first
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// parameter routes last
router.route('/:id')
    .get(protect, getUserById)
    .delete(protect, deleteUser)
    .put(protect, updateUser);

module.exports = router;
