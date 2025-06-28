const express = require('express');
const app = express();
const PORT = 5000;

const configs = {
  'auth-service': { url: 'http://localhost:5001' },
  'user-service': { url: 'http://localhost:5002' },
  'patient-service': { url: 'http://localhost:5003' },
  'pharmacy-service': { url: 'http://localhost:5004' }
};

app.get('/:serviceName', (req, res) => {
  const config = configs[req.params.serviceName];
  config ? res.json(config) : res.status(404).json({ error: 'Service not found' });
});

app.listen(PORT, () => console.log(`Config Service running on port ${PORT}`));
