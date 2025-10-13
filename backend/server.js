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
// Allow CORS from frontend domain(s) specified in environment variable (for cookies)
const allowedOrigins = [
  process.env.FRONTEND_URL, // e.g. https://hire-a-helper-yr.vercel.app
  'http://localhost:5173', // Vite default
  'http://localhost:3000', // React default
].filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
}));
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


// Mount the admin routes
app.use('/api/admin', require('./routes/adminRoutes'));

// Mount the message routes (real-time chat)
app.use('/api/messages', require('./routes/messageRoutes'));


// Define the port the server will listen on.
const PORT = process.env.PORT || 5000;

// Initialize socket.io
initSocket(server);

// Start the server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));