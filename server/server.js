const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads folder statically
app.use('/uploads', express.static(uploadsDir));

// Serve static files from React build directory
app.use(express.static(path.join(__dirname, '../client/build')));

// Connect to MongoDB
let isDbConnected = false;
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wallpaperdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    isDbConnected = true;
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    isDbConnected = false;
    console.warn('MongoDB connection warning:', err.message);
  });

mongoose.connection.on('connected', () => { isDbConnected = true; });
mongoose.connection.on('disconnected', () => { isDbConnected = false; });

const Wallpaper = require('./models/Wallpaper');
const User = require('./models/User');

const jwtSecret = process.env.JWT_SECRET || 'secret123';

// Setup OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-none',
});

// Middleware: Optional Authentication (allows guests to use the generator while identifying signed-in users)
const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
  } catch (error) {
    req.user = null;
  }
  next();
};

// Middleware: Required Authentication for protected user actions
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

// Helper: Download image buffer from any URL with retry and backoff on 429/503
async function fetchImageBuffer(url, timeoutMs = 35000, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
        const delay = (attempt + 1) * 2500;
        console.warn(`[DreamWall] Server rate limited (${response.status}). Pausing ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch image. HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      if (attempt < maxRetries && (err.message.includes('429') || err.name === 'TimeoutError')) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      throw err;
    }
  }
}

// Map aspect ratio string to width/height dimensions
function getDimensions(aspectRatio) {
  switch (aspectRatio) {
    case '16:9': // Desktop / Landscape Wallpaper
      return { width: 1280, height: 720 };
    case '9:16': // Mobile / Portrait Phone Wallpaper
      return { width: 720, height: 1280 };
    case '21:9': // Ultrawide Monitor Wallpaper
      return { width: 1344, height: 576 };
    case '1:1': // Square / Tablet Wallpaper
    default:
      return { width: 1024, height: 1024 };
  }
}

// Map requested model to Pollinations model name
function mapPollinationsModel(model) {
  switch (model) {
    case 'turbo':
      return 'turbo';
    case 'anime':
    case 'flux-anime':
      return 'flux-anime';
    case '3d':
    case 'flux-3d':
      return 'flux-3d';
    case 'realism':
    case 'flux-realism':
      return 'flux-realism';
    case 'flux':
    default:
      return 'flux';
  }
}

// Core Generative AI Engine with multi-tier failover
async function generateWallpaperImage(prompt, model, aspectRatio) {
  const { width, height } = getDimensions(aspectRatio);
  const seed = Math.floor(Math.random() * 10000000);
  let actualModelUsed = model;
  let fallbackOccurred = false;

  // 1. Attempt OpenAI DALL-E 3 if requested
  if (model === 'dalle3') {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      try {
        console.log(`[DreamWall] Generating with OpenAI DALL-E 3: "${prompt.substring(0, 40)}..."`);
        const dalleSize = aspectRatio === '9:16' ? '1024x1792' : (aspectRatio === '16:9' ? '1792x1024' : '1024x1024');
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt.trim(),
          n: 1,
          size: dalleSize,
        });
        const dalleUrl = response?.data?.[0]?.url;
        if (dalleUrl) {
          const buffer = await fetchImageBuffer(dalleUrl);
          return { buffer, actualModelUsed: 'dalle3', fallbackOccurred: false };
        }
      } catch (dalleErr) {
        console.warn(`[DreamWall] OpenAI generation failed (${dalleErr.message}), switching to FLUX fallback.`);
        fallbackOccurred = true;
      }
    } else {
      console.log('[DreamWall] OpenAI key not configured or invalid, using FLUX.');
      fallbackOccurred = true;
    }
  }

  // 2. Attempt Hugging Face if explicitly requested
  if (model === 'huggingface') {
    const rawHf = (process.env.HF_TOKEN || '').trim();
    if (rawHf) {
      try {
        console.log(`[DreamWall] Generating with Hugging Face Router: "${prompt.substring(0, 40)}..."`);
        const hfRes = await fetch(
          'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${rawHf}`,
            },
            body: JSON.stringify({ inputs: prompt.trim() }),
            signal: AbortSignal.timeout(15000),
          }
        );
        if (hfRes.ok) {
          const arrayBuffer = await hfRes.arrayBuffer();
          return { buffer: Buffer.from(arrayBuffer), actualModelUsed: 'huggingface', fallbackOccurred: false };
        }
      } catch (hfErr) {
        console.warn(`[DreamWall] Hugging Face failed (${hfErr.message}), switching to FLUX fallback.`);
        fallbackOccurred = true;
      }
    }
  }

  // 3. Primary / Fallback Engine: Pollinations AI (FLUX, Turbo, Anime, 3D, Realism)
  const polModel = mapPollinationsModel(model);
  actualModelUsed = polModel;

  const encodedPrompt = encodeURIComponent(prompt.trim());
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${polModel}&width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

  console.log(`[DreamWall] Generating with Pollinations (${polModel}, ${width}x${height}): "${prompt.substring(0, 40)}..."`);
  try {
    const buffer = await fetchImageBuffer(pollinationsUrl, 35000);
    return { buffer, actualModelUsed, fallbackOccurred };
  } catch (primaryErr) {
    console.warn(`[DreamWall] Primary model ${polModel} failed: ${primaryErr.message}. Retrying with Turbo...`);
    // Rapid secondary fallback with turbo model
    const turboUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=turbo&width=1024&height=576&seed=${seed}&nologo=true`;
    const buffer = await fetchImageBuffer(turboUrl, 25000);
    return { buffer, actualModelUsed: 'turbo', fallbackOccurred: true };
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isDbConnected ? 'connected' : 'offline',
    timestamp: new Date().toISOString(),
    engines: ['flux', 'turbo', 'anime', '3d', 'realism', 'dalle3'],
  });
});

// User Sign Up
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (!isDbConnected) {
      return res.status(503).json({ error: 'Database is currently offline. Please try again in a few moments.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });
    await user.save();

    res.json({ message: 'Signup successful. Please sign in.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Sign In
app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!isDbConnected) {
      return res.status(503).json({ error: 'Database is currently offline. Please try again shortly.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generative Wallpaper Creation (Open to all visitors via optionalAuthenticate)
app.post('/api/generate-wallpaper', optionalAuthenticate, async (req, res) => {
  const { prompt, model = 'flux', aspectRatio = '16:9' } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'A descriptive wallpaper prompt is required.' });
  }

  const cleanPrompt = prompt.trim();
  const validAspectRatio = ['16:9', '9:16', '1:1', '21:9'].includes(aspectRatio) ? aspectRatio : '16:9';

  try {
    // Generate the image buffer
    const { buffer, actualModelUsed, fallbackOccurred } = await generateWallpaperImage(
      cleanPrompt,
      model,
      validAspectRatio
    );

    // Save locally to uploads directory
    const filename = `wallpaper-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
    const localPath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(localPath, buffer);

    const relativeUrl = `/uploads/${filename}`;
    let savedWallpaper = null;

    // Save record to MongoDB if available
    if (isDbConnected) {
      try {
        const wallpaperDoc = new Wallpaper({
          prompt: cleanPrompt,
          imageUrl: relativeUrl,
          modelUsed: actualModelUsed,
          aspectRatio: validAspectRatio,
          userId: req.user?.userId || null,
          userName: req.user?.name || (req.user?.email ? req.user.email.split('@')[0] : 'Guest Creator'),
        });
        savedWallpaper = await wallpaperDoc.save();
      } catch (dbErr) {
        console.warn('Could not persist wallpaper to database:', dbErr.message);
      }
    }

    res.json({
      success: true,
      imageUrl: relativeUrl,
      prompt: cleanPrompt,
      modelUsed: actualModelUsed,
      aspectRatio: validAspectRatio,
      fallback: fallbackOccurred,
      id: savedWallpaper?._id || `local-${Date.now()}`,
      userName: req.user?.name || 'Guest Creator',
    });
  } catch (error) {
    console.error('Generation failure:', error);
    res.status(500).json({
      error: `Wallpaper generation could not be completed: ${error.message}. Please try again with a different prompt.`,
    });
  }
});

