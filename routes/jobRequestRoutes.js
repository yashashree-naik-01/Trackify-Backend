const express = require('express');
const router = express.Router();
const { createJobRequest, getVendorRequests, getServiceCenterRequests, updateJobRequestStatus } = require('../controllers/jobRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('Vendor'), createJobRequest);
router.get('/vendor', protect, authorize('Vendor'), getVendorRequests);
router.get('/service-center', protect, authorize('Service'), getServiceCenterRequests);
router.put('/:id/status', protect, authorize('Service'), updateJobRequestStatus);

module.exports = router;
