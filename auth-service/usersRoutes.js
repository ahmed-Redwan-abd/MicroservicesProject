const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('./models'); // import your Sequelize User model
const router = express.Router();

// Your verifyToken helper function
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1]; // Expect "Bearer TOKEN"
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Middleware to authenticate and attach user info
function authMiddleware(req, res, next) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  req.user = user;
  next();
}

// Middleware to check if user is admin or manager
function adminOrManager(req, res, next) {
  const { role } = req.user;
  if (role !== 'admin' && role !== 'manager') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

// GET /users - list all users (admin/manager only)
router.get('/users', authMiddleware, adminOrManager, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'createdAt', 'updatedAt'], // exclude password
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /users/:id - get one user (admin/manager only)
router.get('/users/:id', authMiddleware, adminOrManager, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'role', 'createdAt', 'updatedAt'],
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// PUT /users/:id - update username or role (admin/manager only)
router.put('/users/:id', authMiddleware, adminOrManager, async (req, res) => {
  const { username, role } = req.body;

  if (!username && !role) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  // Optionally validate role here

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username) user.username = username;
    if (role) user.role = role;

    await user.save();
    res.json({ message: 'User updated' });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// DELETE /users/:id - delete user (admin/manager only)
router.delete('/users/:id', authMiddleware, adminOrManager, async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// POST /users/:id/reset-password - reset user password (admin/manager only)
router.post('/users/:id/reset-password', authMiddleware, adminOrManager, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ message: 'New password required' });

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;
