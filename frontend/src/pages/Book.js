import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    Box,
    Chip,
    Alert,
    Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, differenceInDays } from 'date-fns';
import { bookingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Book = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [bookingData, setBookingData] = useState({
        roomId: '',
        checkIn: null,
        checkOut: null,
        specialRequests: '',
        reserverName: '',
        reserverPhone: ''
    });
    const [room, setRoom] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (location.state?.room) {
            setRoom(location.state.room);
            setBookingData((prev) => ({
                ...prev,
                roomId: location.state.room.id,
                checkIn: new Date(location.state.checkIn),
                checkOut: new Date(location.state.checkOut),
            }));
        } else {
            navigate('/rooms');
        }
    }, [location.state, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookingData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleDateChange = (name) => (date) => {
        setBookingData((prev) => ({
            ...prev,
            [name]: date,
        }));
    };

    const calculateTotalNights = () => {
        if (bookingData.checkIn && bookingData.checkOut) {
            return differenceInDays(bookingData.checkOut, bookingData.checkIn);
        }
        return 0;
    };

    const calculateTotalPrice = () => {
        if (room) {
            return calculateTotalNights() * room.price;
        }
        return 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Submitting booking data:', {
                ...bookingData,
                checkIn: bookingData.checkIn.toISOString(),
                checkOut: bookingData.checkOut.toISOString(),
            });

            const response = await bookingsAPI.create({
                ...bookingData,
                checkIn: bookingData.checkIn.toISOString(),
                checkOut: bookingData.checkOut.toISOString(),
            });

            console.log('Booking response:', response.data);

            if (response.data.success) {
                navigate('/rooms', {
                    state: { message: 'Booking created successfully! Please wait for confirmation.' },
                });
            } else {
                setError(response.data.message || 'Failed to create booking');
                setLoading(false);
            }
        } catch (err) {
            console.error('Booking error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to create booking');
            setLoading(false);
        }
    };

    if (!room) {
        return null;
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Book Room
                </Typography>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Room Details
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                {room.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {room.description}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                                {room.facilities.map((facility, index) => (
                                    <Chip
                                        key={index}
                                        label={facility}
                                        size="small"
                                        sx={{ mr: 1, mb: 1 }}
                                    />
                                ))}
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Check-in Date"
                                    value={bookingData.checkIn}
                                    onChange={handleDateChange('checkIn')}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    minDate={new Date()}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Check-out Date"
                                    value={bookingData.checkOut}
                                    onChange={handleDateChange('checkOut')}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    minDate={bookingData.checkIn || new Date()}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Your Name"
                                name="reserverName"
                                value={bookingData.reserverName}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="reserverPhone"
                                value={bookingData.reserverPhone}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Special Requests (Optional)"
                                name="specialRequests"
                                value={bookingData.specialRequests}
                                onChange={handleChange}
                                multiline
                                rows={4}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle1">
                                        Total Nights: {calculateTotalNights()}
                                    </Typography>
                                    <Typography variant="h6">
                                        Total Price: ₹{calculateTotalPrice()}
                                    </Typography>
                                </Box>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    disabled={loading}
                                >
                                    {loading ? 'Booking...' : 'Book Now'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default Book; 