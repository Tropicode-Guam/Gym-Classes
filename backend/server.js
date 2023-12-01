// Import necessary libraries
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const router = express.Router()
const auth = require('./utils/auth')

const API_BASE = process.env['API_BASE']

// Import your models
const Class = require('./models/Class'); // Ensure you have created the Class model

// Load environment variables
require('dotenv').config();

// Retrieve DB_URL from environment variables
function generate_db_url(username, password) {
  return `mongodb://${username}:${password}@${process.env.DB_HOST}/${process.env.DB_NAME}`
}
const DB_URL = generate_db_url(process.env.DB_USER, process.env.DB_PASSWORD)

if (!DB_URL) {
  console.error('DB_URL is not defined in your environment variables');
  process.exit(1); // Exit the process if DB_URL is not defined
}

// Connect to MongoDB
mongoose.connect(DB_URL)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit if cannot connect to database
  });

// Optional: Listen to various connection events
mongoose.connection.on('error', err => {
  console.error('Mongoose default connection error:', err);
});

// Initialize the Express app
const app = express();

// Use Express built-in body parser
app.use(express.json());
app.use(cors());

// Define the GET endpoint for / route
router.get('/', (req, res) => {
  res.send('Hello World!');
});

// Define the GET endpoint for fetching classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find({});
    res.json(classes);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post('/login', async (req, res) => {
  try {
    await mongoose.createConnection(generate_db_url(req.body.username, req.body.password)).asPromise()
    const hash = await auth.hash(req.body.username, req.body.password, 1)
    res.status(200).json(hash)
  } catch (error) {
    res.status(401).json(false)
  }
})

// Define the POST endpoint for creating a new class
router.post('/classes', async (req, res) => {
  if (!auth.authenticate(req.body.key)) {
    return res.status(401).json("forbidden")
  }
  try {
    const newClass = new Class(req.body);
    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Global error handler for catching async errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// hook up router
app.use(API_BASE, router)

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});
