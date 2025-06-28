const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
});

const Patient = sequelize.define('Patient', {
  name: DataTypes.STRING,
  age: DataTypes.INTEGER,
  phone: DataTypes.STRING,
  idintity: DataTypes.STRING,
  status: DataTypes.STRING,
});

const DailyVisit = sequelize.define('DailyVisit', {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true,
  },
});

// Sync database
sequelize.sync().then(() => {
  console.log('Database synced');
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('Patient Service MySQL connected');
    await sequelize.sync();
  } catch (err) {
    console.error('DB connection error:', err);
  }
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully:', decoded);

    req.user = decoded; // attach user info to request for later use
    next(); // Important: call next() to proceed!
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.status(403).json({ message: 'Failed to authenticate token' });
  }
}

// List all patients
app.get('/patients',verifyToken, async (req, res) => {
  try {
    const patients = await Patient.findAll();
    res.json(patients);
  } catch {
    res.status(500).json({ message: 'Failed to get patients' });
  }
});

// Add new patient
app.post('/patients',verifyToken, async (req, res) => {
  console.log("post patients", req.body.name);
  const { name, age, phone, idintity, status } = req.body;
  console.log(name);
  // if (name || age || idintity || status == null) return res.status(400).json({ message: 'Name and age required' });
  console.log("post patients2");
  try {
    const patient = await Patient.create(req.body);
    console.log("post patients3");
    res.json(patient);
  } catch {
    res.status(500).json({ message: 'Failed to create patient' });
  }
});

app.get('/patients/days',verifyToken, async(req, res) =>{
  try {
    // Assuming you have a Day model representing the days table
    const days = await DailyVisit.findAll({
      order: [['date', 'DESC']], // optional ordering by date
    });

    res.status(200).json(days);
  } catch (error) {
    console.error('Failed to fetch days:', error);
    res.status(500).json({ message: 'Failed to fetch days' });
  }
});

app.post('/patients/days',verifyToken, async(req, res) =>{
  const today = new Date().toISOString().split('T')[0];

  try {
    const [visit, created] = await DailyVisit.findOrCreate({
      where: { date: today },
    });

    if (created) {
      return res.status(201).json({ success: true, message: 'New visit created', visit });
    } else {
      return res.status(200).json({ success: false, message: 'Visit already exists for today', visit });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
})

app.put('/patients/:id', async (req, res) => {
  const { id } = req.params;
  const { name, age, phone, idintity, status } = req.body;

  try {
    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Update fields
    patient.name = name ?? patient.name;
    patient.age = age ?? patient.age;
    patient.phone = phone ?? patient.phone;
    patient.idintity = idintity ?? patient.idintity;
    patient.status = status ?? patient.status;

    await patient.save();

    res.json({ message: 'Patient updated successfully', patient });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ message: 'Failed to update patient' });
  }
});

// Delete patient by id
app.delete('/patients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Patient.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete patient' });
  }
});

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Register to Consul
const PORT = process.env.PORT || 5003;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Patient Service running on port ${PORT}`);

  try {
    await axios.put('http://localhost:8500/v1/agent/service/register', {
      Name: 'patient-service',
      ID: 'patient1',
      Address: 'localhost',
      Port: Number(PORT),
      Check: {
        HTTP: `http://localhost:${PORT}/health`,
        Interval: '10s',
      }
    });
    console.log('Patient Service registered in Consul');
  } catch (err) {
    console.error('Consul registration failed:', err.message);
  }
});
