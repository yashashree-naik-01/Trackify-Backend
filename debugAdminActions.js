const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const runTest = async () => {
    try {
        console.log('1. Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin123@gmail.com',
            password: '123456789'
        });

        const token = loginRes.data.token;
        console.log('   Login Successful. Token received.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        console.log('\n2. Creating a specific Test User...');
        // Manually create user via register for this test
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            name: 'ToBeDeleted',
            email: 'tobedeleted@test.com',
            password: 'password',
            role: 'Vendor',
            phone: '1112223333'
        }, config);
        // Note: register might not need token depending on implementation, but AdminDashboard uses it.
        // Actually /auth/register is public? No, AdminDashboard calls it. Let's check authController later.
        // Assuming it works as per "Add User" feature.

        const userId = registerRes.data._id;
        console.log(`   User Created. ID: ${userId}`);

        console.log('\n3. Updating the Test User...');
        const updateRes = await axios.put(`${API_URL}/users/${userId}`, {
            name: 'Updated Name',
            phone: '9998887777'
        }, config);
        console.log(`   Update Successful. New Name: ${updateRes.data.name}`);

        console.log('\n4. Deleting the Test User...');
        const deleteRes = await axios.delete(`${API_URL}/users/${userId}`, config);
        console.log('   Delete Successful:', deleteRes.data.message);

    } catch (error) {
        console.error('\n❌ FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
};

runTest();
