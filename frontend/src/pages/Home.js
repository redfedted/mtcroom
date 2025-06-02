import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Box,
} from '@mui/material';
import { Hotel, Event, Security } from '@mui/icons-material';

const features = [
    {
        title: 'Comfortable Rooms',
        description: 'Choose from our selection of well-maintained rooms with modern amenities.',
        icon: <Hotel sx={{ fontSize: 40 }} />,
    },
    {
        title: 'Easy Booking',
        description: 'Book your stay with just a few clicks. Manage your bookings online.',
        icon: <Event sx={{ fontSize: 40 }} />,
    },
    {
        title: 'Secure Environment',
        description: 'Enjoy a safe and secure living environment with 24/7 security.',
        icon: <Security sx={{ fontSize: 40 }} />,
    },
];

const Home = () => {
    const navigate = useNavigate();

    return (
        <Box>
            {/* Hero Section */}
            <Box
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    py: 8,
                    mb: 6,
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h2" component="h1" gutterBottom>
                                Welcome to MTC Mangalore
                            </Typography>
                            <Typography variant="h5" paragraph>
                                Your home away from home. Find comfortable and affordable accommodation
                                for your stay.
                            </Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                size="large"
                                onClick={() => navigate('/rooms')}
                                sx={{ mt: 2 }}
                            >
                                View Rooms
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box
                                component="img"
                                src="/images/hero-image.jpg"
                                alt="PG Building"
                                sx={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: 2,
                                    boxShadow: 3,
                                }}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ mb: 8 }}>
                <Typography variant="h3" component="h2" align="center" gutterBottom>
                    Why Choose Us?
                </Typography>
                <Grid container spacing={4} sx={{ mt: 2 }}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    p: 2,
                                }}
                            >
                                <Box sx={{ color: 'primary.main', mb: 2 }}>
                                    {feature.icon}
                                </Box>
                                <CardContent>
                                    <Typography variant="h5" component="h3" gutterBottom>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Call to Action */}
            <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
                <Container maxWidth="md">
                    <Typography variant="h4" component="h2" align="center" gutterBottom>
                        Ready to Book Your Stay?
                    </Typography>
                    <Typography variant="body1" align="center" paragraph>
                        Join our community of satisfied residents and experience the best in
                        accommodation services.
                    </Typography>
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={() => navigate('/register')}
                            sx={{ mr: 2 }}
                        >
                            Sign Up Now
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="large"
                            onClick={() => navigate('/rooms')}
                        >
                            View Rooms
                        </Button>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default Home; 