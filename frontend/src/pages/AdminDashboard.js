import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
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
    IconButton,
    Tooltip,
    Autocomplete,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    ArrowBackIosNew as ArrowBackIosNewIcon,
    ArrowForwardIos as ArrowForwardIosIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfYear, endOfYear, addMonths, subMonths } from 'date-fns';
import { bookingsAPI, roomsAPI, facilitiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const statusColors = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'error',
    completed: 'info',
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [statusError, setStatusError] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [addRoomDialogOpen, setAddRoomDialogOpen] = useState(false);
    const [addFacilityDialogOpen, setAddFacilityDialogOpen] = useState(false);
    const [newRoom, setNewRoom] = useState({
        name: '',
        description: '',
        capacity: 1,
        price: 0,
        facilities: []
    });
    const [newFacility, setNewFacility] = useState({
        name: '',
        description: '',
        icon: ''
    });
    const [activeTab, setActiveTab] = useState(0);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        // Fetch data for the current year when the component mounts or year changes
        const year = currentMonth.getFullYear();
        fetchData(year);
    }, [currentMonth]); // Refetch data when the displayed month changes (to get the correct year)

    const fetchData = async (year) => {
        setLoading(true);
        setError('');
        try {
            const yearStart = startOfYear(new Date(year, 0, 1));
            const yearEnd = endOfYear(new Date(year, 11, 31));

            const [bookingsResponse, roomsResponse, facilitiesResponse] = await Promise.all([
                // Fetch bookings for the entire year for now, filter by month in frontend
                bookingsAPI.getAll({ startDate: format(yearStart, 'yyyy-MM-dd'), endDate: format(yearEnd, 'yyyy-MM-dd') }),
                roomsAPI.getAll(),
                facilitiesAPI.getAll()
            ]);
            setBookings(bookingsResponse.data.data.bookings || []);
            setRooms(roomsResponse.data.data.rooms || []);
            setFacilities(facilitiesResponse.data.data.facilities || []);
            console.log('Admin Dashboard bookings data:', bookingsResponse.data.data.bookings);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch data');
            setLoading(false);
        }
    };

    const handleStatusClick = (booking) => {
        setSelectedBooking(booking);
        setNewStatus(booking.status);
        setCancellationReason('');
        setStatusDialogOpen(true);
    };

    const handleStatusSubmit = async () => {
        try {
            const statusData = { status: newStatus };
            if (newStatus === 'cancelled') {
                if (!cancellationReason.trim()) {
                    setStatusError('Please provide a reason for cancellation');
                    return;
                }
                statusData.cancellationReason = cancellationReason;
            }
            await bookingsAPI.updateStatus(selectedBooking.id, statusData);
            setStatusDialogOpen(false);
            setStatusError('');
            setCancellationReason('');
            fetchData(selectedYear);
        } catch (err) {
            setStatusError(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDeleteClick = (booking) => {
        setSelectedBooking(booking);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await bookingsAPI.delete(selectedBooking.id);
            setDeleteDialogOpen(false);
            fetchData(selectedYear);
        } catch (err) {
            setDeleteError(err.response?.data?.message || 'Failed to delete booking');
        }
    };

    const handleAddRoom = async () => {
        try {
            // Convert facilities to array of IDs
            const roomData = {
                ...newRoom,
                facilities: newRoom.facilities.map(f => f.id)
            };
            await roomsAPI.create(roomData);
            setAddRoomDialogOpen(false);
            setNewRoom({
                name: '',
                description: '',
                capacity: 1,
                price: 0,
                facilities: []
            });
            fetchData(selectedYear);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add room');
        }
    };

    const handleAddFacility = async () => {
        try {
            await facilitiesAPI.create(newFacility);
            setAddFacilityDialogOpen(false);
            setNewFacility({
                name: '',
                description: '',
                icon: ''
            });
            fetchData(selectedYear);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add facility');
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleYearChange = (event) => {
        setSelectedYear(event.target.value);
    };

    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const getBookingsForDate = (date) => {
        if (!Array.isArray(bookings)) {
            return [];
        }
        return bookings.filter(booking =>
            isSameDay(new Date(booking.checkIn), date) ||
            isSameDay(new Date(booking.checkOut), date)
        );
    };

    const renderCalendar = () => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });

        // Pad the beginning and end of the month with empty days for calendar view
        const startDayOfWeek = start.getDay(); // 0 for Sunday, 6 for Saturday
        const endDayOfWeek = end.getDay();

        const emptyDaysBefore = startDayOfWeek; // Number of empty days before the 1st
        const emptyDaysAfter = 6 - endDayOfWeek; // Number of empty days after the last day

        const calendarDays = [
            ...Array(emptyDaysBefore).fill(null),
            ...days,
            ...Array(emptyDaysAfter).fill(null),
        ];

        // Group days into weeks (7 days per row)
        const weeks = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
            weeks.push(calendarDays.slice(i, i + 7));
        }

        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <IconButton onClick={handlePreviousMonth}>
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    <Typography variant="h6">{format(currentMonth, 'MMMM yyyy')}</Typography>
                    <IconButton onClick={handleNextMonth}>
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>
                <Grid container spacing={1}>
                    {weeks.map((week, weekIndex) => (
                        <Grid container item spacing={1} key={weekIndex}>
                            {week.map((day, dayIndex) => (
                                <Grid item xs key={dayIndex}>
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            p: 1,
                                            height: 120, // Fixed height for calendar cells
                                            overflow: 'hidden',
                                            bgcolor: day ? (getBookingsForDate(day).length > 0 ? 'action.hover' : 'background.paper') : 'grey.200',
                                            opacity: day ? 1 : 0.5,
                                        }}
                                    >
                                        {day && (
                                            <>
                                                <Typography variant="subtitle2" align="center">
                                                    {format(day, 'd')}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" align="center" display="block">
                                                    {getBookingsForDate(day).length} booking(s)
                                                </Typography>
                                                {/* Displaying only the first booking in the calendar cell */}
                                                {getBookingsForDate(day).slice(0, 1).map(booking => (
                                                    <Box key={booking.id} sx={{ mt: 0.5 }}>
                                                        <Typography variant="caption" display="block" noWrap>
                                                            Room: {booking.Room?.name || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption" display="block" noWrap>
                                                            Guest: {booking.reserverName || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </>
                                        )}
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    const renderFacilitiesSection = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h4">Facilities Management</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAddFacilityDialogOpen(true)}
                    >
                        Add New Facility
                    </Button>
                </Box>
            </Grid>

            <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Icon</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {facilities.map((facility) => (
                                    <TableRow key={facility.id}>
                                        <TableCell>{facility.name}</TableCell>
                                        <TableCell>{facility.description}</TableCell>
                                        <TableCell>{facility.icon}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Edit Facility">
                                                <IconButton size="small">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Facility">
                                                <IconButton size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>
        </Grid>
    );

    if (loading) {
        return (
            <Container>
                <Typography>Loading...</Typography>
            </Container>
        );
    }

    return (
        <ProtectedRoute requireAdmin>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="Dashboard" />
                        <Tab label="Facilities" />
                    </Tabs>
                </Box>

                {activeTab === 0 ? (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h4">Admin Dashboard</Typography>
                                <Box>
                                <FormControl sx={{ mr: 2, minWidth: 120 }}>
                                        <InputLabel id="year-select-label">Year</InputLabel>
                                        <Select
                                            labelId="year-select-label"
                                            value={selectedYear}
                                            label="Year"
                                            onChange={handleYearChange}
                                        >
                                            {[...Array(10)].map((_, i) => {
                                                const year = new Date().getFullYear() - 5 + i;
                                                return <MenuItem key={year} value={year}>{year}</MenuItem>;
                                            })}
                                        </Select>
                                    </FormControl>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setAddRoomDialogOpen(true)}
                                >
                                    Add New Room
                                </Button>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Calendar View - {format(currentMonth, 'MMMM yyyy')}
                                </Typography>
                                {renderCalendar()}
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    All Bookings
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Guest Name</TableCell>
                                                <TableCell>Phone</TableCell>
                                                <TableCell>Room</TableCell>
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
                                                    <TableCell>{booking.reserverName}</TableCell>
                                                    <TableCell>{booking.reserverPhone}</TableCell>
                                                    <TableCell>{booking.Room?.name || 'Room not found'}</TableCell>
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
                                                        <Tooltip title="Update Status">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleStatusClick(booking)}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete Booking">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteClick(booking)}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                ) : (
                    renderFacilitiesSection()
                )}

                {/* Status Update Dialog */}
                <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
                    <DialogTitle>Update Booking Status</DialogTitle>
                    <DialogContent>
                        {statusError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {statusError}
                            </Alert>
                        )}
                        <TextField
                            select
                            fullWidth
                            label="Status"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            SelectProps={{
                                native: true,
                            }}
                            sx={{ mt: 2 }}
                        >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </TextField>
                        {newStatus === 'cancelled' && (
                            <TextField
                                fullWidth
                                label="Cancellation Reason"
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                multiline
                                rows={3}
                                required
                                sx={{ mt: 2 }}
                            />
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleStatusSubmit} variant="contained">
                            Update
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent>
                        <Typography>Are you sure you want to delete this booking?</Typography>
                        {deleteError && (
                            <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Add Room Dialog */}
                <Dialog open={addRoomDialogOpen} onClose={() => setAddRoomDialogOpen(false)}>
                    <DialogTitle>Add New Room</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Room Name"
                            value={newRoom.name}
                            onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                            sx={{ mt: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={newRoom.description}
                            onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                            multiline
                            rows={3}
                            sx={{ mt: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Capacity"
                            type="number"
                            value={newRoom.capacity}
                            onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })}
                            sx={{ mt: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Price per Night"
                            type="number"
                            value={newRoom.price}
                            onChange={(e) => setNewRoom({ ...newRoom, price: parseFloat(e.target.value) })}
                            sx={{ mt: 2 }}
                        />
                        <Autocomplete
                            multiple
                            options={facilities}
                            getOptionLabel={(option) => option.name}
                            value={newRoom.facilities}
                            onChange={(event, newValue) => {
                                setNewRoom({ ...newRoom, facilities: newValue });
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Facilities"
                                    sx={{ mt: 2 }}
                                />
                            )}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAddRoomDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddRoom} variant="contained">
                            Add Room
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Add Facility Dialog */}
                <Dialog open={addFacilityDialogOpen} onClose={() => setAddFacilityDialogOpen(false)}>
                    <DialogTitle>Add New Facility</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Facility Name"
                            value={newFacility.name}
                            onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                            sx={{ mt: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={newFacility.description}
                            onChange={(e) => setNewFacility({ ...newFacility, description: e.target.value })}
                            multiline
                            rows={3}
                            sx={{ mt: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Icon (Material Icon name)"
                            value={newFacility.icon}
                            onChange={(e) => setNewFacility({ ...newFacility, icon: e.target.value })}
                            sx={{ mt: 2 }}
                            helperText="Enter a Material Icon name (e.g., wifi, ac_unit, tv)"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAddFacilityDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddFacility} variant="contained">
                            Add Facility
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </ProtectedRoute>
    );
};

export default AdminDashboard; 