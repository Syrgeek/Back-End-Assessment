const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Note = require('./models/Note'); // Mongoose model for Note
const User = require('./models/User'); // Mongoose model for User
const auth = require('./middleware/auth'); // Authentication middleware
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(helmet()); // Security middleware
app.use(cors()); // Enable CORS

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { msg: 'Too many requests, please try again later' }
});
app.use(limiter);

// MongoDB Configuration
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));
  
// Ensure text index on Note model
Note.createIndexes({ content: 'text' });

// Authentication Endpoints
// Signup
app.post('/api/auth/signup', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create Note
app.post('/api/notes', auth, async (req, res) => {
  try {
    const note = new Note({ ...req.body, owner: req.user.userId });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get Notes List
app.get('/api/notes', auth, async (req, res) => {
  try {
    const notes = await Note.find({ $or: [{ owner: req.user.userId }, { sharedWith: req.user.userId }] });
    res.json(notes);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get Note by ID
app.get('/api/notes/:id', auth, async (req, res) => {
    try {
      const note = await Note.findOne({ _id: req.params.id, owner: req.user.userId });
      if (!note) return res.status(404).json({ msg: 'Note not found' });
      res.json(note);
    } catch (err) {
      res.status(500).send('Server error');
    }
  });

// Update Note
app.put('/api/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate({ _id: req.params.id, owner: req.user.userId }, req.body, { new: true });
    if (!note) return res.status(404).json({ msg: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete Note
app.delete('/api/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
    if (!note) return res.status(404).json({ msg: 'Note not found' });
    res.json({ msg: 'Note deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Share Note
app.post('/api/notes/:id/share', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      { $addToSet: { sharedWith: userId } },
      { new: true }
    );
    if (!note) return res.status(404).json({ msg: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.get('/api/search', auth, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ msg: 'q is required' });
  
      // Ensure text index exists
      await Note.collection.createIndex({ title: "text", content: "text" });
  
      const notes = await Note.find({
        $and: [
          { $or: [{ owner: req.user.userId }, { sharedWith: req.user.userId }] },
          { $text: { $search: q } }
        ]
      });
  
      res.json(notes);
    } catch (err) {
      console.error('Search error:', err);
      res.status(500).send('Server error');
    }
  });
  

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
