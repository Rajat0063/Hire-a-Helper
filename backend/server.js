// server.js

// ✅ Using CommonJS require syntax, which you are currently using.
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Establish the database connection
connectDB();

// Initialize the Express application
const app = express();
const http = require('http');
const { initSocket } = require('./socket');
const server = http.createServer(app);

// --- Middleware Setup ---
// Allow CORS from frontend domain specified in environment variable
const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// --- API Routes ---

// A simple test route to confirm the API is running
app.get('/', (req, res) => {
  res.send('Dashboard API is running...');
});

// Mount the authentication routes
app.use('/api/auth', require('./routes/authRoutes'));

// Mount the dashboard-related routes
app.use('/api/dashboard', require('./routes/dashboardRoutes'));


// ⭐️ Mount the routes for handling feed tasks
app.use('/api/tasks', require('./routes/taskRoutes'));

// ⭐️ Mount the routes for handling requests (sent/received)

// Mount the routes for handling incoming requests (dedicated collection)
app.use('/api/incoming-requests', require('./routes/incomingRequestRoutes'));

// Mount the routes for handling sent requests from incomingrequests
app.use('/api/incoming-requests-sent', require('./routes/incomingRequestSentRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));


// Mount the routes for handling my tasks
app.use('/api/mytasks', require('./routes/myTaskRoutes'));

// Mount the chat routes
app.use('/api/chat', require('./routes/chatRoutes'));


// Define the port the server will listen on.
const PORT = process.env.PORT || 5000;

// Initialize socket.io
initSocket(server);

// Start the server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));