// Retrieve Wallpapers Gallery
app.get('/api/wallpapers', async (req, res) => {
  try {
    if (isDbConnected) {
      const wallpapers = await Wallpaper.find().sort({ createdAt: -1 }).limit(60);
      return res.json(wallpapers);
    }

    // Fallback: If DB is offline, read generated images directly from uploads directory
    const files = await fs.promises.readdir(uploadsDir);
    const imageFiles = files.filter((f) => f.startsWith('wallpaper-') && (f.endsWith('.jpg') || f.endsWith('.png')));
    const memoryWallpapers = imageFiles.slice(-20).reverse().map((file, idx) => ({
      _id: `file-${idx}`,
      prompt: 'Generated Wallpaper Design',
      imageUrl: `/uploads/${file}`,
      modelUsed: 'flux',
      aspectRatio: '16:9',
      createdAt: new Date(),
    }));

    res.json(memoryWallpapers);
  } catch (error) {
    console.error('Fetch wallpapers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a Wallpaper (Optional feature for clean gallery management)
app.delete('/api/wallpapers/:id', optionalAuthenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected && id && !id.startsWith('file-')) {
      const wallpaper = await Wallpaper.findById(id);
      if (wallpaper) {
        const filePath = path.join(__dirname, wallpaper.imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, () => {});
        }
        await Wallpaper.findByIdAndDelete(id);
      }
    }
    res.json({ message: 'Wallpaper removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all handler for client-side React routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../client/build/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('DreamWall API is active. Please run the React client on port 3000 or build the client.');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`DreamWall Server running on http://localhost:${PORT}`));