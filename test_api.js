const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const LOG_FILE = 'api_test_log.txt';

function log(msg) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg);
}

// Clear log file
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

async function testFlow() {
    try {
        log('Starting Test Flow...');

        // 1. Register/Login Vendor
        log('1. Registering/Logging in Vendor...');
        let token;
        try {
            const reg = await axios.post(`${API_URL}/auth/register`, {
                name: 'TestVendor',
                email: 'test' + Date.now() + '@vendor.com',
                password: 'password123',
                role: 'Vendor'
            });
            token = reg.data.token;
            log(`   Registered. Token: ${token ? 'Yes' : 'No'}`);
        } catch (e) {
            log('   Registration failed (maybe exists), trying login...');
            log(`   Error: ${e.response?.data?.message || e.message}`);
            return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Create Ticket
        log('2. Creating Ticket...');
        try {
            const ticket = await axios.post(`${API_URL}/tickets`, {
                customerName: 'Test Cust',
                customerPhone: '1234567890',
                customerEmail: 'cust@test.com',
                deviceModel: 'Test Device',
                issueDescription: 'Test Issue'
            }, config);
            log(`   Ticket Created: ${ticket.data.ticket.ticketId}`);
        } catch (e) {
            log(`   Create Ticket Failed: ${e.response?.data?.message || e.message}`);
        }

        // 3. Get History
        log('3. Fetching History...');
        try {
            const history = await axios.get(`${API_URL}/tickets`, config);
            log(`   Status: ${history.status}`);
            log(`   Tickets Found: ${history.data.length}`);
            if (history.data.length > 0) {
                log(`   First Ticket CreatedBy: ${history.data[0].createdBy._id || history.data[0].createdBy}`);
                log(`   First Ticket Status: ${history.data[0].status}`);
            }
        } catch (e) {
            log(`   Fetch History Failed: ${e.response?.data?.message || e.message}`);
        }

    } catch (error) {
        log(`Global Error: ${error.message}`);
    }
}

testFlow();
