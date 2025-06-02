const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    RoomId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Rooms',
            key: 'id'
        }
    },
    UserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    checkIn: {
        type: DataTypes.DATE,
        allowNull: false
    },
    checkOut: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        defaultValue: 'pending'
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    specialRequests: {
        type: DataTypes.TEXT
    },
    cancellationReason: {
        type: DataTypes.TEXT
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    reserverName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reserverPhone: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    validate: {
        checkOutAfterCheckIn() {
            if (this.checkOut <= this.checkIn) {
                throw new Error('Check-out date must be after check-in date');
            }
        }
    }
});

module.exports = Booking; 