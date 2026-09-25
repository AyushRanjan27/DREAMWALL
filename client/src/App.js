import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './AppDesign.css';

const API_BASE_URL = window.location.port === '3000' ? 'http://localhost:5000' : '';

function App() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [view, setView] = useState('home'); // 'home' | 'gallery' | 'profile' | 'settings' | 'signin' | 'signup'
  const [wallpapers, setWallpapers] = useState([]);
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryFilter, setGalleryFilter] = useState('All');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [authFields, setAuthFields] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [profileDetails, setProfileDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
  });
  const [settings, setSettings] = useState({
    email: '',
    emailVerified: false,
    emailCode: '',
    emailCodeSent: false,
    phone: '',
    phoneVerified: false,
    phoneCode: '',
    phoneCodeSent: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [model, setModel] = useState('flux'); // 'flux' | 'turbo' | 'anime' | '3d' | 'realism' | 'dalle3'
  const [aspectRatio, setAspectRatio] = useState('16:9'); // '16:9' | '9:16' | '1:1' | '21:9'
  const [activeCategory, setActiveCategory] = useState('🌌 Sci-Fi');
  const [generationInfo, setGenerationInfo] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [lightboxItem, setLightboxItem] = useState(null); // wallpaper object or null

  const loadingMessages = [
    'Synthesizing prompt vision...',
    'Sculpting 3D geometry & depth...',
    'Infusing atmospheric volumetric light...',
    'Rendering ultra-sharp 4K textures...',
    'Applying cinematic color grading...',
    'Finalizing masterpiece wallpaper...'
  ];

  // Cycling loading messages during generation
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading, loadingMessages.length]);

  const categories = {
    '🌌 Sci-Fi': [
      'Neon cyberpunk city in rain with holographic kanji reflections on wet asphalt',
      'Futuristic metropolis with flying vehicles traversing colossal neon skyscrapers, synthwave',
      'Astronaut in a bioluminescent meadow on an alien exoplanet under a ringed gas giant',
      'Spaceship cockpit traveling through a hyper-speed cosmic warp wormhole, vibrant light streaks'
    ],
    '🎌 Anime': [
      'Tranquil cherry blossom shrine at golden sunset, soft warm sunlight, Makoto Shinkai aesthetic',
      'Cozy anime loft bedroom with a large rain-streaked window showing neon Tokyo night, lo-fi vibe',
      'Floating celestial island with a massive ancient spirit tree, Studio Ghibli hand-painted style',
      'Cyberpunk anime street samurai standing in the misty rain, glowing katana reflections'
    ],
    '🍃 Nature': [
      'Serene Alpine mountain peak rising above a sea of golden dawn clouds, 8k landscape photography',
      'Majestic emerald waterfall cascading into a crystal lagoon surrounded by tropical flora',
      'Ethereal misty autumnal forest with golden godrays piercing through towering pine trees',
      'Bioluminescent ocean waves crashing on black volcanic sand under a starlit Milky Way'
    ],
    '🪐 Space': [
      'Vibrant cosmic nebula with swirling violet and turquoise stellar dust clouds and radiant stars',
      'Solar eclipse seen from the surface of a frozen moon with aurora borealis ribbons',
      'Interstellar wormhole bending distant galaxies with gravitational lensing, deep space photography',
      'Cosmic crystal asteroid field reflecting radiant light from a dying supernova'
    ],
    '🎨 3D & Abstract': [
      'Liquid molten gold and obsidian marble swirling dynamically, Octane render, luxury aesthetic',
      'Floating glassmorphic geometric shards with iridescent rainbow refraction, clean studio render',
      'Vaporwave digital wireframe grid landscape with an 80s retro sunset and chrome typography',
      'Surreal architectural stairway ascending into cotton candy clouds, dreamcore aesthetic'
    ],
    '🏰 Fantasy': [
      'Gothic wizard fortress perched on a misty sea cliff, thunderstorm with purple lightning',
      'Enchanted fairy glade with giant glowing mushrooms and floating golden orbs of light',
      'Dragon soaring over snow-capped mountains bathed in blood-orange sunset rays',
      'Ancient underwater submerged ruins covered in glowing coral and sea turtles'
    ]
  };

  const surprisePrompts = [
    'Futuristic neo-Tokyo alleyway illuminated by lavender neon signs, reflection in rain puddles, cinematic 8k',
    'A solitary lighthouse standing resilient on a rocky cliff under a swirling emerald aurora borealis',
    'Mythical celestial dragon made of stars and stardust weaving through a deep space nebula',
    'Studio Ghibli style cozy cottage in a lush green valley with rolling hills, wildflowers, and fluffy clouds',
    'Cybernetic samurai looking at a sprawling cyberpunk megalopolis skyline from a rooftop at dusk',
    'Abstract fluid rainbow acrylic ripples frozen in mid-motion with subtle golden foil accents, 8k wallpaper',
    'Breathtaking crystalline ice cave with turquoise sunlight filtering through glacial walls',
    'Futuristic solar-powered utopian city with cascading hanging gardens and crystal monorails'
  ];

  const showcaseWallpapers = [
    {
      title: 'Neon Horizon 2099',
      category: 'Sci-Fi / Cyberpunk',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1280&q=80',
      prompt: 'Neon cyberpunk street with holographic advertisements and rain puddles'
    },
    {
      title: 'Alpine Dawn Solitude',
      category: 'Nature & Landscape',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1280&q=80',
      prompt: 'Serene mountain peak above a blanket of clouds at sunrise, golden light'
    },
    {
      title: 'Cosmic Stellar Nebula',
      category: 'Deep Space',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&q=80',
      prompt: 'Vibrant cosmic nebula with swirling stellar dust clouds and radiant stars'
    }
  ];

  const promptEnhancers = {
    cyberpunk: 'highly detailed cyberpunk aesthetic, volumetric neon light reflections, octane 3d render, Unreal Engine 5, 8k resolution wallpaper',
    anime: 'masterpiece anime key visual, Makoto Shinkai and Studio Ghibli style, soft atmospheric lighting, vibrant colors, pristine 8k wallpaper',
    nature: 'National Geographic award-winning photography, volumetric sunlight, 8k resolution, crisp ultra-sharp textures, cinematic wide shot',
    space: 'Hubble and James Webb telescope deep space photography, 8k cosmic clarity, deep celestial colors, volumetric stellar dust',
    art: 'digital art masterpiece, intricate 3D octane render, ray-tracing reflections, hyper-detailed composition, trending on Artstation'
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/uploads')) {
      return `${API_BASE_URL}${url}`;
    }
    return url;
  };

  const createProfileFromData = (data = {}) => {
    const email = data.email || '';
    const username = data.username || (email.split('@')[0] || '').toLowerCase();
    if (data.firstName || data.lastName) {
      return {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email,
        username,
      };
    }
    const parts = (data.name || '').trim().split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      email,
      username: data.username || (email.split('@')[0] || parts[0] || '').toLowerCase(),
    };
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileDetails((prev) => ({ ...prev, [field]: value }));
    setAuthMessage('');
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      setProfilePicture(imageData);
      localStorage.setItem('authPicture', imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const updatedProfile = {
      firstName: profileDetails.firstName,
      lastName: profileDetails.lastName,
      email: profileDetails.email,
      username: profileDetails.username,
    };
    localStorage.setItem('authProfile', JSON.stringify(updatedProfile));
    if (profilePicture) {
      localStorage.setItem('authPicture', profilePicture);
    }
    const displayName = `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim() || updatedProfile.email;
    localStorage.setItem('authName', displayName);
    setUserName(updatedProfile.firstName || updatedProfile.username || displayName);
    setAuthMessage('Profile updated successfully.');
    setView('home');
  };

  const fetchWallpapers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallpapers`);
      setWallpapers(response.data || []);
    } catch (error) {
      console.error('Error fetching wallpapers:', error);
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAuthError('');
    setGenerationInfo(null);
    setCopiedPrompt(false);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/generate-wallpaper`,
        { prompt: prompt.trim(), model, aspectRatio },
        { headers: getAuthHeaders() }
      );

      if (response.data?.imageUrl) {
        setImageUrl(response.data.imageUrl);
        setGenerationInfo({
          modelUsed: response.data.modelUsed,
          aspectRatio: response.data.aspectRatio,
          fallback: response.data.fallback,
        });
        fetchWallpapers();
      }
    } catch (error) {
      console.error('Error generating wallpaper:', error);
      const msg = error.response?.data?.error || error.message || 'Failed to generate wallpaper.';
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSurpriseMe = () => {
    const randomPick = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
    setPrompt(randomPick);
  };

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) return;
    const lowerPrompt = prompt.toLowerCase();
    let enhancer = promptEnhancers.art;

    if (lowerPrompt.includes('cyberpunk') || lowerPrompt.includes('neon') || lowerPrompt.includes('city')) {
      enhancer = promptEnhancers.cyberpunk;
    } else if (lowerPrompt.includes('anime') || lowerPrompt.includes('ghibli') || lowerPrompt.includes('shinkai')) {
      enhancer = promptEnhancers.anime;
    } else if (lowerPrompt.includes('nature') || lowerPrompt.includes('mountain') || lowerPrompt.includes('ocean') || lowerPrompt.includes('forest')) {
      enhancer = promptEnhancers.nature;
    } else if (lowerPrompt.includes('space') || lowerPrompt.includes('galaxy') || lowerPrompt.includes('planet') || lowerPrompt.includes('nebula')) {
      enhancer = promptEnhancers.space;
    }

    setPrompt((prev) => `${prev.trim()}, ${enhancer}`);
  };

  const handleCopyPrompt = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleDownload = async (url, customName) => {
    const fullUrl = getFullImageUrl(url);
    const cleanFilename = customName || `dreamwall-${Date.now()}.jpg`;

    try {
      const res = await fetch(fullUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const link = document.createElement('a');
      link.href = fullUrl;
      link.target = '_blank';
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedName = localStorage.getItem('authName');
    const storedProfile = localStorage.getItem('authProfile');
    const storedPicture = localStorage.getItem('authPicture');
    const storedSettings = localStorage.getItem('authSettings');
    const storedTheme = localStorage.getItem('theme');

    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark');
    }

    // Hide initial loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 300);
    }

    if (token && storedName) {
      setIsAuthenticated(true);
      setUserName(storedName);
      if (storedProfile) {
        setProfileDetails(JSON.parse(storedProfile));
      } else {
        setProfileDetails(createProfileFromData({ name: storedName }));
      }
      if (storedPicture) {
        setProfilePicture(storedPicture);
      }
      if (storedSettings) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(storedSettings) }));
      }
    }

    fetchWallpapers();
  }, [fetchWallpapers]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Auth Handlers
  const handleAuthFieldChange = (field, value) => {
    setAuthFields((prev) => ({ ...prev, [field]: value }));
    setAuthError('');
    setAuthMessage('');
  };

  const handleSignup = async () => {
    const { name, email, password } = authFields;
    if (!name.trim() || !email.trim() || !password.trim()) {
      setAuthError('Name, email, and password are required.');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/signup`, { name, email, password });
      const profileData = createProfileFromData({ name, email });
      setProfileDetails(profileData);
      localStorage.setItem('authProfile', JSON.stringify(profileData));
      setAuthMessage('Account created successfully! Please sign in.');
      setAuthFields({ name: '', email: '', password: '' });
      setView('signin');
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Signup failed.';
      setAuthError(message);
    }
  };

  const handleSignin = async () => {
    const { email, password } = authFields;
    if (!email.trim() || !password.trim()) {
      setAuthError('Email and password are required.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/signin`, { email, password });
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('authName', user.name || email);
      const profileData = createProfileFromData(user || { name: user.name, email });
      localStorage.setItem('authProfile', JSON.stringify(profileData));
      setProfileDetails(profileData);
      setUserName(user.name || email);
      setIsAuthenticated(true);
      setAuthFields({ name: '', email: '', password: '' });
      setAuthError('');
      setAuthMessage(`Welcome back, ${user.name || email}!`);
      setView('home');
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Sign in failed.';
      setAuthError(message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authName');
    setIsAuthenticated(false);
    setUserName('');
    setProfileDropdownOpen(false);
    setView('home');
    setAuthMessage('You have signed out.');
  };

  // Filtered gallery items
  const filteredWallpapers = useMemo(() => {
    return wallpapers.filter((w) => {
      const matchesSearch = !gallerySearch || (w.prompt && w.prompt.toLowerCase().includes(gallerySearch.toLowerCase()));
      const matchesFilter = galleryFilter === 'All' || (w.modelUsed && w.modelUsed.toLowerCase().includes(galleryFilter.toLowerCase())) || (w.aspectRatio && w.aspectRatio === galleryFilter);
      return matchesSearch && matchesFilter;
    });
  }, [wallpapers, gallerySearch, galleryFilter]);

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Site Header */}
      <header className="site-header">
        <div className="brand" onClick={() => setView('home')}>
          <span className="brand-icon">✨</span>
          <span>DreamWall</span>
        </div>

        <nav className="site-nav">
          <button className={view === 'home' ? 'nav-link active' : 'nav-link'} onClick={() => setView('home')}>
            Studio
          </button>
          <button className={view === 'gallery' ? 'nav-link active' : 'nav-link'} onClick={() => setView('gallery')}>
            Gallery {wallpapers.length > 0 && `(${wallpapers.length})`}
          </button>
          
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          {!isAuthenticated ? (
            <>
              <button className={view === 'signin' ? 'nav-link active' : 'nav-link'} onClick={() => setView('signin')}>
                Sign In
              </button>
              <button className={view === 'signup' ? 'nav-link active' : 'nav-link'} onClick={() => setView('signup')}>
                Sign Up
              </button>
            </>
          ) : (
            <div className="profile-container">
              <button
                className="profile-avatar-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                title="Account Menu"
              >
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" />
                ) : (
                  (userName || 'U').charAt(0).toUpperCase()
                )}
              </button>

              <div className={`profile-dropdown ${profileDropdownOpen ? 'open' : ''}`}>
                <div className="profile-dropdown-user-header">
                  <div className="profile-dropdown-name">{userName}</div>
                  <div className="profile-dropdown-email">{profileDetails.email || 'Member'}</div>
                </div>
                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setView('profile');
                    setProfileDropdownOpen(false);
                  }}
                >
                  👤 Profile & Avatar
                </button>
                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setView('settings');
                    setProfileDropdownOpen(false);
                  }}
                >
                  ⚙️ Account Settings
                </button>
                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setView('gallery');
                    setProfileDropdownOpen(false);
                  }}
                >
                  🖼️ Wallpaper Vault
                </button>
                <button className="profile-dropdown-item signout" onClick={handleLogout}>
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Global Toast Message */}
      {authMessage && (
        <div className="home-toast alert success">{authMessage}</div>
      )}

      {/* Main Content Area */}
      <main className="content">
        {/* =========================================================================
            STUDIO / HOME VIEW
           ========================================================================= */}
        {view === 'home' && (
          <>
            {/* Hero Section */}
            <section className="hero-panel">
              <div className="hero-copy">
                <span className="eyebrow">✨ Next-Gen AI Generative Studio</span>
                <h1>
                  Turn any idea into a <span className="gradient-title">4K Wallpaper</span>
                </h1>
                <p>
                  Experience limitless creativity with state-of-the-art AI. Choose your resolution, pick an artistic engine, and watch your imagination materialize in seconds.
                </p>
                <div className="hero-actions">
                  <button className="generate-btn" onClick={() => document.getElementById('prompt-box')?.focus()}>
                    ✨ Start Creating Now
                  </button>
                  <button className="nav-link" onClick={() => setView('gallery')}>
                    Browse Community Gallery →
                  </button>
                </div>
              </div>

              {/* Dynamic Wallpaper Showcase */}
              <div className="hero-preview">
                <div className="showcase-card">
                  <div className="showcase-image-wrapper">
                    <img
                      src={showcaseWallpapers[0].imageUrl}
                      alt={showcaseWallpapers[0].title}
                      className="showcase-image"
                    />
                    <div className="showcase-badge">4K Ultra HD • FLUX.1</div>
                    <div className="showcase-overlay">
                      <div className="showcase-prompt">{showcaseWallpapers[0].prompt}</div>
                      <div className="showcase-tag">{showcaseWallpapers[0].category}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Generative Studio Panel */}
            <section className="generator-panel glass-card">
              <div className="creator-panel">
                <div className="panel-header">
                  <h2>DreamWall Creator Studio</h2>
                  <p>Type your vision below or choose inspiration from curated aesthetic presets.</p>
                </div>

                {authError && <div className="alert error">{authError}</div>}

                {/* Aspect Ratio / Format Selector */}
                <div>
                  <div className="studio-sublabel">📐 1. Choose Wallpaper Format & Ratio</div>
                  <div className="ratio-selector-grid">
                    <button
                      type="button"
                      className={`ratio-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
                      onClick={() => setAspectRatio('16:9')}
                    >
                      <span className="ratio-icon">🖥️</span>
                      <span className="ratio-name">Desktop / PC</span>
                      <span className="ratio-dim">16:9 (1280x720)</span>
                    </button>
                    <button
                      type="button"
                      className={`ratio-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
                      onClick={() => setAspectRatio('9:16')}
                    >
                      <span className="ratio-icon">📱</span>
                      <span className="ratio-name">Phone / Mobile</span>
                      <span className="ratio-dim">9:16 (720x1280)</span>
                    </button>
                    <button
                      type="button"
                      className={`ratio-btn ${aspectRatio === '1:1' ? 'active' : ''}`}
                      onClick={() => setAspectRatio('1:1')}
                    >
                      <span className="ratio-icon">🖼️</span>
                      <span className="ratio-name">Square / Tablet</span>
                      <span className="ratio-dim">1:1 (1024x1024)</span>
                    </button>
                    <button
                      type="button"
                      className={`ratio-btn ${aspectRatio === '21:9' ? 'active' : ''}`}
                      onClick={() => setAspectRatio('21:9')}
                    >
                      <span className="ratio-icon">🖥️</span>
                      <span className="ratio-name">Ultrawide</span>
                      <span className="ratio-dim">21:9 (1344x576)</span>
                    </button>
                  </div>
                </div>

                {/* AI Engine & Art Style Selector */}
                <div>
                  <div className="studio-sublabel">🎨 2. Select AI Engine & Art Style</div>
                  <div className="engine-selector-grid">
                    <button
                      type="button"
                      className={`engine-btn ${model === 'flux' ? 'active' : ''}`}
                      onClick={() => setModel('flux')}
                    >
                      <span className="engine-icon">⚡</span>
                      <div className="engine-info">
                        <span className="engine-title">FLUX.1 Schnell</span>
                        <span className="engine-desc">Ultra-detail, vibrant & cinematic</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`engine-btn ${model === 'anime' ? 'active' : ''}`}
                      onClick={() => setModel('anime')}
                    >
                      <span className="engine-icon">🎌</span>
                      <div className="engine-info">
                        <span className="engine-title">Anime Studio</span>
                        <span className="engine-desc">Makoto Shinkai & Ghibli aesthetic</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`engine-btn ${model === '3d' ? 'active' : ''}`}
                      onClick={() => setModel('3d')}
                    >
                      <span className="engine-icon">🔮</span>
                      <div className="engine-info">
                        <span className="engine-title">3D & Octane</span>
                        <span className="engine-desc">Unreal Engine 5 volumetric render</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`engine-btn ${model === 'realism' ? 'active' : ''}`}
                      onClick={() => setModel('realism')}
                    >
                      <span className="engine-icon">📸</span>
                      <div className="engine-info">
                        <span className="engine-title">Photorealism</span>
                        <span className="engine-desc">8K National Geographic photography</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`engine-btn ${model === 'turbo' ? 'active' : ''}`}
                      onClick={() => setModel('turbo')}
                    >
                      <span className="engine-icon">🚀</span>
                      <div className="engine-info">
                        <span className="engine-title">Turbo Fast</span>
                        <span className="engine-desc">Instant sub-second wallpaper render</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`engine-btn ${model === 'dalle3' ? 'active' : ''}`}
                      onClick={() => setModel('dalle3')}
                    >
                      <span className="engine-icon">✨</span>
                      <div className="engine-info">
                        <span className="engine-title">DALL-E 3</span>
                        <span className="engine-desc">OpenAI Engine (with auto-fallback)</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Preset Categories & Suggestion Chips */}
                <div>
                  <div className="studio-sublabel">💡 3. Quick Inspiration Chips</div>
                  <div className="category-tabs" style={{ marginBottom: '10px' }}>
                    {Object.keys(categories).map((catName) => (
                      <button
                        key={catName}
                        type="button"
                        className={`category-tab-pill ${activeCategory === catName ? 'active' : ''}`}
                        onClick={() => setActiveCategory(catName)}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>

                  <div className="suggestions-wrap">
                    {categories[activeCategory]?.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="suggestion-chip"
                        onClick={() => setPrompt(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Input Box */}
                <div>
                  <div className="studio-sublabel">✍️ 4. Your Wallpaper Vision</div>
                  <div className="textarea-container">
                    <textarea
                      id="prompt-box"
                      className="prompt-textarea"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your dream wallpaper in rich detail (e.g. Glowing cybernetic sakura tree on a floating crystal island under a starry galaxy, 8k wallpaper)..."
                      rows="4"
                    />
                    <div className="textarea-actions">
                      <button
                        type="button"
                        className="prompt-action-btn"
                        onClick={handleSurpriseMe}
                        title="Pick a random creative prompt"
                      >
                        🎲 Surprise Me
                      </button>
                      {prompt.trim() && (
                        <>
                          <button
                            type="button"
                            className="prompt-action-btn enhance"
                            onClick={handleEnhancePrompt}
                            title="Add photographic lighting and rendering keywords"
                          >
                            🪄 Enhance
                          </button>
                          <button
                            type="button"
                            className="prompt-action-btn"
                            onClick={() => setPrompt('')}
                            title="Clear prompt"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generation Trigger Button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="generate-btn"
                >
                  {loading ? (
                    <>
                      <div className="loader-spinner" style={{ width: '22px', height: '22px', borderWidth: '2px' }} />
                      <span>{loadingMessages[loadingMsgIdx]}</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Generate Wallpaper</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preview Result Panel */}
              <div className="result-panel">
                <div className="result-header">
                  <h3>Masterpiece Preview</h3>
                  {aspectRatio && (
                    <span className="card-badge">{aspectRatio} Format</span>
                  )}
                </div>

                <div
                  className={`result-frame ratio-${aspectRatio.replace(':', '-')}`}
                >
                  {loading ? (
                    <div className="generation-loader">
                      <div className="loader-spinner" />
                      <div className="loader-status-text">{loadingMessages[loadingMsgIdx]}</div>
                      <div className="loader-subtext">Harnessing generative AI model...</div>
                    </div>
                  ) : imageUrl ? (
                    <img
                      src={getFullImageUrl(imageUrl)}
                      alt={prompt || 'Generated Wallpaper'}
                      className="result-image"
                    />
                  ) : (
                    <div className="empty-state">
                      <img
                        src="/images.jpg"
                        alt="Preview Sample"
                      />
                      <div className="placeholder-copy">
                        <h4>Awaiting Your Imagination</h4>
                        <p>Type a prompt and press "Generate Wallpaper" to create your design.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Result Actions */}
                {imageUrl && !loading && (
                  <div className="result-actions">
                    <button
                      type="button"
                      className="download-hd-btn"
                      onClick={() => handleDownload(imageUrl, `dreamwall-${Date.now()}.jpg`)}
                    >
                      ⬇️ Download HD Wallpaper
                    </button>
                    <div className="result-secondary-actions">
                      <button
                        type="button"
                        className="preview-fullscreen-btn"
                        onClick={() =>
                          setLightboxItem({
                            imageUrl,
                            prompt,
                            modelUsed: generationInfo?.modelUsed || model,
                            aspectRatio,
                          })
                        }
                      >
                        🔍 Fullscreen View
                      </button>
                      <button
                        type="button"
                        className="copy-prompt-btn"
                        onClick={() => handleCopyPrompt(prompt)}
                      >
                        📋 {copiedPrompt ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>

                    {generationInfo && (
                      <div className="model-badge">
                        Engine: <strong>{generationInfo.modelUsed.toUpperCase()}</strong> • Aspect Ratio: {generationInfo.aspectRatio}
                        {generationInfo.fallback && (
                          <span className="fallback-tag"> (Smart failover applied)</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Latest Creations Showcase */}
            <section className="latest-creations-panel glass-card">
              <div className="section-header-row">
                <div>
                  <h2>Recent Community Creations</h2>
                  <p>Browse fresh AI wallpapers generated by creators across the world.</p>
                </div>
                <button type="button" className="refresh-btn" onClick={fetchWallpapers}>
                  🔄 Refresh Gallery
                </button>
              </div>

              <div className="wallpaper-grid">
                {wallpapers.slice(0, 8).map((w) => (
                  <div key={w._id || w.id} className="wallpaper-card">
                    <div
                      className="card-image-wrap"
                      onClick={() => setLightboxItem(w)}
                    >
                      <img src={getFullImageUrl(w.imageUrl)} alt={w.prompt} loading="lazy" />
                      <span className="card-badge">{w.aspectRatio || '16:9'}</span>
                      <div className="card-overlay">
                        <button
                          type="button"
                          className="card-overlay-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxItem(w);
                          }}
                        >
                          🔍 Preview
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      <p className="card-prompt" title={w.prompt}>{w.prompt}</p>
                      <div className="card-footer">
                        <span className="card-meta">
                          {w.userName ? `By ${w.userName}` : 'AI Generated'}
                        </span>
                        <button
                          type="button"
                          className="card-download-btn"
                          onClick={() => handleDownload(w.imageUrl, `dreamwall-${w._id || 'recent'}.jpg`)}
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* =========================================================================
            WALLPAPER GALLERY VIEW
           ========================================================================= */}
        {view === 'gallery' && (
          <section className="gallery-panel glass-card">
            <div className="section-header-row">
              <div>
                <h2>Wallpaper Gallery Vault</h2>
                <p>Discover, explore, and download high-resolution wallpapers.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search prompts..."
                  className="gallery-search-input"
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                />
                <button type="button" className="refresh-btn" onClick={fetchWallpapers}>
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="category-tabs" style={{ marginTop: '8px' }}>
              {['All', '16:9', '9:16', '1:1', '21:9', 'flux', 'anime', 'turbo'].map((filterVal) => (
                <button
                  key={filterVal}
                  type="button"
                  className={`category-tab-pill ${galleryFilter === filterVal ? 'active' : ''}`}
                  onClick={() => setGalleryFilter(filterVal)}
                >
                  {filterVal}
                </button>
              ))}
            </div>

            {/* Wallpapers Grid */}
            {filteredWallpapers.length === 0 ? (
              <div className="empty-gallery">
                <h3>No wallpapers match your criteria.</h3>
                <p>Try clearing your search or create a new wallpaper in the studio!</p>
                <button
                  type="button"
                  className="generate-btn"
                  style={{ marginTop: '16px', display: 'inline-flex' }}
                  onClick={() => setView('home')}
                >
                  Create Wallpaper Now
                </button>
              </div>
            ) : (
              <div className="wallpaper-grid">
                {filteredWallpapers.map((w) => (
                  <div key={w._id || w.id} className="wallpaper-card">
                    <div
                      className="card-image-wrap"
                      onClick={() => setLightboxItem(w)}
                    >
                      <img src={getFullImageUrl(w.imageUrl)} alt={w.prompt} loading="lazy" />
                      <span className="card-badge">{w.aspectRatio || '16:9'}</span>
                      <div className="card-overlay">
                        <button
                          type="button"
                          className="card-overlay-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxItem(w);
                          }}
                        >
                          🔍 Preview
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      <p className="card-prompt" title={w.prompt}>{w.prompt}</p>
                      <div className="card-footer">
                        <span className="card-meta">
                          {w.modelUsed ? `Engine: ${w.modelUsed}` : 'AI Generated'}
                        </span>
                        <button
                          type="button"
                          className="card-download-btn"
                          onClick={() => handleDownload(w.imageUrl, `dreamwall-${w._id || 'gallery'}.jpg`)}
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =========================================================================
            USER PROFILE VIEW
           ========================================================================= */}
        {view === 'profile' && (
          <section className="profile-panel glass-card">
            <div className="profile-header">
              <div>
                <h2>Your Profile</h2>
                <p>Customize your creator name, bio, and avatar.</p>
              </div>
              <button type="button" className="nav-link" onClick={() => setView('home')}>
                ← Back to Studio
              </button>
            </div>

            <div className="profile-body">
              <div className="profile-avatar-card">
                <div className="profile-avatar">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Avatar" />
                  ) : (
                    (profileDetails.firstName || userName || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <label className="profile-picture-upload">
                  <span>📷 Change Avatar</span>
                  <input type="file" accept="image/*" onChange={handleProfilePictureChange} />
                </label>
              </div>

              <div className="auth-form">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={profileDetails.firstName}
                    onChange={(e) => handleProfileFieldChange('firstName', e.target.value)}
                    placeholder="First Name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={profileDetails.lastName}
                    onChange={(e) => handleProfileFieldChange('lastName', e.target.value)}
                    placeholder="Last Name"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profileDetails.email}
                    onChange={(e) => handleProfileFieldChange('email', e.target.value)}
                    placeholder="you@domain.com"
                  />
                </div>
                <div className="form-group">
                  <label>Creator Handle / Username</label>
                  <input
                    type="text"
                    value={profileDetails.username}
                    onChange={(e) => handleProfileFieldChange('username', e.target.value)}
                    placeholder="username"
                  />
                </div>
                <button type="button" className="auth-submit-btn" onClick={handleSaveProfile}>
                  Save Profile Changes
                </button>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            ACCOUNT SETTINGS VIEW
           ========================================================================= */}
        {view === 'settings' && (
          <section className="settings-panel glass-card">
            <div className="profile-header">
              <div>
                <h2>Account Settings</h2>
                <p>Manage security, verifications, and preferences.</p>
              </div>
              <button type="button" className="nav-link" onClick={() => setView('home')}>
                ← Back to Studio
              </button>
            </div>

            <div className="settings-grid">
              {/* Email Verification Card */}
              <div className="settings-card">
                <h3>📧 Email Verification</h3>
                <div className="form-group">
                  <label>Verified Email</label>
                  <input
                    type="email"
                    value={settings.email || profileDetails.email}
                    onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
                    placeholder="you@domain.com"
                  />
                </div>
                <div className="verification-row">
                  <span className={settings.emailVerified ? 'verified-badge' : 'not-verified-badge'}>
                    {settings.emailVerified ? '✓ Verified Account' : '● Not Verified'}
                  </span>
                  {!settings.emailVerified && (
                    <button
                      type="button"
                      className="nav-link"
                      onClick={() => {
                        setSettings((s) => ({ ...s, emailCodeSent: true }));
                        setAuthMessage('Demo code sent! Enter 123456 to verify.');
                      }}
                    >
                      Send Code
                    </button>
                  )}
                </div>
                {settings.emailCodeSent && !settings.emailVerified && (
                  <div className="form-group" style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Enter verification code (123456)"
                      value={settings.emailCode}
                      onChange={(e) => setSettings((s) => ({ ...s, emailCode: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="auth-submit-btn"
                      onClick={() => {
                        if (settings.emailCode.trim() === '123456') {
                          setSettings((s) => ({ ...s, emailVerified: true, emailCodeSent: false }));
                          setAuthMessage('Email verified successfully!');
                        } else {
                          setAuthError('Invalid code. Use 123456.');
                        }
                      }}
                    >
                      Verify Now
                    </button>
                  </div>
                )}
              </div>

              {/* Password Management */}
              <div className="settings-card">
                <h3>🔒 Password & Security</h3>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="Current password"
                    value={settings.currentPassword}
                    onChange={(e) => setSettings((s) => ({ ...s, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="New password"
                    value={settings.newPassword}
                    onChange={(e) => setSettings((s) => ({ ...s, newPassword: e.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  className="auth-submit-btn"
                  onClick={() => {
                    if (settings.newPassword) {
                      setAuthMessage('Password updated successfully!');
                      setSettings((s) => ({ ...s, currentPassword: '', newPassword: '' }));
                    }
                  }}
                >
                  Update Password
                </button>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SIGN IN VIEW
           ========================================================================= */}
        {view === 'signin' && (
          <section className="auth-panel glass-card">
            <h2>Welcome Back</h2>
            <p>Sign in to save wallpapers to your account and personalize your studio.</p>

            {authError && <div className="alert error" style={{ marginBottom: '14px' }}>{authError}</div>}

            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleSignin(); }}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={authFields.email}
                  onChange={(e) => handleAuthFieldChange('email', e.target.value)}
                  placeholder="you@domain.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={authFields.password}
                  onChange={(e) => handleAuthFieldChange('password', e.target.value)}
                  placeholder="Your password"
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn">
                Sign In to DreamWall
              </button>
            </form>

            <div className="auth-switch-prompt">
              Don't have an account yet?
              <button type="button" className="auth-switch-link" onClick={() => setView('signup')}>
                Create free account
              </button>
            </div>
          </section>
        )}

        {/* =========================================================================
            SIGN UP VIEW
           ========================================================================= */}
        {view === 'signup' && (
          <section className="auth-panel glass-card">
            <h2>Create an Account</h2>
            <p>Join DreamWall to save, customize, and curate high-resolution wallpapers.</p>

            {authError && <div className="alert error" style={{ marginBottom: '14px' }}>{authError}</div>}

            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={authFields.name}
                  onChange={(e) => handleAuthFieldChange('name', e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={authFields.email}
                  onChange={(e) => handleAuthFieldChange('email', e.target.value)}
                  placeholder="you@domain.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={authFields.password}
                  onChange={(e) => handleAuthFieldChange('password', e.target.value)}
                  placeholder="Choose a password"
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn">
                Sign Up & Start Creating
              </button>
            </form>

            <div className="auth-switch-prompt">
              Already have an account?
              <button type="button" className="auth-switch-link" onClick={() => setView('signin')}>
                Sign In
              </button>
            </div>
          </section>
        )}
      </main>

      {/* =========================================================================
          FULLSCREEN LIGHTBOX & PREVIEW MODAL
         ========================================================================= */}
      {lightboxItem && (
        <div className="lightbox-modal" onClick={() => setLightboxItem(null)}>
          <button
            type="button"
            className="lightbox-close-btn"
            onClick={() => setLightboxItem(null)}
          >
            ✕
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={getFullImageUrl(lightboxItem.imageUrl)}
              alt={lightboxItem.prompt}
            />
          </div>

          <div className="lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-prompt">"{lightboxItem.prompt}"</div>
            <button
              type="button"
              className="download-hd-btn"
              onClick={() => handleDownload(lightboxItem.imageUrl, `dreamwall-${Date.now()}.jpg`)}
            >
              ⬇️ Download Full Resolution
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;