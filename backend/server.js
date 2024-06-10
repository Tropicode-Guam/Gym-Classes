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
const ClassOrder = require('./models/ClassOrder');

// Load environment variables
require('dotenv').config();

const isThisAClassDay = (d, classItem) => {
  const { startDate, frequency, days } = classItem;
  const start = new Date(startDate);
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

router.get('/classorder', async (req, res) => {
  try {
    let classOrder = await ClassOrder.findOne();
    if (!classOrder) {
      classOrder = {ids: (await Class.find({}).select('_id').sort({createdAt:-1})).map((item) => item._id)};
      await ClassOrder.create(classOrder);
    }
    res.json(classOrder.ids);
  } catch (error) {
    console.error('Error fetching class order:', error);
    res.status(500).send(error.message);
  }
})

router.put('/classorder', async (req, res) => {
  try {
    if (!auth.authenticate(req.body.key)) {
      return res.status(401).json("forbidden");
    }
    const classOrder = req.body.ids;
    const orderMap = {}
    classOrder.forEach((id) => {
      orderMap[id] = true
    })
    const allClasses = await getOrderedClasses({});
    const newOrder = []
    let i = 0
    allClasses.forEach((classItem) => {
      if (orderMap[classItem._id]) {
        newOrder.push(classOrder[i])
        i++
      } else {
        newOrder.push(classItem._id)
      }
    })
    const result = await ClassOrder.findOneAndUpdate({}, {ids: newOrder}, {new: true});
    res.json(result.ids);
  } catch (error) {
    console.error('Error creating class order:', error);
    res.status(500).send(error.message);
  }
})

const getOrderedClasses = async (query) => {
  const classes = await Class.find(query).select('-image');
  const classOrder = (await ClassOrder.findOne()) || {ids: []};
  const classMap = {};
  for (const classItem of classes) {
    classMap[classItem._id] = classItem;
  }
  return classOrder.ids.filter(id => classMap[id]).map(id => classMap[id]);
}

// Define the GET endpoint for fetching classes
router.get('/classes', async (req, res) => {
  try {
    const yesterday = new Date()
    yesterday.setHours(0,0,0,0)
    yesterday.setDate(yesterday.getDate() - 1)
    let query = {$or: [
                  {endDate: {$gte: yesterday}}, 
                  {endDate: {$exists: false}}, 
                  {endDate: null}
                ]}
    if (req.query.all != null) {
      query = {}
    }

    res.json(await getOrderedClasses(query));
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

    // remove class from classorder
    const order = await ClassOrder.findOne();
    if (order && order.ids.includes(classId)) {
      order.ids.splice(order.ids.indexOf(classId), 1);
      await ClassOrder.findOneAndUpdate({}, order);
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

const withinDaysBeforeClass = (classItem, date) => {
  if (!classItem.daysPriorCanSignUp) {
      return true
  }
  const today = new Date()
  today.setHours(0,0,0,0)
  const current = new Date(date)
  const diff = current - today
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return days <= classItem.daysPriorCanSignUp
}

function validateClass(opts) {
  if (!isThisAClassDay(new Date(opts.startDate), opts)) {
    return { num: 400, error: 'Start date isn\'t a class date' };
  }

  if (opts.endDate && !isThisAClassDay(new Date(opts.endDate), opts)) {
    return { num: 400, error: 'End date isn\'t a class date' };
  }

  if (opts.endDate && new Date(opts.startDate) > new Date(opts.endDate)) {
    return { num: 400, error: 'Start date must be before end date' };
  }

  if (new Date(opts.startDate) >= new Date(opts.endTime)) {
    return { num: 400, error: 'Start date must be before end time' };
  }

  return { num: 200, error: null };
}

router.post('/signup', async (req, res) => {
  try {
    const { name, phone, gymMembership, insurance, insuranceMemberId, selectedDate, selectedClass } = req.body;
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

    if (!withinDaysBeforeClass(classObj, selectedDate)) {
      return res.status(400).json({error: `This class doesn't accept signups more than ${classObj.daysPriorCanSignUp} days in advance`})
    }

    if (insurance !== 'Other/None' && !insuranceMemberId) {
      return res.status(400).json({error: `a member id is required for ${insurance}`})
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

    const signupData = { name, phone, gymMembership, insurance, insuranceMemberId, selectedDate, selectedClass };
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
    if (!auth.authenticate(req.body.key)) {
      return res.status(401).json("forbidden");
    }

    const opts = {
      title: req.body.title,
      description: req.body.description,
      sponsor: req.body.sponsor || null,
      trainer: req.body.trainer || null,
      startDate: req.body.startDate,
      endTime: req.body.endTime,
      endDate: req.body.endDate,
      size: req.body.size,
      fee: req.body.fee,
      image: req.file ? req.file.buffer : undefined,
      imageType: req.file ? req.file.mimetype : undefined,
      imageVersion: req.file ? req.imageVersion : undefined,
      daysPriorCanSignUp: req.body.daysPriorCanSignUp,
      days: JSON.parse(req.body.days),
      color: req.body.color,
      frequency: req.body.frequency,
    }

    const { num, error } = validateClass(opts)
    if (error) {
      return res.status(num).json({ error });
    }

    const newClass = new Class(opts);

    const savedClass = await newClass.save();

    // place new class at beginning of class order
    const order = await ClassOrder.findOne();
    if (order) {
      order.ids.unshift(savedClass._id);
      await order.save();
    } else {
      await ClassOrder.create({ids: [savedClass._id]});
    }

    res.status(201).json(savedClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).send(error.message);
  }
});

router.put('/classes/:id', upload.single('image'), async (req, res) => {
  try {
    if (!auth.authenticate(req.body.key)) {
      return res.status(401).json("forbidden");
    }
    const opts = {
      title: req.body.title,
      description: req.body.description,
      sponsor: req.body.sponsor || null,
      trainer: req.body.trainer || null,
      startDate: req.body.startDate,
      endTime: req.body.endTime,
      endDate: req.body.endDate,
      size: req.body.size,
      fee: req.body.fee,
      daysPriorCanSignUp: req.body.daysPriorCanSignUp,
      days: JSON.parse(req.body.days),
      color: req.body.color,
      frequency: req.body.frequency,
    }
    if (req.file) { 
      opts.image = req.file.buffer 
      opts.imageType = req.file.mimetype
      opts.imageVersion = req.body.imageVersion
    }

    const { num, error } = validateClass(opts)
    if (error) {
      return res.status(num).json({ error });
    }
    
    const updatedClass = await Class.findByIdAndUpdate(req.params.id, opts, { new: true });
    res.status(200).json(updatedClass);
    
  } catch (error) {
    console.error('Error updating class:', error);
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
    const classes = await Class.find({});
    classesMap = {}
    classes.forEach(classItem => {
      classesMap[classItem._id] = classItem;
    });

    let all = req.query.all || req.query.all === ''
    let filter = all ? {} : {
      selectedClass: {
        $in: Object.keys(classesMap)
      }
    }
    const signups = await SignUp.find(filter).sort({ selectedDate: -1 });
    const csvData = [
      ['Name', 'Phone', 'Gym Membership', 'Insurance', 'Insurance Member ID', 'Selected Date', 'Selected Class'],
      ...signups.map(signup => [
        signup.name,
        signup.phone,
        signup.gymMembership,
        signup.insurance,
        signup.insuranceMemberId,
        signup.selectedDate.toLocaleDateString(),
        classesMap[signup.selectedClass] && classesMap[signup.selectedClass].title || 'Deleted Class'
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
