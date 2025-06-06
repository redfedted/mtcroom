const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Booking, Room, User } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all bookings (admin only)
router.get('/admin', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate, roomId, userId, status } = req.query;
        
        const where = {};
        
        if (startDate && endDate) {
            where[Op.and] = [
                {
                    checkIn: {
                        [Op.lt]: endDate
                    }
                },
                {
                    checkOut: {
                        [Op.gt]: startDate
                    }
                }
            ];
        }
        
        if (roomId) where.RoomId = roomId;
        if (userId) where.UserId = userId;
        if (status) where.status = status;
        
        const bookings = await Booking.findAll({
            where,
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Room,
                    attributes: ['id', 'name', 'description', 'capacity', 'price', 'facilities']
                }
            ],
            order: [['checkIn', 'DESC']]
        });

        res.json({
            success: true,
            data: { bookings }
        });
    } catch (error) {
        console.error('Error fetching admin bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            where: { UserId: req.user.id },
            include: [{
                model: Room,
                attributes: ['id', 'name', 'description', 'capacity', 'price', 'facilities']
            }],
            order: [['checkIn', 'DESC']]
        });

        console.log('Fetched user bookings with room details:', JSON.stringify(bookings, null, 2));

        res.json({
            success: true,
            data: { bookings }
        });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
});

// Check room availability
router.get('/check-availability', async (req, res) => {
    console.log('Received request to /api/bookings/check-availability');
    try {
        const { roomId, checkIn, checkOut } = req.query;
        console.log('Received availability check request with query:', req.query);

        if (!roomId || !checkIn || !checkOut) {
            return res.status(400).json({
                success: false,
                message: 'Room ID, check-in date, and check-out date are required'
            });
        }

        const conflictingBooking = await Booking.findOne({
            where: {
                RoomId: roomId,
                status: {
                    [Op.notIn]: ['cancelled']
                },
                [Op.and]: [
                    {
                        checkIn: {
                            [Op.lt]: checkOut // Requested period must start before existing booking ends
                        }
                    },
                    {
                        checkOut: {
                            [Op.gt]: checkIn // Requested period must end after existing booking starts
                        }
                    }
                ]
            }
        });

        console.log('Availability check result for RoomId', roomId, ':', !conflictingBooking);

        res.json({
            success: true,
            data: {
                isAvailable: !conflictingBooking
            }
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking availability',
            error: error.message
        });
    }
});

// Create booking
router.post('/',
    [
        body('roomId').notEmpty().withMessage('Room ID is required'),
        body('checkIn').isISO8601().withMessage('Valid check-in date is required'),
        body('checkOut').isISO8601().withMessage('Valid check-out date is required'),
        body('specialRequests').optional().trim(),
        body('reserverName').notEmpty().withMessage('Name is required'),
        body('reserverPhone').notEmpty().withMessage('Phone number is required')
    ],
    async (req, res) => {
        try {
            console.log('Received booking request:', req.body);
            console.log('User:', req.user);

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('Validation errors:', errors.array());
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { roomId, checkIn, checkOut, specialRequests, reserverName, reserverPhone } = req.body;

            // Check if room exists
            const room = await Room.findOne({
                where: {
                    id: roomId,
                    isActive: true
                }
            });

            if (!room) {
                console.log('Room not found:', roomId);
                return res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
            }

            // Check for conflicting bookings
            const conflictingBooking = await Booking.findOne({
                where: {
                    RoomId: roomId,
                    status: {
                        [Op.notIn]: ['cancelled']
                    },
                    [Op.or]: [
                        {
                            checkIn: {
                                [Op.between]: [checkIn, checkOut]
                            }
                        },
                        {
                            checkOut: {
                                [Op.between]: [checkIn, checkOut]
                            }
                        }
                    ]
                }
            });

            if (conflictingBooking) {
                console.log('Conflicting booking found:', conflictingBooking.id);
                return res.status(400).json({
                    success: false,
                    message: 'Room is not available for the selected dates'
                });
            }

            // Calculate total price
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
            const totalPrice = room.price * nights;

            console.log('Creating booking with details:', {
                roomId,
                userId: req.user?.id,
                checkIn,
                checkOut,
                totalPrice,
                reserverName,
                reserverPhone
            });

            // Create booking
            const booking = await Booking.create({
                RoomId: roomId,
                UserId: req.user?.id, // Optional user ID for authenticated users
                checkIn,
                checkOut,
                totalPrice,
                specialRequests,
                reserverName,
                reserverPhone,
                status: 'pending'
            });

            console.log('Booking created successfully:', booking.id);

            // Fetch booking with room details
            const bookingWithDetails = await Booking.findByPk(booking.id, {
                include: [{
                    model: Room,
                    attributes: ['id', 'name', 'description', 'capacity', 'price', 'facilities']
                }]
            });

            res.status(201).json({
                success: true,
                data: { booking: bookingWithDetails }
            });
        } catch (error) {
            console.error('Error creating booking:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Error creating booking',
                error: error.message
            });
        }
    }
);

// Update booking status (admin only)
router.patch('/:id/status',
    adminAuth,
    [
        body('status')
            .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
            .withMessage('Invalid status'),
        body('cancellationReason')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Cancellation reason is required when cancelling a booking')
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

            const { status, cancellationReason } = req.body;

            const booking = await Booking.findByPk(req.params.id);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            // Validate cancellation reason
            if (status === 'cancelled' && !cancellationReason) {
                return res.status(400).json({
                    success: false,
                    message: 'Cancellation reason is required'
                });
            }

            // Update booking
            await booking.update({
                status,
                cancellationReason: status === 'cancelled' ? cancellationReason : null
            });

            res.json({
                success: true,
                data: { booking }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating booking status',
                error: error.message
            });
        }
    }
);

// Cancel booking (user only)
router.post('/:id/cancel',
    auth,
    [
        body('reason')
            .trim()
            .notEmpty()
            .withMessage('Cancellation reason is required')
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

            const { reason } = req.body;

            const booking = await Booking.findOne({
                where: {
                    id: req.params.id,
                    userId: req.user.id
                }
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            // Check if booking can be cancelled (24 hours before check-in)
            const checkInDate = new Date(booking.checkIn);
            const now = new Date();
            const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

            if (hoursUntilCheckIn < 24) {
                return res.status(400).json({
                    success: false,
                    message: 'Bookings can only be cancelled up to 24 hours before check-in'
                });
            }

            // Update booking
            await booking.update({
                status: 'cancelled',
                cancellationReason: reason
            });

            res.json({
                success: true,
                data: { booking }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error cancelling booking',
                error: error.message
            });
        }
    }
);

// Delete booking (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        await booking.destroy();

        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting booking',
            error: error.message
        });
    }
});

module.exports = router; 