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
                email: 'admin@roomie.com'
            }
        });

        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Create admin user with secure credentials
        const adminUser = await User.create({
            name: 'Roomie Admin',
            email: 'admin@roomie.com',
            password: 'Admin@123', // This will be hashed automatically
            role: 'admin'
        });

        console.log('Permanent admin user created successfully:', {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role
        });

    } catch (error) {
        console.error('Error setting up admin user:', error);
    }
}

module.exports = setupAdminUser; 