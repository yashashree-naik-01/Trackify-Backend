const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const ServiceCenter = require('./models/ServiceCenter');
const Ticket = require('./models/Ticket');
const JobRequest = require('./models/JobRequest');

const inspectDB = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const serviceCenters = await ServiceCenter.find();
        console.log('\n--- Service Centers ---');
        serviceCenters.forEach(sc => {
            console.log(`Name: ${sc.centerName}, ID: ${sc._id}, Email: ${sc.email}, User: ${sc.user}`);
        });

        const jobRequests = await JobRequest.find().populate('ticketId').populate('serviceCenterId');
        console.log('\n--- Job Requests ---');
        jobRequests.forEach(jr => {
            console.log(`ID: ${jr._id}, Ticket: ${jr.ticketId?.ticketId}, SC: ${jr.serviceCenterId?.centerName}, Status: ${jr.status}`);
        });

        const tickets = await Ticket.find({ assignedServiceCenter: { $exists: true } });
        console.log('\n--- Assigned Tickets ---');
        tickets.forEach(t => {
            console.log(`Ticket: ${t.ticketId}, Assigned SC ID: ${t.assignedServiceCenter}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Inspection Error:', err);
        process.exit(1);
    }
};

inspectDB();
