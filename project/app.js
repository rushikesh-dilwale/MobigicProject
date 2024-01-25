const express=require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors'); // Add cors middleware
const User = require('./models/user');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(cors({ origin: 'http://localhost:3002', credentials: true }));

// Set up Multer for file upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueCode = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit code
    cb(null, `${uniqueCode}_${file.originalname}`);
    console.log(uniqueCode);
  },
});



const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));

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
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
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

  if (!userId) {
    return res.status(401).send('Unauthorized. Please log in.');
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).send('Unauthorized. Please log in.');
    }

    user.files.push(req.file.filename);
    await user.save();
    res.header('Access-Control-Allow-Credentials', true);
    res.status(201).send('File uploaded successfully.');
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file.');
  }
});
app.get('/files', async (req, res) => {
  const userId = req.session.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).send('Unauthorized. Please log in.');
    }

    res.json({ files: user.files });
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).send('Error getting files.');
  }
});


app.get('/download/:code', async (req, res) => {
  const code = req.params.code;

  if (!code) {
    return res.status(401).send('Unauthorized.');
  }

  try {
    // Logic to retrieve file information based on the 6-digit code
    const fileInfo = await getFileInfoByCode(code);

    if (!fileInfo) {
      return res.status(404).send('File not found.');
    }

    // Logic to send the file
    res.download(fileInfo.filePath, fileInfo.filename);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Error downloading file.');
  }
});

const getFileInfoByCode = async (code) => {
  try {
    const user = await User.findOne({ files: { $regex: new RegExp(`^${code}_`, 'i') } });

    if (user && user.files.length > 0) {
      const filename = user.files.find(file => file.startsWith(`${code}_`));
      const filePath = path.join(__dirname, 'uploads', filename);

      return { filename, filePath };
    }

    return null;
  } catch (error) {
    console.error('Error retrieving file information:', error);
    return null;
  }
};


app.post('/delete-multiple', async (req, res) => {
  const userId = req.session.userId;
  const { files } = req.body;

  if (!userId || !files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).send('Invalid request. Please provide a valid array of files to delete.');
  }

  try {
    console.log('Received Delete Request - User ID:', userId, 'Files to Delete:', files);

    const user = await User.findById(userId);

    // Filter files that exist in the user's files array
    const filesToDelete = user.files.filter(file => files.includes(file));

    // Delete files from the 'uploads' directory and remove them from the user's files array
    await Promise.all(filesToDelete.map(async (filename) => {
      const filePath = path.join(__dirname, 'uploads', filename);

      // Use try-catch to handle errors during file deletion
      try {
        await fs.promises.unlink(filePath);
        console.log(`File deleted: ${filename}`);
      } catch (unlinkError) {
        console.error(`Error deleting file "${filename}":`, unlinkError);
        // Continue with the next file even if one fails
      }
    }));

    // Update the user's files array
    user.files = user.files.filter(file => !filesToDelete.includes(file));
    await user.save();

    res.status(200).send('Files deleted successfully.');
  } catch (error) {
    console.error('Error deleting files:', error);
    res.status(500).send('Error deleting files.');
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