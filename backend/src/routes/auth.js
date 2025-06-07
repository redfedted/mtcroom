const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth');

// Register
router.post('/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('phone').optional().trim() // Only phone is optional, email and password removed
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { name, phone } = req.body; // Only taking name and phone

            // Check if user already exists based on phone number
            const existingUser = await User.findOne({ where: { phone } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already registered'
                });
            }

            // Create new user
            const user = await User.create({
                name,
                phone
            });

            // Generate token (only for authenticated users, but if we are allowing registration without email/password,
            // the token generation and subsequent login flow needs re-evaluation based on how non-admin users will log in).
            // For now, we will generate a token but note that traditional login with email/password won't work for these users.
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } // Default to 24 hours if not set
            );

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        phone: user.phone,
                        role: user.role
                    },
                    token
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Error registering user',
                error: error.message
            });
        }
    }
);

// Login
router.post('/login',
    [], // Validation will be handled conditionally inside the route
    async (req, res) => {
        try {
            const { email, password, name, phone } = req.body;
            let user = null;
            let isValidPassword = false;

            // Check for admin/email-based login
            if (email && password) {
                user = await User.findOne({ where: { email } });
                if (user && user.password) { // Only validate password if it exists for the user (i.e., admin or old registration)
                    isValidPassword = await user.validatePassword(password);
                } else if (user && !user.password) {
                    // User exists but has no password, so they registered with name/phone. Invalid credentials for this login method.
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid credentials: Please use Name and Phone to login'
                    });
                }

                if (!user || !isValidPassword) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid credentials'
                    });
                }
            } else if (name && phone) {
                // Check for regular user (name and phone) login
                user = await User.findOne({ where: { name, phone } });

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid credentials'
                    });
                }
            } else {
                // Neither email/password nor name/phone provided
                return res.status(400).json({
                    success: false,
                    message: 'Please provide either Email and Password or Name and Phone Number'
                });
            }

            // Generate token with default expiration if not set
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } // Default to 24 hours if not set
            );

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email, // Include email, it might be null for some users
                        phone: user.phone,
                        role: user.role
                    },
                    token
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Error logging in',
                error: error.message
            });
        }
    }
);

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email', 'role']
        });

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
});

// Logout
router.post('/logout', auth, async (req, res) => {
    try {
        // In a real application, you might want to invalidate the token
        // For now, we'll just return a success message
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging out',
            error: error.message
        });
    }
});

module.exports = router; 