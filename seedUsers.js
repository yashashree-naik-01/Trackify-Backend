const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const sampleUsers = [
            {
                name: 'Test Vendor',
                email: 'vendor@test.com',
                password: 'password123',
                role: 'Vendor',
                phone: '1234567890'
            },
            {
                name: 'Test Service',
                email: 'service@test.com',
                password: 'password123',
                role: 'Service', // Mapping to 'Service Center' in UI logic usually check for 'Service' string in DB
                phone: '0987654321'
            }
        ];

        for (const u of sampleUsers) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create(u);
                console.log(`Created ${u.role}: ${u.email}`);
            } else {
                console.log(`${u.role} already exists.`);
            }
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedUsers();
