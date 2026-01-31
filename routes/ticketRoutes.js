const express = require('express');
const router = express.Router();
const { createTicket, trackTicket, updateTicketStatus, getTicketById, getAllTickets, deleteTicketUpdate } = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Route (Customer Tracking)
router.post('/track', trackTicket);
router.post('/resend-otp', require('../controllers/ticketController').resendOtp);

// Private Routes
// Create Ticket: Only Vendor can create
router.post('/', protect, authorize('Vendor'), createTicket);

// Get All Tickets: Admin only
// Get All Tickets: Admin, Service and Vendor (filtered)
router.get('/', protect, authorize('Admin', 'Service', 'Vendor'), getAllTickets);

// Get Ticket: Admin, Service, Vendor can view
router.get('/:id', protect, authorize('Admin', 'Service', 'Vendor'), getTicketById);

// Update Status: Service, Vendor can update. Admin cannot.
router.patch('/:id/status', protect, authorize('Service', 'Vendor'), updateTicketStatus);

// Delete Status Update
router.delete('/:ticketId/updates/:updateId', protect, authorize('Service', 'Vendor'), deleteTicketUpdate);

module.exports = router;
