const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// =========================
// REGISTER
// =========================
router.post('/register', async (req, res) => {
  const { name, email, password, adminKey } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required.'
    });
  }

  try {
    // Check existing user
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered.'
      });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Decide Role
    let role = 'user';

    // If admin secret matches
    if (adminKey === 'ADMIN123') {
      role = 'admin';
    }

    // Insert User
    const [result] = await db.query(
      'INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',
      [name, email, hashedPassword, role]
    );

    res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} account created successfully.`,
      userId: result.insertId
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: 'Database registration error.'
    });
  }
});


// =========================
// LOGIN
// =========================
router.post('/login', async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password required.'
    });
  }

  try {

    const [users] = await db.query(
      'SELECT * FROM users WHERE email=?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const user = users[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || "secretkey",
      {
        expiresIn: "7d"
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      error: 'Database login error.'
    });

  }

});


// =========================
// CURRENT USER
// =========================
router.get('/me', verifyToken, async (req, res) => {

  try {

    const [users] = await db.query(
      'SELECT id,name,email,role FROM users WHERE id=?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      error: 'Database session error.'
    });

  }

});

module.exports = router;