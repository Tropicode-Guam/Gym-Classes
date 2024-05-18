const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const mongoose = require('mongoose');
const cors = require('cors');
const csv = require('express-csv');
const router = express.Router();
const auth = require('./utils/auth');
const sharp = require('sharp');
const multer = require('multer');

const API_BASE = process.env['API_BASE'];

// Import your models
const Class = require('./models/Class');
const User = require('./models/User');
const SignUp = require('./models/SignUp');

// Load environment variables
require('dotenv').config();

const isThisAClassDay = (d, classItem) => {
  const { date, frequency, days } = classItem;
  const start = new Date(date);
  const current = new Date(d);

  start.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  if (current < start) {
      return false;
  }

  const diffTime = current - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  switch (frequency) {
      case 'none':
          return current.getTime() === start.getTime();
      case 'daily':
          return true;
      case 'weekly':
          return days.includes(current.getDay());
      case 'bi-weekly':
          return diffDays % 14 < 7 && days.includes(current.getDay());
      case 'monthly':
          return start.getDate() === current.getDate();
      default:
          return false;
  }
};

// Retrieve DB_URL from environment variables
function generate_db_url(username, password) {
  return `mongodb://${username}:${password}@${process.env.DB_HOST}/${process.env.DB_NAME}`;
}
const DB_URL = generate_db_url(process.env.DB_USER, process.env.DB_PASSWORD);

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
    console.error('Error fetching classes:', error);
    res.status(500).send(error.message);
  }
});

// Define the GET endpoint for fetching users signed up for a class
router.get('/classes/:classId/users', async (req, res) => {
  try {
    const classId = req.params.classId;
    const classObj = await Class.findById(classId);

    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const signups = await SignUp.find({ selectedClass: classId });
    res.json(signups);
  } catch (error) {
    console.error('Error fetching users for class:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define the GET endpoint for fetching users signed up for a class
router.get('/classes/:classId/users/date/:date', async (req, res) => {
  try {
    const { classId, date } = req.params;
    const classObj = await Class.findById(classId);

    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // don't need to check if target date is a class date since class may have been edited

    const signups = await SignUp.find({ 
      selectedClass: classId,
      selectedDate: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      }
    });

    res.json(signups);
  } catch (error) {
    console.error('Error fetching users for class on specific date:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})


// Define the DELETE endpoint for deleting a class
router.delete('/classes/:classId', async (req, res) => {
  try {
    const classId = req.params.classId;
    const classObj = await Class.findById(classId);

    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }

    await Class.findByIdAndDelete(classId);
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/images/:classid', async (req, res) => {
  const oid = new ObjectId(req.params.classid);
  const classObj = (await Class.find({ _id: oid }))[0];
  if (!classObj) {
    res.status(404).end();
    return;
  }
  let img;
  try {
    img = Buffer.from(classObj.image, 'base64');
  } catch {
    res.status(404).end();
    return;
  }
  res.set("Content-Type", classObj.imageType);
  res.send(img).end();
});

router.post('/login', async (req, res) => {
  try {
    await mongoose.createConnection(generate_db_url(req.body.username, req.body.password)).asPromise();
    const hash = await auth.hash(req.body.username, req.body.password, 1);
    res.status(200).json(hash);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(401).json(false);
  }
});

const upload = multer({
  limits: {
    fileSize: 10000000 // Limit the file size (e.g., 10MB)
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image (jpg, jpeg, png).'));
    }
    cb(undefined, true);
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, phone, insurance, selectedDate, selectedClass } = req.body;
    const classObj = await Class.findById(selectedClass);

    // check class and date to ensure they're valid
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const targetDate = new Date(selectedDate);
    if (isNaN(targetDate)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (!isThisAClassDay(selectedDate, classObj)) {
      return res.status(400).json({ error: 'Date isn\'t a class date' });
    }

    const signups = await SignUp.find({ 
      selectedClass,
      selectedDate: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      }
    });

    if (signups.length >= classObj.size) {
      return res.status(400).json({ error: 'Class is full' });
    }

    const signupData = { name, phone, insurance, selectedDate, selectedClass };
    const signup = new SignUp(signupData);
    await signup.save();
    res.status(201).json({ message: 'User signed up successfully!', signupData });
  } catch (error) {
    console.error('Error signing up:', error.message);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

router.post('/classes', upload.single('image'), async (req, res) => {
  try {
    // Check if the key is valid
    if (!auth.authenticate(req.body.key)) {
      return res.status(401).json("forbidden");
    }

    // Log the request body and file information for debugging
    console.log('Request Body:', req.body);
    console.log('Uploaded File:', req.file);

    let temp = req.body;
    let days = temp['days'] ? JSON.parse(temp['days']) : [];
    temp['days'] = days;

    const newClass = new Class({
      ...temp,
      image: req.file.buffer, // Storing the image buffer in the Class model
      imageType: req.file.mimetype
    });

    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (error) {
    console.error('Error creating class:', error); // Log the error for debugging
    res.status(500).send(error.message);
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).send(err.message);
  }
  if (err) {
    console.error(err.stack);
    return res.status(500).send('Something broke!');
  }
  next();
});

router.get('/signups', async (req, res) => {
  try {
    const signups = await SignUp.find({});
    const csvData = [
      ['Name', 'Phone', 'Insurance', 'Selected Date', 'Selected Class'],
      ...signups.map(signup => [
        signup.name,
        signup.phone,
        signup.insurance,
        signup.selectedDate,
        signup.selectedClass
      ])
    ];
    res.csv(csvData);
  } catch (error) {
    console.error('Error fetching signups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use(API_BASE, router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
