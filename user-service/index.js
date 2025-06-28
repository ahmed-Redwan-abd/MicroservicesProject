const express = require('express');
const mongoose = require('mongoose');
const consul = require('consul')();
const app = express();

// Connect to DB from config service
(async () => {
  const config = await fetch('http://localhost:3005/user-service');
  const { dbUrl } = await config.json();
  await mongoose.connect(dbUrl);
})();

// User model
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  role: String
}));

// Protected routes
app.get('/users', async (req, res) => {
  if (req.user.role !== 'admin') 
    return res.status(403).send('Forbidden');
  
  const users = await User.find();
  res.json(users);
});

// Service registration
consul.agent.service.register({
  name: 'user-service',
  address: 'localhost',
  port: 3001
});

app.listen(3001, () => console.log('User service on 3001'));