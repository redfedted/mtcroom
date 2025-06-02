const User = require('./User');
const Room = require('./Room');
const Facility = require('./Facility');
const Booking = require('./Booking');

// User - Booking Association
User.hasMany(Booking, { foreignKey: 'UserId' });
Booking.belongsTo(User, { foreignKey: 'UserId' });

// Room - Booking Association
Room.hasMany(Booking, { foreignKey: 'RoomId' });
Booking.belongsTo(Room, { foreignKey: 'RoomId' });

// Room - Facility Association
Room.belongsToMany(Facility, { through: 'RoomFacilities' });
Facility.belongsToMany(Room, { through: 'RoomFacilities' });

module.exports = {
    User,
    Room,
    Facility,
    Booking
}; 