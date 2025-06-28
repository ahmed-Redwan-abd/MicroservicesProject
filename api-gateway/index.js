require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function getServiceUrl(serviceName) {
  try {
    const res = await axios.get(`http://localhost:8500/v1/catalog/service/${serviceName}`);
    const [service] = res.data;
    return `http://${service.Address}:${service.ServicePort}`;
  } catch (err) {
    console.error(`Failed to fetch ${serviceName} from Consul`, err.message);
    return null;
  }
}
// Health API to check if gateway running or not.
app.get('/health', (req, res) => res.send('API Gateway running'));

// API's to forwarward into auth-service
app.post('/auth/register', async (req, res) => {
  console.log('Gateway received /auth/register', req.body);
  const url = await getServiceUrl('auth-service');
  console.log('Resolved auth-service URL:', url); // Log this
  if (!url) return res.status(500).json({ message: 'Auth service not available' });

  try {
    const response = await axios.post(`${url}/register`, req.body);
    res.json(response.data);
  } catch (err) {
    console.error('Register forward error:', err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { message: 'Register error' });
  }
});

app.post('/auth/login', async (req, res) => {
  console.log('Gateway received /auth/login', req.body);

  const url = await getServiceUrl('auth-service');
  if (!url) return res.status(500).json({ message: 'Auth service not available' });

  try {
    const response = await axios.post(`${url}/login`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { message: 'Login error' });
  }
});

app.delete('/auth/user/:id', async (req, res) => {
  const url = await getServiceUrl('auth-service');
  if (!url) return res.status(500).json({ message: 'Auth service not available' });

  try {
    const response = await axios.delete(`${url}/user/${req.params.id}`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { message: 'Delete error' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    const response = await axios.get('http://localhost:5001/users', {
      headers: { Authorization: authHeader },
    });

    res.json(response.data);
  } catch (err) {
    console.error('API Gateway error:', err.message);
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const url = await getServiceUrl('auth-service');
    if (!url) return res.status(500).json({ message: 'Auth service not available' });

    const response = await axios.get(`${url}/users/${req.params.id}`, {
      headers: { Authorization: authHeader },
    });
    res.json(response.data);
  } catch (err) {
    console.error(`API Gateway /api/users/${req.params.id} error:`, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const url = await getServiceUrl('auth-service');
    if (!url) return res.status(500).json({ message: 'Auth service not available' });

    const response = await axios.put(`${url}/users/${req.params.id}`, req.body, {
      headers: { Authorization: authHeader },
    });
    res.json(response.data);
  } catch (err) {
    console.error(`API Gateway PUT /api/users/${req.params.id} error:`, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const url = await getServiceUrl('auth-service');
  console.log("delete ", req.params.id, `${url}/users/${req.params.id}`);
  if (!url) return res.status(500).json({ message: 'Auth service not available' });
  try{
    const response = await axios.delete(`${url}/users/delete/${req.params.id}`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.status(response.status).json(response.data);

  }catch (err){
    console.error('Register forward error:', err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { message: 'Register error' });

  }
}
)

app.post('/api/users/:id/reset-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const url = await getServiceUrl('auth-service');
    if (!url) return res.status(500).json({ message: 'Auth service not available' });

    const response = await axios.post(`${url}/users/${req.params.id}/reset-password`, req.body, {
      headers: { Authorization: authHeader },
    });
    res.json(response.data);
  } catch (err) {
    console.error(`API Gateway POST /api/users/${req.params.id}/reset-password error:`, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// API's to forwarward into patient-service
app.get("/api/patients",  async (req, res) => {
  const authHeader = req.headers.authorization;
  const url = await getServiceUrl('patient-service');
  if (!url) return res.status(500).json({ message: 'Patient service not available' });
  const response = await axios.get(`${url}/patients`, {
    headers: { Authorization: authHeader },
  });
  res.json(response.data);
});

app.post("/api/patients",  async (req, res) => {
  const authHeader = req.headers.authorization;
  const url = await getServiceUrl('patient-service');
  if (!url) return res.status(500).json({ message: 'Patient service not available' });
  console.log("/api/patients",  url)
  const response = await axios.post(`${url}/patients`, req.body, {
    headers: { Authorization: authHeader },
  });
  res.json(response.data);
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const url = await getServiceUrl('patient-service');
    if (!url) return res.status(500).json({ message: 'patient service not available' });

    const response = await axios.put(`${url}/patients/${req.params.id}`, req.body, {
      headers: { Authorization: authHeader },
    });
    res.json(response.data);
  } catch (err) {
    console.error(`API Gateway PUT /api/users/${req.params.id} error:`, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

app.delete("/api/patients/:id",  async (req, res) => {
  const authHeader = req.headers.authorization;
  const url = await getServiceUrl('patient-service');
  if (!url) return res.status(500).json({ message: 'Patient service not available' });
  const response = await axios.delete(`${url}/patients/${req.params.id}`, req.body, {
    headers: { Authorization: authHeader },
  });
  res.json(response.data);
});

app.get("/api/patients/days",  async (req, res) => {
  const authHeader = req.headers.authorization;
  const url = await getServiceUrl('patient-service');
  if (!url) return res.status(500).json({ message: 'Patient service not available' });
  const response = await axios.get(`${url}/patients/days`, {
    headers: { Authorization: authHeader },
  });
  res.json(response.data);
});
app.post("/api/patients/days",  async (req, res) => {
  const authHeader = req.headers.authorization;
  const url = await getServiceUrl('patient-service');
  if (!url) return res.status(500).json({ message: 'Patient service not available' });

  const response = await axios.post(`${url}/patients/days`, req.body, {
    headers: { Authorization: authHeader },
  });
  res.json(response.data);
});

// listen for requests on port 5000, api-gateway port.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
