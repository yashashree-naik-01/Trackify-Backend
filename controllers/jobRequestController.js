const JobRequest = require('../models/JobRequest');
const Ticket = require('../models/Ticket');
const ServiceCenter = require('../models/ServiceCenter');

// @desc    Create a new job request
// @route   POST /api/job-requests
// @access  Private (Vendor)
const createJobRequest = async (req, res) => {
    const { ticketId, serviceCenterId, notes } = req.body;

    try {
        // Validation
        if (!ticketId || !serviceCenterId || !notes) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if ticket belongs to vendor
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized for this ticket' });
        }

        // Check for duplicate pending requests
        const existingRequest = await JobRequest.findOne({
            ticketId,
            serviceCenterId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'A pending request already exists for this ticket and service center' });
        }

        const { getIO } = require('../socket'); // Add this import at the top

        // ... existing code ...

        const jobRequest = await JobRequest.create({
            ticketId,
            vendorId: req.user._id,
            serviceCenterId,
            notes
        });

        // Emit socket event
        try {
            const io = getIO();
            io.emit('newJobRequest', {
                serviceCenterId: jobRequest.serviceCenterId,
                jobRequestId: jobRequest._id
            });
        } catch (err) {
            console.error('Socket error:', err);
        }

        res.status(201).json(jobRequest);
    } catch (error) {
        console.error('Create Job Request Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get requests for logged-in vendor
// @route   GET /api/job-requests/vendor
// @access  Private (Vendor)
const getVendorRequests = async (req, res) => {
    try {
        const requests = await JobRequest.find({ vendorId: req.user._id })
            .populate('ticketId', 'ticketId deviceModel issueDescription createdAt')
            .populate('serviceCenterId', 'centerName city phone email')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get requests for logged-in service center
// @route   GET /api/job-requests/service-center
// @access  Private (Service)
const getServiceCenterRequests = async (req, res) => {
    try {
        // Find Service Center associated with user
        const serviceCenter = await ServiceCenter.findOne({ user: req.user._id });
        if (!serviceCenter) {
            return res.status(404).json({ message: 'Service Center profile not found' });
        }

        const requests = await JobRequest.find({ serviceCenterId: serviceCenter._id })
            .populate('ticketId', 'ticketId deviceModel issueDescription createdAt')
            .populate('vendorId', 'name email phone')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update job request status (Accept/Reject)
// @route   PUT /api/job-requests/:id/status
// @access  Private (Service)
const updateJobRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        console.log('DEBUG: Updating job request status. ID:', id, 'New Status:', status);

        // 1. Find service center associated with this user
        const serviceCenter = await ServiceCenter.findOne({ user: req.user._id });
        if (!serviceCenter) {
            return res.status(404).json({ message: 'Service Center profile not found' });
        }

        const jobRequest = await JobRequest.findById(id);
        if (!jobRequest) {
            console.log('DEBUG: Job request not found');
            return res.status(404).json({ message: 'Job request not found' });
        }

        // 2. Verify ownership
        if (jobRequest.serviceCenterId.toString() !== serviceCenter._id.toString()) {
            return res.status(401).json({ message: 'Not authorized for this job request' });
        }

        jobRequest.status = status;
        await jobRequest.save();
        console.log('DEBUG: Job request status updated in DB');

        if (status === 'accepted') {
            console.log(`DEBUG: Attempting to assign ticket ${jobRequest.ticketId} to SC ${jobRequest.serviceCenterId}`);

            // Using findByIdAndUpdate with explicit $set and runValidators: false
            const updatedTicket = await Ticket.findByIdAndUpdate(
                jobRequest.ticketId,
                { $set: { assignedServiceCenter: jobRequest.serviceCenterId } },
                { new: true, runValidators: false }
            );

            if (updatedTicket) {
                console.log('DEBUG: Ticket updated successfully. New SC ID:', updatedTicket.assignedServiceCenter);
            } else {
                console.log('DEBUG: FAILED to update ticket. Ticket not found for ID:', jobRequest.ticketId);
            }
        }

        res.json({ message: `Request ${status}`, jobRequest });

        // Emit socket events
        try {
            const io = getIO();
            // Update the vendor who sent the request
            io.emit('jobRequestUpdated', {
                requestId: jobRequest._id,
                status: jobRequest.status,
                vendorId: jobRequest.vendorId
            });
            // Update the service center's own dashboard stats
            io.emit('statsUpdate', { serviceCenterId: jobRequest.serviceCenterId });
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }
    } catch (error) {
        console.error('DEBUG: updateJobRequestStatus Error:', error);
        res.status(500).json({ message: `Update failed: ${error.message}` });
    }
};

module.exports = { createJobRequest, getVendorRequests, getServiceCenterRequests, updateJobRequestStatus };
