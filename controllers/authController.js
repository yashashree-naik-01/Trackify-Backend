const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ServiceCenter = require('../models/ServiceCenter');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user (Admin/Vendor/Service)
// @route   POST /api/auth/register
// @access  Public (or Admin only in real app, Public for demo)
const registerUser = async (req, res) => {
    const { name, email, password, role, phone, address } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role, phone, address });

        let isVerified = false;

        if (user) {
            // If creator is Admin, auto-verify Service Centers
            if (req.user && req.user.role === 'Admin' && role === 'Service') {
                await ServiceCenter.create({
                    centerName: name, // Default to user name
                    ownerName: name,
                    phone: phone || 'N/A',
                    email: email,
                    city: address || 'N/A',
                    verified: true,
                    user: user._id
                });
                isVerified = true;
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: isVerified,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            let serviceCenterData = {};
            if (user.role === 'Service') {
                const center = await ServiceCenter.findOne({ user: user._id });
                if (center) {
                    serviceCenterData = {
                        isVerified: center.verified,
                        serviceCenterId: center._id
                    };
                }
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
                ...serviceCenterData
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser };
