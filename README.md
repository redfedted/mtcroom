# Roomie - Room Booking System

A modern room booking system that allows users to book rooms and administrators to manage rooms, facilities, and bookings.

## Features

### Admin Features
- Secure authentication
- Room Management (CRUD)
- Facility Management
- Booking Management
- Dashboard with analytics

### User Features
- Public room availability view
- Room search and filtering
- Booking management
- User profile management

## Tech Stack
- Frontend: React.js with Material-UI
- Backend: Node.js with Express
- Database: PostgreSQL
- Authentication: JWT

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/roomie-pg-booking.git
cd roomie-pg-booking
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
```bash
# In backend directory
cp .env.example .env
# Edit .env with your database credentials
```

4. Start the development servers
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm start
```

## Project Structure
```
roomie-pg-booking/
├── frontend/           # React frontend
├── backend/           # Node.js backend
└── README.md
```

## License
MIT 