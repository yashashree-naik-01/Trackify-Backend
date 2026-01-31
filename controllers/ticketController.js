const Ticket = require('../models/Ticket');
const StatusHistory = require('../models/StatusHistory');
const OTP = require('../models/OTP');
const User = require('../models/User');
const QRCode = require('qrcode');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const ServiceCenter = require('../models/ServiceCenter');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const STAGE_DURATIONS = {
    'Created': 1,
    'Picked Up': 1,
    'Received': 1,
    'In Repair': 3,
    'Repaired': 1,
    'Dispatched': 2,
    'Delivered': 0
};

const calculateEstimation = (status) => {
    const days = STAGE_DURATIONS[status] || 1; // Default to 1 day if unknown
    const estimation = new Date();
    estimation.setDate(estimation.getDate() + days);
    return estimation;
};

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private (Vendor)
const createTicket = async (req, res) => {
    const { customerName, customerPhone, customerEmail, deviceModel, issueDescription } = req.body;

    try {
        const ticketId = 'TRK-' + Math.floor(100000 + Math.random() * 900000);
        const otpCode = generateOTP();

        const trackingUrl = `http://localhost:5173/track/${ticketId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl);

        // Calculate initial estimation (sum of all stage durations from current status)
        const totalDays = Object.keys(STAGE_DURATIONS).reduce((sum, stage) => {
            return sum + STAGE_DURATIONS[stage];
        }, 0);
        const estimatedCompletion = new Date();
        estimatedCompletion.setDate(estimatedCompletion.getDate() + totalDays);

        // 1. Create Ticket
        const ticket = await Ticket.create({
            ticketId,
            customerName,
            customerPhone,
            customerEmail,
            deviceModel,
            issueDescription,
            qrCode: qrCodeDataUrl,
            createdBy: req.user._id,
            status: 'Created',
            estimatedCompletion,
            originalEstimatedCompletion: estimatedCompletion // Save original estimate
        });

        // 2. Create OTP (Separate Document) - Will be hashed by pre-save hook
        await OTP.create({
            ticketId: ticketId,
            otp: otpCode // Passing plain OTP, model handles hashing
        });

        // 3. Create Status History
        await StatusHistory.create({
            ticket: ticket._id,
            status: 'Created',
            description: 'Ticket created by Vendor',
            location: 'Vendor Location',
            updatedBy: req.user._id,
            timestamp: new Date()
        });

        // Notify (Created)
        notificationService.emit('statusChange', { ticket, status: 'Created' });

        // Send OTP via Email (replaced SMS)
        await emailService.sendOtpEmail(customerEmail, customerName, otpCode, ticketId);

        // Return success WITHOUT exposing OTP
        res.status(201).json({
            ticket,
            message: 'Ticket created. OTP sent to customer email.'
        });
    } catch (error) {
        console.error('Create Ticket Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Helper to add delay info
const augmentTicketWithDelay = (ticket) => {
    try {
        if (!ticket) return null;
        const ticketObj = ticket.toObject ? ticket.toObject() : JSON.parse(JSON.stringify(ticket));

        if (ticketObj.status === 'Delivered') {
            ticketObj.isDelayed = false;
        } else if (ticketObj.status && STAGE_DURATIONS[ticketObj.status] !== undefined) {
            // Calculate when the current stage SHOULD have been reached
            const currentStageIndex = Object.keys(STAGE_DURATIONS).indexOf(ticketObj.status);

            if (currentStageIndex >= 0) {
                // Sum up durations of all stages BEFORE the current stage
                const stageKeys = Object.keys(STAGE_DURATIONS);
                let daysToCurrent = 0;
                for (let i = 0; i < currentStageIndex; i++) {
                    daysToCurrent += STAGE_DURATIONS[stageKeys[i]];
                }

                // Calculate when current stage should have been reached
                const expectedStageTime = new Date(ticketObj.createdAt || Date.now());
                expectedStageTime.setDate(expectedStageTime.getDate() + daysToCurrent);

                // If we're past when this stage should have been reached, it's delayed
                ticketObj.isDelayed = new Date() > expectedStageTime;
            } else {
                ticketObj.isDelayed = false;
            }
        } else {
            // Fallback to original estimate check
            const estimateToCheck = ticketObj.originalEstimatedCompletion || ticketObj.estimatedCompletion;
            if (estimateToCheck) {
                ticketObj.isDelayed = new Date() > new Date(estimateToCheck);
            } else {
                ticketObj.isDelayed = false;
            }
        }
        return ticketObj;
    } catch (err) {
        console.error('DEBUG: augmentTicketWithDelay failed:', err.message);
        return ticket.toObject ? ticket.toObject() : ticket;
    }
};

// @desc    Get Ticket by ID & OTP (Customer Tracking)
// @route   POST /api/tickets/track
// @access  Public
const trackTicket = async (req, res) => {
    const { ticketId, otp } = req.body;

    try {
        let ticket = await Ticket.findOne({ ticketId });
        if (!ticket && !ticketId.startsWith('TRK-')) {
            ticket = await Ticket.findOne({ ticketId: `TRK-${ticketId}` });
        }

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Use the found ticket's ID (which includes TRK- if applicable) for OTP check
        const storedOtpDoc = await OTP.findOne({ ticketId: ticket.ticketId });

        if (!storedOtpDoc) {
            return res.status(401).json({ message: 'OTP expired or not found' });
        }

        const isMatch = await storedOtpDoc.matchOtp(otp);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid OTP' });
        }

        const events = await StatusHistory.find({ ticket: ticket._id })
            .sort({ timestamp: -1 })
            .populate('updatedBy', 'name role');

        res.json({ ticket: augmentTicketWithDelay(ticket), events });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Ticket by ID (Service/Vendor)
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
    const { id } = req.params;

    try {
        let ticket = await Ticket.findOne({ ticketId: id }).populate('assignedServiceCenter', 'centerName city phone email');
        if (!ticket && !id.startsWith('TRK-')) {
            ticket = await Ticket.findOne({ ticketId: `TRK-${id}` }).populate('assignedServiceCenter', 'centerName city phone email');
        }

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const events = await StatusHistory.find({ ticket: ticket._id }).sort({ timestamp: -1 });
        res.json({ ticket: augmentTicketWithDelay(ticket), events });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Tickets (Admin/Service/Vendor)
// @route   GET /api/tickets
// @access  Private
const getAllTickets = async (req, res) => {
    try {
        let query = {};
        console.log('DEBUG: getAllTickets user:', req.user._id, 'Role:', req.user.role);

        // If user is Vendor, only show tickets created by them
        if (req.user.role === 'Vendor') {
            query = { createdBy: req.user._id };
        }
        // Admin and Service see all

        console.log('DEBUG: Query:', query);

        const tickets = await Ticket.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        console.log('DEBUG: Tickets found:', tickets.length);

        // Augment list with delay info
        const augmentedTickets = tickets.map(augmentTicketWithDelay);

        res.json(augmentedTickets);
    } catch (error) {
        console.error('getAllTickets Error:', error);
        res.status(500).json({ message: error.message });
    }
}

// @desc    Update Ticket Status
// @route   PATCH /api/tickets/:id/status
// @access  Private
const updateTicketStatus = async (req, res) => {
    const { status, location, description, image } = req.body;
    const { id } = req.params;

    // Validate Status against keys in Ticket schema or hardcoded list
    const validStatuses = ['Created', 'Picked Up', 'Received', 'In Repair', 'Repaired', 'Dispatched', 'Delivered'];

    // Role-based restrictions
    if (req.user.role === 'Vendor') {
        const vendorAllowed = ['Picked Up', 'Delivered'];
        if (!vendorAllowed.includes(status)) {
            return res.status(403).json({ message: 'Vendors can only set status to Picked Up or Delivered' });
        }
    } else if (req.user.role === 'Service') {
        const serviceAllowed = ['In Repair', 'Repaired', 'Dispatched'];
        if (!serviceAllowed.includes(status)) {
            return res.status(403).json({ message: 'Service Centers can only set status to In Repair, Repaired, or Dispatched' });
        }
    }

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        console.log(`DEBUG: Updating status for ticket: ${id} to ${status}`);
        let ticket = await Ticket.findOne({ ticketId: id });
        if (!ticket && !id.startsWith('TRK-')) {
            ticket = await Ticket.findOne({ ticketId: `TRK-${id}` });
        }

        if (!ticket) {
            console.log(`DEBUG: Ticket not found for ID: ${id}`);
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Authorization: Vendor can only update THEIR tickets
        if (req.user.role === 'Vendor' && ticket.createdBy.toString() !== req.user._id.toString()) {
            console.log(`DEBUG: Unauthorized update attempt by Vendor ${req.user._id} on ticket ${ticket._id}`);
            return res.status(403).json({ message: 'You can only update tickets you created' });
        }

        // Service Center can only update tickets ASSIGNED to them
        if (req.user.role === 'Service') {
            const sc = await ServiceCenter.findOne({ user: req.user._id });
            if (!sc || (ticket.assignedServiceCenter && ticket.assignedServiceCenter.toString() !== sc._id.toString())) {
                console.log(`DEBUG: Unauthorized update attempt by SC ${sc?._id} on ticket ${ticket._id}`);
                return res.status(403).json({ message: 'You can only update tickets assigned to your service center' });
            }
        }

        if (image) {
            console.log(`DEBUG: Received image of size: ${Math.round(image.length / 1024)} KB`);
        }

        console.log(`DEBUG: Ticket found and authorized. Mongo ID: ${ticket._id}`);

        // Use findOneAndUpdate to bypass full document validation (avoids issues with missing required fields in legacy data)
        const updatedTicket = await Ticket.findOneAndUpdate(
            { _id: ticket._id },
            {
                status,
                lastUpdated: Date.now()
            },
            { new: true, runValidators: false }
        );

        if (!updatedTicket) {
            console.log(`DEBUG: Failed to update ticket document`);
            return res.status(404).json({ message: 'Failed to update ticket' });
        }

        ticket = updatedTicket;
        console.log(`DEBUG: Ticket status updated to: ${ticket.status}`);

        const event = await StatusHistory.create({
            ticket: ticket._id,
            status,
            description: description || `Status updated to ${status}`,
            location: location || 'Transit/Unknown',
            image, // Base64 image data
            updatedBy: req.user._id,
            timestamp: new Date()
        });

        console.log(`DEBUG: Status history event created: ${event._id}`);

        // Notify (Update)
        try {
            notificationService.emit('statusChange', { ticket, status });
        } catch (nErr) {
            console.error('DEBUG: Notification Service Error:', nErr.message);
        }

        // Real-time socket update
        try {
            const { getIO } = require('../socket');
            getIO().emit('ticketStatusUpdated', {
                ticketId: ticket.ticketId,
                status: ticket.status,
                assignedServiceCenter: ticket.assignedServiceCenter,
                event: event // Send the full history entry
            });
            console.log(`DEBUG: Socket event emitted: ticketStatusUpdated for ${ticket.ticketId}`);
        } catch (err) {
            console.error('DEBUG: Socket emission failed:', err.message);
        }

        res.json({ ticket: augmentTicketWithDelay(ticket), event });
    } catch (error) {
        console.error('DEBUG: updateTicketStatus Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resend OTP to Customer
// @route   POST /api/tickets/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
    const { ticketId } = req.body;

    try {
        let ticket = await Ticket.findOne({ ticketId });
        if (!ticket && !ticketId.startsWith('TRK-')) {
            ticket = await Ticket.findOne({ ticketId: `TRK-${ticketId}` });
        }

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Generate new OTP
        const otpCode = generateOTP();

        // Remove existing OTP if any
        await OTP.deleteMany({ ticketId: ticket.ticketId });

        // Create new OTP
        await OTP.create({
            ticketId: ticket.ticketId,
            otp: otpCode
        });

        // Send via Email
        await emailService.sendOtpEmail(ticket.customerEmail, ticket.customerName, otpCode, ticket.ticketId);

        // Mask email for response
        const maskedEmail = ticket.customerEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');

        res.json({ message: `New OTP sent to ${maskedEmail}` });
    } catch (error) {
        console.error('Resend OTP Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a status update
// @route   DELETE /api/tickets/:ticketId/updates/:updateId
// @access  Private (Vendor/Service)
const deleteTicketUpdate = async (req, res) => {
    const { ticketId, updateId } = req.params;

    try {
        const event = await StatusHistory.findById(updateId);

        if (!event) {
            return res.status(404).json({ message: 'Status update not found' });
        }

        // Verify ownership/permission if needed (e.g., createdBy check)
        // For now, allow if role is Vendor or Service (middleware handles this)

        await event.deleteOne();

        // Recalculate ticket status based on latest remaining event
        const latestEvent = await StatusHistory.findOne({ ticket: event.ticket })
            .sort({ timestamp: -1 });

        if (latestEvent) {
            await Ticket.findByIdAndUpdate(
                event.ticket,
                {
                    status: latestEvent.status,
                    lastUpdated: latestEvent.timestamp
                },
                { runValidators: false }
            );
        }

        res.json({ message: 'Status update removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createTicket, trackTicket, getTicketById, updateTicketStatus, getAllTickets, resendOtp, deleteTicketUpdate };
