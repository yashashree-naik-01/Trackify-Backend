const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            // Add other fields as necessary, e.g., phone
            user.phone = req.body.phone || user.phone;
            user.address = req.body.address || user.address;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                token: req.headers.authorization.split(' ')[1],
                phone: updatedUser.phone,
                address: updatedUser.address
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (or filter by role/email)
// @route   GET /api/users?role=Vendor&email=user@example.com
// @access  Private/Admin
const getUsers = async (req, res) => {
    console.log('getUsers called');
    try {
        const { role, email } = req.query;
        console.log(`API getUsers called with role: '${role}', email: '${email}'`);

        let query = {};
        if (role) {
            query.role = role;
        }
        if (email) {
            query.email = email;
        }

        console.log('Mongo Query:', JSON.stringify(query));

        // Return users sorted by creation date (newest first)
        const users = await User.find(query).select('-password').sort({ createdAt: -1 });

        console.log(`Found ${users.length} users`);
        // if (users.length === 0) {
        //      const allUsers = await User.find({});
        //      console.log('Total users in DB:', allUsers.length);
        //      console.log('All user roles:', allUsers.map(u => u.role));
        // }

        res.json(users);
    } catch (error) {
        console.error('getUsers API Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        console.log(`Attempting to delete user with ID: ${req.params.id}`);
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            console.log(`User ${req.params.id} deleted successfully`);
            res.json({ message: 'User removed' });
        } else {
            console.log(`User ${req.params.id} not found`);
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        console.log(`Attempting to update user ${req.params.id} with data:`, req.body);
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            user.phone = req.body.phone || user.phone;
            user.address = req.body.address || user.address;

            const updatedUser = await user.save();
            console.log(`User ${updatedUser._id} updated successfully`);

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                address: updatedUser.address
            });
        } else {
            console.log(`Update failed: User ${req.params.id} not found`);
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        console.log(`Fetching user with ID: ${req.params.id}`);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


module.exports = { getUserProfile, updateUserProfile, getUsers, deleteUser, updateUser, getUserById };
