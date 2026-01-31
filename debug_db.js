const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Ticket = require('./models/Ticket');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const users = await User.find({});
        console.log('--- USERS ---');
        users.forEach(u => console.log(`ID: ${u._id}, Name: ${u.name}, Role: ${u.role}`));

        const tickets = await Ticket.find({});
        console.log('\n--- TICKETS ---');
        tickets.forEach(t => console.log(`ID: ${t.ticketId}, CreatedBy: ${t.createdBy}, Status: ${t.status}`));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

connectDB();
