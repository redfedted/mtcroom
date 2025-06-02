import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Box,
    Chip,
    TextField,
    InputAdornment,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import {
    Search,
    FilterList,
    Hotel,
    Wifi,
    LocalParking,
    Restaurant,
    AcUnit,
    Tv,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { roomsAPI } from '../services/api';
import { bookingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const facilityIcons = {
    wifi: <Wifi />,
    parking: <LocalParking />,
    food: <Restaurant />,
    ac: <AcUnit />,
    tv: <Tv />,
};

const Rooms = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [checkIn, setCheckIn] = useState(null);
    const [checkOut, setCheckOut] = useState(null);
    const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
    const [availabilityError, setAvailabilityError] = useState('');

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await roomsAPI.getAll();
            setRooms(response.data.data.rooms || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch rooms');
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleRoomClick = (room) => {
        setSelectedRoom(room);
        setAvailabilityDialogOpen(true);
    };

    const handleCheckAvailability = async () => {
        if (!checkIn || !checkOut) {
            setAvailabilityError('Please select both check-in and check-out dates');
            return;
        }

        try {
            // Format dates to YYYY-MM-DD to avoid timezone issues
            const formattedCheckIn = format(checkIn, 'yyyy-MM-dd');
            const formattedCheckOut = format(checkOut, 'yyyy-MM-dd');

            const response = await bookingsAPI.checkAvailability({
                roomId: selectedRoom.id,
                checkIn: formattedCheckIn,
                checkOut: formattedCheckOut,
            });

            console.log('Availability check response data:', response.data);
            console.log('Keys in response.data:', Object.keys(response.data));
            console.log('Availability check isAvailable:', response.data.data.isAvailable);

            if (response.data.data.isAvailable) {
                navigate('/book', {
                    state: {
                        room: selectedRoom,
                        checkIn: formattedCheckIn,
                        checkOut: formattedCheckOut,
                    },
                });
            } else {
                setAvailabilityError('Room is not available for the selected dates');
            }
        } catch (err) {
            setAvailabilityError(err.response?.data?.message || 'Failed to check availability');
        }
    };

    const filteredRooms = rooms.filter((room) =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Container>
                <Typography>Loading...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container>
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Available Rooms
                </Typography>

                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={handleSearch}
                    sx={{ mb: 4 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />

                <Grid container spacing={4}>
                    {filteredRooms.map((room) => (
                        <Grid item xs={12} md={6} lg={4} key={room.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                }}
                                onClick={() => handleRoomClick(room)}
                            >
                                {/* <CardMedia
                                    component="img"
                                    height="200"
                                    image={room.image || '/images/room-placeholder.jpg'}
                                    alt={room.name}
                                /> */}
                                <CardContent>
                                    <Typography variant="h5" component="h2" gutterBottom>
                                        {room.name}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        paragraph
                                    >
                                        {room.description}
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        {room.facilities.map((facility) => (
                                            <Chip
                                                key={facility.id}
                                                icon={facilityIcons[facility.name.toLowerCase()]}
                                                label={facility.name}
                                                size="small"
                                                sx={{ mr: 1, mb: 1 }}
                                            />
                                        ))}
                                    </Box>
                                    <Typography variant="h6" color="primary">
                                        ₹{room.price} per night
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <Dialog
                open={availabilityDialogOpen}
                onClose={() => setAvailabilityDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Check Availability</DialogTitle>
                <DialogContent>
                    {selectedRoom && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {selectedRoom.name}
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <DatePicker
                                            label="Check-in Date"
                                            value={checkIn}
                                            onChange={setCheckIn}
                                            renderInput={(params) => (
                                                <TextField {...params} fullWidth />
                                            )}
                                            minDate={new Date()}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <DatePicker
                                            label="Check-out Date"
                                            value={checkOut}
                                            onChange={setCheckOut}
                                            renderInput={(params) => (
                                                <TextField {...params} fullWidth />
                                            )}
                                            minDate={checkIn || new Date()}
                                        />
                                    </Grid>
                                </Grid>
                            </LocalizationProvider>
                            {availabilityError && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {availabilityError}
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAvailabilityDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCheckAvailability}
                        variant="contained"
                        color="primary"
                    >
                        Check Availability
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Rooms; 