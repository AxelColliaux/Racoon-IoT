const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { JWT_SECRET } = require('./middleware');

const TOKEN_EXPIRY = '24h';

function usersCollection() {
  return getDb().collection('users');
}

/**
 * POST /api/auth/register
 * Body: { username, password }
 */
async function register(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const col = usersCollection();
    const existing = await col.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await col.insertOne({
      username,
      password: hashedPassword,
      created_at: new Date(),
    });

    const token = jwt.sign(
      { id: result.insertedId.toString(), username },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY },
    );

    res.status(201).json({ token, username });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const col = usersCollection();
    const user = await col.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), username },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY },
    );

    res.json({ token, username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function registerAuthRoutes(app) {
  app.post('/api/auth/register', register);
  app.post('/api/auth/login', login);
}

module.exports = { registerAuthRoutes };
