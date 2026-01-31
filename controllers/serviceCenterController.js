const ServiceCenter = require('../models/ServiceCenter');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new Service Center
// @route   POST /api/service-centers/register
// @access  Public
const registerServiceCenter = async (req, res) => {
    const { centerName, ownerName, phone, email, password, city, servicesOffered } = req.body;

    try {
        // 1. Check if user/center exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const centerExists = await ServiceCenter.findOne({ email });
        if (centerExists) {
            return res.status(400).json({ message: 'Service Center with this email already exists' });
        }

        // 2. Create User (Role: Service)
        const user = await User.create({
            name: ownerName, // Using owner name as user name
            email,
            password,
            role: 'Service',
            phone,
            address: city // Storing city as address for User model
        });

        // 3. Create Service Center
        if (user) {
            const serviceCenter = await ServiceCenter.create({
                centerName,
                ownerName,
                phone,
                email,
                city,
                servicesOffered,
                verified: false, // Default
                user: user._id
            });

            // 4. Return Token & Data
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                serviceCenterId: serviceCenter._id,
                isVerified: serviceCenter.verified,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Register Service Center Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all service centers
// @route   GET /api/service-centers
// @access  Private (Admin)
const getAllServiceCenters = async (req, res) => {
    try {
        const query = req.query; // e.g. { verified: 'true' }
        const serviceCenters = await ServiceCenter.find(query).sort({ createdAt: -1 });
        res.json(serviceCenters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify or Unverify Service Center
// @route   PUT /api/service-centers/:id/verify
// @access  Private (Admin)
const verifyServiceCenter = async (req, res) => {
    const { id } = req.params;

    try {
        const serviceCenter = await ServiceCenter.findById(id);

        if (!serviceCenter) {
            return res.status(404).json({ message: 'Service Center not found' });
        }

        // Toggle verification status
        serviceCenter.verified = !serviceCenter.verified;
        await serviceCenter.save();

        // Emit real-time update
        try {
            const { getIO } = require('../socket');
            getIO().emit('serviceCenterVerified', {
                centerId: serviceCenter._id,
                verified: serviceCenter.verified,
                centerName: serviceCenter.centerName
            });
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.json({
            message: `Service Center ${serviceCenter.verified ? 'verified' : 'unverified'}`,
            serviceCenter
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Service Center stats
// @route   GET /api/service-centers/stats
// @access  Private (Service)
const getServiceCenterStats = async (req, res) => {
    try {
        const serviceCenter = await ServiceCenter.findOne({ user: req.user._id });
        if (!serviceCenter) {
            return res.status(404).json({ message: 'Service Center profile not found' });
        }

        console.log(`DEBUG: Stats for SC ${serviceCenter.centerName} (${serviceCenter._id})`);

        const totalRepairs = await Ticket.countDocuments({ assignedServiceCenter: serviceCenter._id });
        const activeJobs = await Ticket.countDocuments({
            assignedServiceCenter: serviceCenter._id,
            status: { $ne: 'Delivered' }
        });

        console.log(`DEBUG: Total: ${totalRepairs}, Active: ${activeJobs}`);

        res.json({
            totalRepairs,
            activeJobs
        });
    } catch (error) {
        console.error('DEBUG: Stats Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerServiceCenter, getAllServiceCenters, verifyServiceCenter, getServiceCenterStats };
