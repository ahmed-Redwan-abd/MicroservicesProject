import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Alert,
} from '@mui/material';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', role: 'receptionist' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:5000/auth/register', form, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000,
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
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
          Register
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
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
          autoComplete="new-password"
        />

        <FormControl fullWidth margin="normal" required>
          <InputLabel id="role-select-label">Role</InputLabel>
          <Select
            labelId="role-select-label"
            id="role-select"
            name="role"
            value={form.role}
            label="Role"
            onChange={handleChange}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="doctor">Doctor</MenuItem>
            <MenuItem value="nurse">Nurse</MenuItem>
            <MenuItem value="receptionist">Receptionist</MenuItem>
            <MenuItem value="pharmacist">Pharmacist</MenuItem>
          </Select>
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3, py: 1.8, fontWeight: 'bold' }}
        >
          Sign Up
        </Button>
      </Box>
    </Container>
  );
}
