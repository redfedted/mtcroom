import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Link,
    Alert,
    Paper,
    Grid,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await register({
                name: formData.name,
                phone: formData.phone,
            });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <Typography component="h1" variant="h5">
                        Sign up
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    id="name"
                                    label="Full Name"
                                    name="name"
                                    autoComplete="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    id="phone"
                                    label="Phone Number"
                                    name="phone"
                                    autoComplete="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign Up
                        </Button>
                        <Box sx={{ textAlign: 'center' }}>
                            <Link component={RouterLink} to="/login" variant="body2">
                                Already have an account? Sign in
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register; 