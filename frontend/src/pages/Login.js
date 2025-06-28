import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
const [checkingAuth, setCheckingAuth] = useState(true); // track if checking token

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    } else {
      setCheckingAuth(false); // no token, show form
    }
  }, [navigate]);

  if (checkingAuth) {
    // Or render a spinner here if you want
    return null; // render nothing while checking
  }
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/auth/login', form);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed: Invalid username or password');
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 4,
          borderRadius: 3,
          boxShadow: 3,
          bgcolor: 'background.paper',
          width: '100%',
        }}
      >
        <Typography variant="h4" align="center" mb={3} color="primary.main" fontWeight="bold">
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Username"
          name="username"
          value={form.username}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          autoComplete="username"
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3, py: 1.8, fontWeight: 'bold' }}
        >
          Login
        </Button>
      </Box>
    </Container>
  );
}
