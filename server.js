/**
 * Red Hat Properties - API Server
 * Handles /api/listings (GET/POST) and /api/listings/image (POST)
 * Stores listing data in MongoDB Atlas.
 *
 * Usage:
 *   node server.js
 *
 * Requires a .env file in this folder with:
 *   MONGODB_URI=mongodb+srv://<user>:<password>@...
 *   ADMIN_KEY=7751
 *   PORT=5000
 *   IMAGES_DIR=C:\inetpub\wwwroot\RedHat\assets\images
 */

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { MongoClient } = require('mongodb');

const app       = express();
const PORT      = process.env.PORT || 5000;
const ADMIN_KEY = process.env.ADMIN_KEY || '7751';
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME   = process.env.DB_NAME || 'redhatproperties';
const IMAGES_DIR = process.env.IMAGES_DIR || path.join(__dirname, 'src', 'assets', 'images');

if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI is not set in .env — exiting.');
  process.exit(1);
}

// ── Ensure images folder exists ───────────────────────────
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// ── MongoDB client ────────────────────────────────────────
const client = new MongoClient(MONGODB_URI);
let listingsCol;
let reviewsCol;

async function connectDb() {
  await client.connect();
  const db = client.db(DB_NAME);
  listingsCol = db.collection('listings');
  reviewsCol  = db.collection('reviews');
  // Seed from static JSON if collection is empty
  const count = await listingsCol.countDocuments();
  if (count === 0) {
    const seedPath = path.join(__dirname, 'src', 'assets', 'data', 'listings.json');
    if (fs.existsSync(seedPath)) {
      const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      await listingsCol.insertOne({ _id: 'main', ...seed });
      console.log('✅  Seeded listings from static JSON.');
    }
  }
  console.log(`✅  Connected to MongoDB (${DB_NAME})`);
}

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));

function requireAdminKey(req, res, next) {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  next();
}

// ── File upload config ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) => {
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safe);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// ── Routes ────────────────────────────────────────────────

// GET /api/listings
app.get('/api/listings', async (_req, res) => {
  try {
    const doc = await listingsCol.findOne({ _id: 'main' });
    if (!doc) return res.json({ active: [], sold: [] });
    res.json({ active: doc.active ?? [], sold: doc.sold ?? [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load listings' });
  }
});

// POST /api/listings — save full listings (admin only)
app.post('/api/listings', requireAdminKey, async (req, res) => {
  try {
    const { active = [], sold = [] } = req.body;
    await listingsCol.replaceOne(
      { _id: 'main' },
      { _id: 'main', active, sold },
      { upsert: true }
    );
    res.json({ message: 'Listings saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save listings' });
  }
});

// POST /api/listings/image — upload image (admin only)
app.post('/api/listings/image', requireAdminKey, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  res.json({
    filename: req.file.filename,
    path: `assets/images/${req.file.filename}`
  });
});

// ── Reviews ───────────────────────────────────────────────

// GET /api/reviews — public, returns only approved reviews
app.get('/api/reviews', async (_req, res) => {
  try {
    const reviews = await reviewsCol
      .find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

// GET /api/reviews/all — admin only, returns all reviews with status
app.get('/api/reviews/all', requireAdminKey, async (_req, res) => {
  try {
    const reviews = await reviewsCol
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

// POST /api/reviews — public submission
app.post('/api/reviews', async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    const firstName = req.body.firstName ?? name ?? '';
    const lastName = req.body.lastName ?? '';
    const email = req.body.email ?? '';
    const emailConsent = req.body.emailConsent === true;
    const title = req.body.title ?? '';
    if (!firstName?.trim() || !comment?.trim() || !title?.trim() || !rating) {
      return res.status(400).json({ error: 'Name, title, rating, and comment are required.' });
    }
    const ratingNum = parseInt(rating, 10);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }
    await reviewsCol.insertOne({
      name: firstName.trim().slice(0, 100),
      firstName: firstName.trim().slice(0, 100),
      lastName: lastName.trim().slice(0, 100),
      title: title.trim().slice(0, 150),
      email: email.trim().slice(0, 200),
      emailConsent,
      rating: ratingNum,
      comment: comment.trim().slice(0, 1000),
      status: 'pending',
      createdAt: new Date()
    });
    res.json({ message: 'Review submitted. It will appear after approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// PATCH /api/reviews/:id — approve or reject (admin only)
app.patch('/api/reviews/:id', requireAdminKey, async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }
    await reviewsCol.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status } }
    );
    res.json({ message: `Review ${status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// DELETE /api/reviews/:id — admin only
app.delete('/api/reviews/:id', requireAdminKey, async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    await reviewsCol.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ── Start ─────────────────────────────────────────────────
connectDb().then(() => {
  app.listen(PORT, () => console.log(`🚀  API server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('❌  MongoDB connection failed:', err.message);
  process.exit(1);
});
