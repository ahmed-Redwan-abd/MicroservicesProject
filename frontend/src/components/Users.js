import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem
} from '@mui/material';
import axios from 'axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [editUserId, setEditUserId] = useState(null);
  const [editData, setEditData] = useState({ username: '', role: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [registerDialog, setRegisterDialog] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: '' });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch {
      setError('Failed to fetch users');
    }
  };

  const handleEditOpen = (user) => {
    setEditUserId(user.id);
    setEditData({ username: user.username, role: user.role });
  };

  const handleEditCancel = () => {
    setEditUserId(null);
    setEditData({ username: '', role: '' });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${id}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('User updated successfully');
      setEditUserId(null);
      fetchUsers();
    } catch {
      setError('Failed to update user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('User deleted');
      fetchUsers();
    } catch {
      setError('Failed to delete user');
    }
  };

  const handleResetPassword = async (userId) => {
    const defaultPassword = '12345678';
    try {
      await axios.post(
        `http://localhost:5000/api/users/${userId}/reset-password`,
        { password: defaultPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Password reset successfully');
    } catch {
      setError('Failed to reset password');
    }
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    if (!newUser.username || !newUser.password || !newUser.role) {
      setError('All fields are required');
      return;
    }
    try {
      await axios.post('http://localhost:5000/auth/register', newUser, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        timeout: 5000,
      });
      setSuccess('User registered successfully');
      setRegisterDialog(false);
      setNewUser({ username: '', password: '', role: '' });
      fetchUsers();
    } catch {
      setError('Failed to register user');
    }
  };

  return (
    <Box>
      <Typography variant="h6">Employees List</Typography>

      {success && <Typography color="green">{success}</Typography>}
      {error && <Typography color="red">{error}</Typography>}

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => setRegisterDialog(true)}
      >
        Register Employee
      </Button>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>
                  {editUserId === user.id ? (
                    <TextField
                      name="username"
                      value={editData.username}
                      onChange={handleEditChange}
                      size="small"
                    />
                  ) : (
                    user.username
                  )}
                </TableCell>
                <TableCell>
                  {editUserId === user.id ? (
                    <TextField
                      name="role"
                      value={editData.role}
                      onChange={handleEditChange}
                      size="small"
                    />
                  ) : (
                    user.role
                  )}
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {editUserId === user.id ? (
                    <>
                      <Button onClick={() => handleEditSubmit(user.id)} size="small" variant="contained" sx={{ mr: 1 }}>Save</Button>
                      <Button onClick={handleEditCancel} size="small" variant="outlined">Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => handleEditOpen(user)} size="small" variant="outlined" sx={{ mr: 1 }}>Edit</Button>
                      <Button onClick={() => handleDelete(user.id)} size="small" variant="outlined" color="error" sx={{ mr: 1 }}>Delete</Button>
                      <Button onClick={() => handleResetPassword(user.id)} size="small" variant="outlined" color="warning">Reset Password</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Register Dialog */}
      <Dialog open={registerDialog} onClose={() => setRegisterDialog(false)}>
        <DialogTitle>Register New Employee</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="username"
            label="Username"
            fullWidth
            value={newUser.username}
            onChange={handleNewUserChange}
          />
          <TextField
            margin="dense"
            name="password"
            label="Password"
            type="password"
            fullWidth
            value={newUser.password}
            onChange={handleNewUserChange}
          />
          <TextField
            select
            margin="dense"
            name="role"
            label="Role"
            fullWidth
            value={newUser.role}
            onChange={handleNewUserChange}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="doctor">Doctor</MenuItem>
            <MenuItem value="nurse">Nurse</MenuItem>
            <MenuItem value="receptionist">Receptionist</MenuItem>
            <MenuItem value="pharmacist">Pharmacist</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialog(false)}>Cancel</Button>
          <Button onClick={handleRegister} variant="contained">Register</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
