const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const Ticket = require('./models/Ticket');
const JobRequest = require('./models/JobRequest');

const repairDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const acceptedRequests = await JobRequest.find({ status: 'accepted' });
        console.log(`Found ${acceptedRequests.length} accepted job requests`);

        for (const jr of acceptedRequests) {
            console.log(`Syncing ticket ${jr.ticketId} with SC ${jr.serviceCenterId}`);
            const result = await Ticket.findByIdAndUpdate(
                jr.ticketId,
                { $set: { assignedServiceCenter: jr.serviceCenterId } },
                { runValidators: false }
            );
            if (result) {
                console.log(`Successfully synced ticket ${jr.ticketId}`);
            } else {
                console.log(`Failed to find ticket ${jr.ticketId}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Repair Error:', err);
        process.exit(1);
    }
};

repairDB();
