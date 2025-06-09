const express = require('express');
require('dotenv').config(); // Load environment variables at the very top
require('./config/firebaseConfig'); // Initialize Firebase Admin SDK

const userRoutes = require('./routes/userRoutes'); // Import user routes
const orderRoutes = require('./routes/orderRoutes'); // Import order routes
const teacherRoutes = require('./routes/teacherRoutes'); // Import teacher routes
const bookingRoutes = require('./routes/bookingRoutes'); // Import booking routes
const paymentRoutes = require('./routes/paymentRoutes'); // Import payment routes
const productRoutes = require('./routes/productRoutes'); // Import product routes

const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from Backend! Firebase SDK should be initialized.');
});

// User routes
app.use('/api/users', userRoutes);

// Order routes
app.use('/api/orders', orderRoutes);

// Teacher routes
app.use('/api/teachers', teacherRoutes);

// Booking routes
app.use('/api/bookings', bookingRoutes);

// Payment routes
app.use('/api/payments', paymentRoutes);

// Product routes
app.use('/api/products', productRoutes);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
