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
        body('email').isEmail().withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
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

            const { name, email, password } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Create new user
            const user = await User.create({
                name,
                email,
                password
            });

            // Generate token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    },
                    token
                }
            });
        } catch (error) {
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
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
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

            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Validate password
            const isValidPassword = await user.validatePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
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
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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