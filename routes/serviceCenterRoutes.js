const express = require('express');
const router = express.Router();
const { registerServiceCenter, getAllServiceCenters, verifyServiceCenter, getServiceCenterStats } = require('../controllers/serviceCenterController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Route
router.post('/register', registerServiceCenter);

// Verified Routes
router.get('/stats', protect, authorize('Service'), getServiceCenterStats);
router.get('/', protect, authorize('Admin', 'Vendor'), getAllServiceCenters);
router.put('/:id/verify', protect, authorize('Admin'), verifyServiceCenter);

module.exports = router;
