import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://mtcroom.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getCurrentUser: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout')
};

// Rooms API
export const roomsAPI = {
    getAll: () => api.get('/rooms'),
    getById: (id) => api.get(`/rooms/${id}`),
    create: (roomData) => api.post('/rooms', roomData),
    update: (id, roomData) => api.put(`/rooms/${id}`, roomData),
    delete: (id) => api.delete(`/rooms/${id}`)
};

// Facilities API
export const facilitiesAPI = {
    getAll: () => api.get('/facilities'),
    getById: (id) => api.get(`/facilities/${id}`),
    create: (facilityData) => api.post('/facilities', facilityData),
    update: (id, facilityData) => api.put(`/facilities/${id}`, facilityData),
    delete: (id) => api.delete(`/facilities/${id}`)
};

// Bookings API
export const bookingsAPI = {
    getAll: (params) => api.get('/bookings/admin', { params }),
    getMyBookings: () => api.get('/bookings/my-bookings'),
    checkAvailability: (params) => api.get('/bookings/check-availability', { params }),
    create: (bookingData) => api.post('/bookings', bookingData),
    updateStatus: (id, statusData) => api.patch(`/bookings/${id}/status`, statusData),
    cancel: (id, reason) => api.post(`/bookings/${id}/cancel`, { reason }),
    delete: (id) => api.delete(`/bookings/${id}`)
};

export default api; 