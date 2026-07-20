const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');
const https = require('https');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from React build directory
app.use(express.static(path.join(__dirname, '../client/build')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wallpaperdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to download external image URL locally
const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {});
          reject(err);
        });
      } else {
        reject(new Error(`Failed to download image. Status code: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Helper to save binary buffer locally
const saveHuggingFaceImage = async (buffer, filepath) => {
  await fs.promises.writeFile(filepath, buffer);
};

// Helper: Call Hugging Face API with retries and model fallbacks
async function callHuggingFaceWithRetry(prompt, hfToken, retries = 3) {
  const models = [
    'black-forest-labs/FLUX.1-schnell',
    'stabilityai/stable-diffusion-xl-base-1.0',
    'stabilityai/stable-diffusion-3-medium-diffusers'
  ];
  
  for (const model of models) {
    let attempt = 0;
    while (attempt < retries) {
      console.log(`Generating with HF model: ${model} (attempt ${attempt + 1}/${retries})...`);
      try {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${hfToken}`,
            },
            body: JSON.stringify({ inputs: prompt }),
          }
        );
        
        if (response.status === 200) {
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
        
        if (response.status === 503) {
          const errJson = await response.json().catch(() => ({}));
          const delay = (errJson.estimated_time || 5) * 1000;
          console.log(`Model is loading. Waiting for ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 10000)));
          attempt++;
          continue;
        }
        
        const errText = await response.text().catch(() => 'Unknown error');
        console.error(`HF error status: ${response.status}. Details: ${errText}`);
        break; 
      } catch (err) {
        console.error(`HF fetch failed for ${model}:`, err);
        break; 
      }
    }
  }
  throw new Error('All Hugging Face models failed to generate an image.');
}

const Wallpaper = require('./models/Wallpaper');
const User = require('./models/User');

const jwtSecret = process.env.JWT_SECRET || 'secret123';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Routes
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });
    await user.save();

    res.json({ message: 'Signup successful. Please sign in.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, jwtSecret, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-wallpaper', authenticate, async (req, res) => {
  const { prompt, model } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  const requestedModel = model === 'dalle3' ? 'dalle3' : 'flux';
  let actualModelUsed = requestedModel;
  let savedFilename = `wallpaper-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;
  const localPath = path.join(uploadsDir, savedFilename);

  // 1. Try DALL-E 3 if requested
  if (requestedModel === 'dalle3') {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is missing. Falling back to FLUX.');
      actualModelUsed = 'flux';
    } else {
      try {
        console.log(`Generating with OpenAI DALL-E 3: "${prompt}"`);
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt.trim(),
          n: 1,
          size: '1024x1024',
        });

        const imageUrl = response?.data?.[0]?.url;
        if (!imageUrl) {
          throw new Error('OpenAI returned empty image URL.');
        }

        console.log(`OpenAI generated successfully. Downloading to local path: ${localPath}`);
        await downloadImage(imageUrl, localPath);
      } catch (error) {
        console.error('OpenAI generation failed, falling back to FLUX:', error.message);
        actualModelUsed = 'flux';
      }
    }
  }

  // 2. Try FLUX if requested or as a fallback
  if (actualModelUsed === 'flux') {
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      return res.status(500).json({
        error: 'Hugging Face Token (HF_TOKEN) is missing in server environment. Please configure it.',
      });
    }

    try {
      console.log(`Generating with Hugging Face FLUX: "${prompt}"`);
      const hfBuffer = await callHuggingFaceWithRetry(prompt.trim(), hfToken);
      console.log(`Hugging Face generated successfully. Saving to local path: ${localPath}`);
      await saveHuggingFaceImage(hfBuffer, localPath);
    } catch (error) {
      console.error('Hugging Face generation failed:', error);
      return res.status(500).json({
        error: `Failed to generate image. Details: ${error.message}`,
      });
    }
  }

  try {
    const relativeUrl = `/uploads/${savedFilename}`;
    const wallpaper = new Wallpaper({ prompt: prompt.trim(), imageUrl: relativeUrl });
    await wallpaper.save();

    res.json({
      imageUrl: relativeUrl,
      prompt: prompt.trim(),
      modelUsed: actualModelUsed,
      fallback: actualModelUsed !== requestedModel,
    });
  } catch (dbError) {
    console.error('Saving wallpaper to database failed:', dbError);
    res.status(500).json({ error: 'Failed to save wallpaper details to database.' });
  }
});

app.get('/api/wallpapers', async (req, res) => {
  try {
    const wallpapers = await Wallpaper.find().sort({ createdAt: -1 });
    res.json(wallpapers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));