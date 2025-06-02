const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Room, Facility } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');

// Get all rooms (public)
router.get('/', async (req, res) => {
    try {
        const rooms = await Room.findAll({
            where: { isActive: true },
            include: [{
                model: Facility,
                through: { attributes: [] }
            }]
        });

        res.json({
            success: true,
            data: { rooms }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching rooms',
            error: error.message
        });
    }
});

// Get room by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const room = await Room.findOne({
            where: {
                id: req.params.id,
                isActive: true
            },
            include: [{
                model: Facility,
                through: { attributes: [] }
            }]
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            data: { room }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching room',
            error: error.message
        });
    }
});

// Create room (admin only)
router.post('/',
    adminAuth,
    [
        body('name').trim().notEmpty().withMessage('Room name is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
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

            const { name, description, capacity, price, facilities } = req.body;

            // Check if room name already exists
            const existingRoom = await Room.findOne({ where: { name } });
            if (existingRoom) {
                return res.status(400).json({
                    success: false,
                    message: 'Room name already exists'
                });
            }

            // Create room
            const room = await Room.create({
                name,
                description,
                capacity,
                price
            });

            // Add facilities if provided
            if (facilities && facilities.length > 0) {
                await room.setFacilities(facilities);
            }

            // Fetch room with facilities
            const roomWithFacilities = await Room.findByPk(room.id, {
                include: [{
                    model: Facility,
                    through: { attributes: [] }
                }]
            });

            res.status(201).json({
                success: true,
                data: { room: roomWithFacilities }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating room',
                error: error.message
            });
        }
    }
);

// Update room (admin only)
router.put('/:id',
    adminAuth,
    [
        body('name').optional().trim().notEmpty().withMessage('Room name cannot be empty'),
        body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
        body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
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

            const room = await Room.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
            }

            const { name, description, capacity, price, facilities } = req.body;

            // Check if new name already exists (if name is being updated)
            if (name && name !== room.name) {
                const existingRoom = await Room.findOne({ where: { name } });
                if (existingRoom) {
                    return res.status(400).json({
                        success: false,
                        message: 'Room name already exists'
                    });
                }
            }

            // Update room
            await room.update({
                name: name || room.name,
                description: description || room.description,
                capacity: capacity || room.capacity,
                price: price || room.price
            });

            // Update facilities if provided
            if (facilities) {
                await room.setFacilities(facilities);
            }

            // Fetch updated room with facilities
            const updatedRoom = await Room.findByPk(room.id, {
                include: [{
                    model: Facility,
                    through: { attributes: [] }
                }]
            });

            res.json({
                success: true,
                data: { room: updatedRoom }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating room',
                error: error.message
            });
        }
    }
);

// Delete room (admin only - soft delete)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Soft delete
        await room.update({ isActive: false });

        res.json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting room',
            error: error.message
        });
    }
});

module.exports = router; 