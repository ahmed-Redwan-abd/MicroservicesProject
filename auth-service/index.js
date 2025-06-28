const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Sequelize, DataTypes } = require("sequelize");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
  }
);

const User = sequelize.define("User", {
  username: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
  role: {
    type: DataTypes.ENUM(
      "admin",
      "manager",
      "doctor",
      "nurse",
      "receptionist",
      "pharmacist"
    ),
    allowNull: false,
    defaultValue: "receptionist",
  },
});

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

// Middleware to check if user is admin or manager
function adminOrManager(req, res, next) {
  console.log("inside admin or manager");
  const { role } = req.user;
  if (role !== "admin" && role !== "manager") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("Auth Service MySQL connected");
    await sequelize.sync();
  } catch (err) {
    console.error("DB connection error:", err);
  }
}

app.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ message: "Missing fields" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed, role });
    res.json({ message: "User registered", userId: user.id });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError")
      return res.status(400).json({ message: "Username already exists" });
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Missing username or password" });

  try {
    const user = await User.findOne({ where: { username } });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});


app.get("/health", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 5001;

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Auth Service running on port ${PORT}`);

  try {
    await axios.put("http://localhost:8500/v1/agent/service/register", {
      Name: "auth-service",
      ID: "auth1",
      Address: "localhost",
      Port: Number(PORT),
      Check: {
        HTTP: `http://localhost:${PORT}/health`,
        Interval: "10s",
      },
    });
    console.log("Auth Service registered in Consul");
  } catch (err) {
    console.error("Failed to register with Consul:", err.message);
  }
});

app.get("/users", verifyToken, adminOrManager, async (req, res) => {
  console.log("inside users route");
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "role", "createdAt", "updatedAt"], // exclude password
      order: [["createdAt", "DESC"]],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// GET /users/:id - get one user (admin/manager only)
app.get("/users/:id", verifyToken, adminOrManager, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ["id", "username", "role", "createdAt", "updatedAt"],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// PUT /users/:id - update username or role (admin/manager only)
app.put("/users/:id", verifyToken, adminOrManager, async (req, res) => {
  const { username, role } = req.body;

  if (!username && !role) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  // Optionally validate role here

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username) user.username = username;
    if (role) user.role = role;

    await user.save();
    res.json({ message: "User updated" });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Username already exists" });
    }
    res.status(500).json({ message: "Failed to update user" });
  }
});


app.delete('/users/delete/:id', verifyToken, async (req, res) => {
  const userIdToDelete = req.params.id;

  // Implement your delete logic here, for example:
  try {
    // Assuming you have a User model
    const deleted = await User.destroy({ where: { id: userIdToDelete } });
    if (deleted) {
      return res.json({ message: 'User deleted successfully' });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


// POST /users/:id/reset-password - reset user password (admin/manager only)
app.post(
  "/users/:id/reset-password",
  verifyToken,
  adminOrManager,
  async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json({ message: "New password required" });

    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
      await user.save();

      res.json({ message: "Password reset successful" });
    } catch {
      res.status(500).json({ message: "Failed to reset password" });
    }
  }
);
