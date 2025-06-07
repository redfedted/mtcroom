const { User } = require('../models');
const sequelize = require('../config/database');
require('dotenv').config();

async function setupAdminUser() {
    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({
            where: {
                name: 'Roomie Admin',
                phone: '1234567890'
            }
        });

        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Create admin user with secure credentials
        const adminUser = await User.create({
            name: 'Roomie Admin',
            email: null,
            password: null,
            role: 'admin',
            phone: '1234567890'
        });

        console.log('Permanent admin user created successfully:', {
            id: adminUser.id,
            name: adminUser.name,
            phone: adminUser.phone,
            role: adminUser.role
        });

    } catch (error) {
        console.error('Error setting up admin user:', error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

module.exports = setupAdminUser; 