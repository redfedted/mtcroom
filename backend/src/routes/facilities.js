const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Facility } = require('../models');
const { adminAuth } = require('../middleware/auth');

// Get all facilities (public)
router.get('/', async (req, res) => {
    try {
        const facilities = await Facility.findAll({
            where: { isActive: true }
        });

        res.json({
            success: true,
            data: { facilities }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching facilities',
            error: error.message
        });
    }
});

// Get facility by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const facility = await Facility.findOne({
            where: {
                id: req.params.id,
                isActive: true
            }
        });

        if (!facility) {
            return res.status(404).json({
                success: false,
                message: 'Facility not found'
            });
        }

        res.json({
            success: true,
            data: { facility }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching facility',
            error: error.message
        });
    }
});

// Create facility (admin only)
router.post('/',
    adminAuth,
    [
        body('name').trim().notEmpty().withMessage('Facility name is required'),
        body('description').optional().trim(),
        body('icon').optional().trim()
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

            const { name, description, icon } = req.body;

            // Check if facility name already exists
            const existingFacility = await Facility.findOne({ where: { name } });
            if (existingFacility) {
                return res.status(400).json({
                    success: false,
                    message: 'Facility name already exists'
                });
            }

            // Create facility
            const facility = await Facility.create({
                name,
                description,
                icon
            });

            res.status(201).json({
                success: true,
                data: { facility }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating facility',
                error: error.message
            });
        }
    }
);

// Update facility (admin only)
router.put('/:id',
    adminAuth,
    [
        body('name').optional().trim().notEmpty().withMessage('Facility name cannot be empty'),
        body('description').optional().trim(),
        body('icon').optional().trim()
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

            const facility = await Facility.findByPk(req.params.id);
            if (!facility) {
                return res.status(404).json({
                    success: false,
                    message: 'Facility not found'
                });
            }

            const { name, description, icon } = req.body;

            // Check if new name already exists (if name is being updated)
            if (name && name !== facility.name) {
                const existingFacility = await Facility.findOne({ where: { name } });
                if (existingFacility) {
                    return res.status(400).json({
                        success: false,
                        message: 'Facility name already exists'
                    });
                }
            }

            // Update facility
            await facility.update({
                name: name || facility.name,
                description: description !== undefined ? description : facility.description,
                icon: icon !== undefined ? icon : facility.icon
            });

            res.json({
                success: true,
                data: { facility }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating facility',
                error: error.message
            });
        }
    }
);

// Delete facility (admin only - soft delete)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const facility = await Facility.findByPk(req.params.id);
        if (!facility) {
            return res.status(404).json({
                success: false,
                message: 'Facility not found'
            });
        }

        // Soft delete
        await facility.update({ isActive: false });

        res.json({
            success: true,
            message: 'Facility deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting facility',
            error: error.message
        });
    }
});

module.exports = router; 