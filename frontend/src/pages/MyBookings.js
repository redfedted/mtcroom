import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Box,
} from '@mui/material';
import { format } from 'date-fns';
import { bookingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const statusColors = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'error',
    completed: 'info',
};

const MyBookings = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelError, setCancelError] = useState('');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await bookingsAPI.getMyBookings();
            setBookings(response.data.data.bookings || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch bookings');
            setLoading(false);
        }
    };

    const handleCancelClick = (booking) => {
        setSelectedBooking(booking);
        setCancelDialogOpen(true);
    };

    const handleCancelSubmit = async () => {
        if (!cancelReason.trim()) {
            setCancelError('Please provide a reason for cancellation');
            return;
        }

        try {
            await bookingsAPI.cancel(selectedBooking.id, cancelReason);
            setCancelDialogOpen(false);
            setCancelReason('');
            setCancelError('');
            fetchBookings();
        } catch (err) {
            setCancelError(err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const canCancelBooking = (booking) => {
        const checkInDate = new Date(booking.checkIn);
        const now = new Date();
        const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
        return booking.status === 'confirmed' && hoursUntilCheckIn >= 24;
    };

    if (loading) {
        return (
            <Container>
                <Typography>Loading...</Typography>
            </Container>
        );
    }

    return (
        <ProtectedRoute>
            <Container>
                <Box sx={{ my: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        My Bookings
                    </Typography>

                    {location.state?.message && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            {location.state.message}
                        </Alert>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Room</TableCell>
                                    <TableCell>Phone</TableCell>
                                    <TableCell>Check-in</TableCell>
                                    <TableCell>Check-out</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Total Price</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell>{booking.Room?.name || 'Room not found'}</TableCell>
                                        <TableCell>{booking.reserverPhone}</TableCell>
                                        <TableCell>
                                            {format(new Date(booking.checkIn), 'PPP')}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(booking.checkOut), 'PPP')}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={booking.status}
                                                color={statusColors[booking.status]}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>₹{booking.totalPrice}</TableCell>
                                        <TableCell>
                                            {canCancelBooking(booking) && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handleCancelClick(booking)}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {bookings.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            No bookings found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                <Dialog
                    open={cancelDialogOpen}
                    onClose={() => setCancelDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Cancel Booking</DialogTitle>
                    <DialogContent>
                        {cancelError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {cancelError}
                            </Alert>
                        )}
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Reason for Cancellation"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleCancelSubmit}
                            variant="contained"
                            color="error"
                        >
                            Confirm Cancellation
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </ProtectedRoute>
    );
};

export default MyBookings; 