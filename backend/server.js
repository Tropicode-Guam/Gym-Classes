// Import necessary libraries
require('dotenv').config({ path: '../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const router = express.Router()
const auth = require('./utils/auth')
const app = express();
const Class = require('./models/Class'); // Ensure you have created the Class model

const MONGO_URI = process.env['MONGO_URI']

// console.log(MONGO_URI)

// For MongoDB connection
mongoose.connect(MONGO_URI).then(() => console.log('MongoDB connected successfully.'))
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
);

// Use Express built-in body parser
app.use(express.json());
app.use(cors());
app.use('/api', router)

// ROUTES
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
    await mongoose.createConnection(MONGO_URI).asPromise()
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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});