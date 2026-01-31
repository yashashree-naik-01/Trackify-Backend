const User = require('../models/User');

const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin123@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || '123456789';

        let adminKey = await User.findOne({ email: adminEmail });

        if (adminKey) {
            // Update existing admin
            adminKey.password = adminPassword;
            adminKey.role = 'Admin'; // Ensure role is Admin
            await adminKey.save();
            console.log(`Admin Account Updated: ${adminEmail} / ${adminPassword}`);
        } else {
            // Create new admin
            await User.create({
                name: 'Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'Admin',
                phone: '0000000000'
            });
            console.log(`Default Admin Account Created: ${adminEmail} / ${adminPassword}`);
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

module.exports = seedAdmin;
