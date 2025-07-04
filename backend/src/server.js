const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const setupAdminUser = require('./scripts/setupAdmin');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (to be implemented)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/bookings', require('./routes/bookings'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

// Database connection and server start
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // First sync the database to ensure tables exist
        await sequelize.sync({ alter: true });
        console.log('Database synced');

        // Setup admin user
        try {
            await setupAdminUser();
            console.log('Admin user setup completed');
        } catch (adminError) {
            console.error('Error setting up admin user:', adminError);
        }

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1); // Exit if we can't start the server
    }
}

startServer(); 