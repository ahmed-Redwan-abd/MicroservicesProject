const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
});

const Drug = sequelize.define('Drug', {
  name: DataTypes.STRING,
  description: DataTypes.STRING,
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('Pharmacy Service MySQL connected');
    await sequelize.sync();
  } catch (err) {
    console.error('DB connection error:', err);
  }
}

// List all drugs
app.get('/drugs', async (req, res) => {
  try {
    const drugs = await Drug.findAll();
    res.json(drugs);
  } catch {
    res.status(500).json({ message: 'Failed to get drugs' });
  }
});

// Add new drug
app.post('/drugs', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });

  try {
    const drug = await Drug.create({ name, description });
    res.json(drug);
  } catch {
    res.status(500).json({ message: 'Failed to create drug' });
  }
});

// Delete drug by id
app.delete('/drugs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Drug.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Drug not found' });
    res.json({ message: 'Drug deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete drug' });
  }
});

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Register to Consul
const PORT = process.env.PORT || 5004;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Pharmacy Service running on port ${PORT}`);

  try {
    await axios.put('http://localhost:8500/v1/agent/service/register', {
      Name: 'pharmacy-service',
      ID: 'pharmacy1',
      Address: 'localhost',
      Port: Number(PORT),
      Check: {
        HTTP: `http://localhost:${PORT}/health`,
        Interval: '10s',
      }
    });
    console.log('Pharmacy Service registered in Consul');
  } catch (err) {
    console.error('Consul registration failed:', err.message);
  }
});
