import React, { useEffect, useState } from 'react';
import {
  Box, Button, Typography, List, ListItem, ListItemText, Paper, Divider
} from '@mui/material';
import axios from 'axios';

export default function DailyVisits() {
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const fetchDays = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/patients/days', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDays(res.data);
    } catch {
      setError('Failed to load days');
    }
  };

  const fetchPatientsForDay = async (dayId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/patients/${dayId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(res.data);
    } catch {
      setError('Failed to load patients');
    }
  };

  const handleAddDay = async () => {
    try {
      await axios.post('http://localhost:5000/api/patients/days', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchDays();
    } catch {
      setError('Day already exists or failed to add');
    }
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    fetchPatientsForDay(day.id);
  };

  useEffect(() => {
    fetchDays();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Patient Days</Typography>
      <Button variant="contained" onClick={handleAddDay} sx={{ mb: 2 }}>
        Add Today
      </Button>

      {error && <Typography color="error">{error}</Typography>}

      <Paper elevation={3} sx={{ maxWidth: 300, mb: 4 }}>
        <List>
          {days.map((day) => (
            <ListItem
              button
              key={day.id}
              selected={selectedDay?.id === day.id}
              onClick={() => handleSelectDay(day)}
            >
              <ListItemText primary={new Date(day.date).toDateString()} />
            </ListItem>
          ))}
        </List>
      </Paper>

      {selectedDay && (
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Patients on {new Date(selectedDay.date).toDateString()}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {patients.length > 0 ? (
            <List>
              {patients.map((p) => (
                <ListItem key={p.id}>
                  <ListItemText primary={p.name} secondary={p.status} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No patients recorded for this day.</Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}
