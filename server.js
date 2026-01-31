const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const socketUtils = require('./socket');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socketUtils.init(server);

app.use(cors({
    origin: '*', // Allow all for demo, or set to ['http://localhost:5173'] for strictness
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Debug Middleware: Log all requests
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send('Trackify API is running');
});

app.get('/test', (req, res) => {
    res.json({ message: 'Test route works' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api', require('./routes/emailRoutes'));
app.use('/api/service-centers', require('./routes/serviceCenterRoutes'));
app.use('/api/job-requests', require('./routes/jobRequestRoutes'));

// Background Job: Check for delays every hour
const checkAndNotifyDelays = require('./jobs/delayChecker');
const seedAdmin = require('./utils/seeder');

// Interval for delay check
setInterval(checkAndNotifyDelays, 60 * 60 * 1000); // 1 hour

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
