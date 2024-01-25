// app.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const User = require('./models/user');
// const User = require('./models/user');

const app = express();
const PORT = process.env.PORT || 3001;


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

// Set up MongoDB connection


// Set up Multer for file upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    cb(null, `${uniqueCode}_${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send('User registered successfully.');
  } catch (error) {
    res.status(500).send('Error registering user.');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user._id;
      res.status(200).send('Login successful.');
    } else {
      res.status(401).send('Invalid credentials.');
    }
  } catch (error) {
    res.status(500).send('Error logging in.');
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const userId = req.session.userId;
  const file = req.file;

  if (!userId || !file) {
    return res.status(401).send('Unauthorized.');
  }

  try {
    const user = await User.findById(userId);
    user.files.push(file.filename);
    await user.save();
    res.status(201).send('File uploaded successfully.');
  } catch (error) {
    res.status(500).send('Error uploading file.');
  }
});



mongoose.connect('mongodb+srv://rushikesh:rushikesh@cluster0.zvf2gw3.mongodb.net/your-database-name', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected successfully');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

