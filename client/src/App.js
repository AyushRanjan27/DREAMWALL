import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AppDesign.css';

const API_BASE_URL = window.location.port === '3000' ? 'http://localhost:5000' : '';

function App() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('signin');
  const [wallpapers, setWallpapers] = useState([]);
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
  const [showSignupCheckbox, setShowSignupCheckbox] = useState(false);
  const [signupCheckboxChecked, setSignupCheckboxChecked] = useState(false);
  const [model, setModel] = useState('flux'); // 'flux' or 'dalle3'
  const [activeCategory, setActiveCategory] = useState('All');
  const [generationInfo, setGenerationInfo] = useState(null); // stores { modelUsed, fallback }

  const categories = {
    'All': [
      'Neon city skyline at dusk',
      'Soft pastel mountains with stars',
      'Futuristic abstract geometry',
      'Dreamy ocean waves with moonlight',
      'Mystical forest with glowing flora'
    ],
    '🌌 Sci-Fi & Cyberpunk': [
      'Neon cyberpunk street with holographic advertisements, rain puddles reflecting neon lights, cinematic lighting',
      'A futuristic metropolis with flying vehicles traversing between colossal skyscrapers, vaporwave colors',
      'An astronaut sitting in a lush meadow on a distant planet looking at a giant gas giant in the sky',
      'Inside the cockpit of a spaceship traveling through a cosmic warp speed tunnel, bright light streaks'
    ],
    '🎌 Anime': [
      'Stunning anime style landscape of a tranquil cherry blossom shrine, soft warm sunlight, Makoto Shinkai style',
      'Cyberpunk anime street at midnight, futuristic motorcycles, glowing billboards, retro anime aesthetic',
      'A floating island in the sky with a giant ancient tree, clouds underneath, studio ghibli hand-drawn watercolor style',
      'Cozy anime bedroom with a large window showing a rainy night, warm study lamp, nostalgic lo-fi atmosphere'
    ],
    '🍃 Nature': [
      'Serene mountain peak above a blanket of clouds at sunrise, golden light, crisp professional photography',
      'A majestic waterfall flowing into a crystal clear emerald lagoon surrounded by tropical flora, long exposure',
      'Ethereal misty pine forest during autumn, rays of golden sun filtering through trees, cozy atmosphere',
      'Glowing Bioluminescent beach at midnight, neon blue waves crashing on dark sand, starry sky galaxy'
    ],
    '🎨 Digital Art': [
      'Abstract liquid gold swirling dynamically on a dark matte background, 3D render, luxury textures',
      'Vibrant vaporwave style grid landscape with a digital sun, retro synthwave vector art, pastel pink gradients',
      'Glassmorphic floating shapes with iridescent colors, minimalist clean layout, studio lighting 3D illustration',
      'Surreal dreamscape of stairs leading into a portal in the clouds, origami birds flying around, soft surrealism'
    ]
  };

  const promptEnhancers = {
    cyberpunk: 'neon light reflections, highly detailed cyberpunk aesthetic, dark atmosphere, Unreal Engine 5 render, cinematic lighting',
    anime: 'aesthetic anime style, beautiful colors, highly detailed, soft lighting, 8k wallpaper key visual',
    nature: 'breathtaking landscape, realistic, national geographic photography, 8k resolution, volumetric light, depth of field',
    art: 'digital art masterpiece, vibrant color palette, clean vector lines, trending on artstation, creative composition',
    general: 'ultra realistic, high dynamic range, masterpiece, 8k, detailed textures, cinematic crop'
  };

  const sampleCreations = [
    {
      id: 'sample-1',
      imageUrl: 'https://picsum.photos/seed/dreamwall1/800/600',
      prompt: 'Aurora-lit mountain temple under a starry sky',
    },
    {
      id: 'sample-2',
      imageUrl: 'https://picsum.photos/seed/dreamwall2/800/600',
      prompt: 'Neon vaporwave cityscape with glowing reflections',
    },
    {
      id: 'sample-3',
      imageUrl: 'https://picsum.photos/seed/dreamwall3/800/600',
      prompt: 'Golden forest path with floating lanterns and mist',
    },
    {
      id: 'sample-4',
      imageUrl: 'https://picsum.photos/seed/dreamwall4/800/600',
      prompt: 'Futuristic crystal canyon with sunset lighting',
    },
  ];

  const previewPlaceholder = {
    imageUrl: '/images.jpg',
    prompt: 'Dreamy ocean waves with moonlight',
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

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      setAuthError('Please sign in first to generate wallpapers.');
      setView('signin');
      return;
    }
    if (!prompt.trim()) return;
    setLoading(true);
    setAuthError('');
    setGenerationInfo(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/generate-wallpaper`,
        { prompt, model },
        { headers: getAuthHeaders() }
      );
      setImageUrl(response.data.imageUrl);
      setGenerationInfo({
        modelUsed: response.data.modelUsed,
        fallback: response.data.fallback
      });
      fetchWallpapers();
    } catch (error) {
      console.error('Error generating wallpaper:', error);
      const msg = error.response?.data?.error || 'Failed to generate wallpaper.';
      const details = error.response?.data?.details;
      setAuthError(msg + (details?.error?.type ? ` (type: ${details.error.type})` : ''));
      if (details) console.error('generate-wallpaper details:', details);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallpapers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallpapers`);
      setWallpapers(response.data);
    } catch (error) {
      console.error('Error fetching wallpapers:', error);
    }
  }, []);

  const latestCreations = wallpapers.slice(0, 4);
  const displayedCreations = latestCreations.length > 0 ? latestCreations : sampleCreations;

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) return;
    let suffix = promptEnhancers.general;
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('cyberpunk') || lowerPrompt.includes('neon') || lowerPrompt.includes('futuristic')) {
      suffix = promptEnhancers.cyberpunk;
    } else if (lowerPrompt.includes('anime') || lowerPrompt.includes('ghibli') || lowerPrompt.includes('cartoon')) {
      suffix = promptEnhancers.anime;
    } else if (lowerPrompt.includes('forest') || lowerPrompt.includes('mountain') || lowerPrompt.includes('ocean') || lowerPrompt.includes('lake') || lowerPrompt.includes('sunset')) {
      suffix = promptEnhancers.nature;
    } else if (lowerPrompt.includes('abstract') || lowerPrompt.includes('liquid') || lowerPrompt.includes('minimalist') || lowerPrompt.includes('vaporwave')) {
      suffix = promptEnhancers.art;
    }
    setPrompt((prev) => `${prev.trim()}, ${suffix}`);
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

    // Hide loading screen
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
      setView('home');
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
      } else if (storedProfile) {
        const profileEmail = JSON.parse(storedProfile).email || '';
        setSettings((prev) => ({ ...prev, email: profileEmail }));
      }

      // Populate "Latest creation" immediately from the server
      // (server returns wallpapers sorted by createdAt desc)
      axios
        .get(`${API_BASE_URL}/api/wallpapers`)
        .then((response) => {
          const latest = response?.data?.[0];
          if (latest?.imageUrl) setImageUrl(latest.imageUrl);
        })
        .catch((error) => {
          console.error('Error fetching latest wallpaper:', error);
        });
    }

    fetchWallpapers();
  }, [fetchWallpapers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-container')) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  useEffect(() => {
    if (!authMessage) return;
    const timeout = setTimeout(() => setAuthMessage(''), 4500);
    return () => clearTimeout(timeout);
  }, [authMessage]);

  useEffect(() => {
    if (isAuthenticated || view !== 'home') {
      setShowSignupCheckbox(false);
      setSignupCheckboxChecked(false);
      return;
    }

    const interval = setInterval(() => {
      setShowSignupCheckbox(true);
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [view, isAuthenticated]);

  useEffect(() => {
    const themeColorMeta = document.getElementById('theme-color-meta');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDarkMode ? '#000000' : '#ffffff');
    }
  }, [isDarkMode]);

  const handleAuthFieldChange = (field, value) => {
    setAuthFields((prev) => ({ ...prev, [field]: value }));
    setAuthError('');
    setAuthMessage('');
  };

  const handleSignupReminderToggle = () => {
    setSignupCheckboxChecked((prev) => !prev);
  };

  const handleSignupReminder = () => {
    setView('signup');
    setShowSignupCheckbox(false);
    setSignupCheckboxChecked(false);
  };



  const handleSettingsChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setAuthMessage('');
  };

  const saveSettings = (updatedSettings) => {
    const saved = { ...settings, ...updatedSettings };
    setSettings(saved);
    localStorage.setItem('authSettings', JSON.stringify(saved));
  };

  const sendEmailVerification = () => {
    if (!settings.email.trim()) {
      setAuthMessage('Enter your email first.');
      return;
    }
    saveSettings({ emailCodeSent: true, emailCode: '' });
    setAuthMessage('Verification code sent to your email. Use 123456 to verify.');
  };

  const verifyEmailCode = () => {
    if (settings.emailCode.trim() === '123456') {
      saveSettings({ emailVerified: true, emailCodeSent: false, emailCode: '' });
      setAuthMessage('Email verified successfully.');
    } else {
      setAuthMessage('Invalid email verification code.');
    }
  };

  const sendPhoneVerification = () => {
    if (!settings.phone.trim()) {
      setAuthMessage('Enter your phone number first.');
      return;
    }
    saveSettings({ phoneCodeSent: true, phoneCode: '' });
    setAuthMessage('Verification code sent to your phone. Use 123456 to verify.');
  };

  const verifyPhoneCode = () => {
    if (settings.phoneCode.trim() === '123456') {
      saveSettings({ phoneVerified: true, phoneCodeSent: false, phoneCode: '' });
      setAuthMessage('Phone number verified successfully.');
    } else {
      setAuthMessage('Invalid phone verification code.');
    }
  };

  const changePassword = () => {
    if (!settings.currentPassword || !settings.newPassword || !settings.confirmPassword) {
      setAuthMessage('Please fill out all password fields.');
      return;
    }
    if (settings.newPassword !== settings.confirmPassword) {
      setAuthMessage('New passwords do not match.');
      return;
    }
    const storedPassword = localStorage.getItem('authPassword');
    if (storedPassword && settings.currentPassword !== storedPassword) {
      setAuthMessage('Current password is incorrect.');
      return;
    }
    localStorage.setItem('authPassword', settings.newPassword);
    setSettings((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
    setAuthMessage('Password changed successfully.');
  };

  const handleSignup = async () => {
    const { name, email, password } = authFields;
    if (!name.trim() || !email.trim() || !password.trim()) {
      setAuthError('Name, email, and password are required for signup.');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/signup`, { name, email, password });
      const profileData = createProfileFromData({ name, email });
      setProfileDetails(profileData);
      localStorage.setItem('authProfile', JSON.stringify(profileData));
      localStorage.setItem('authPassword', password);
      saveSettings({ email: email, emailVerified: false });
      setAuthMessage('Signup successful. Please sign in.');
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
      setAuthError('Email and password are required to sign in.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/signin`, { email, password });
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('authName', user.name || email);
      localStorage.setItem('authPassword', password);
      const profileData = createProfileFromData(user || { name: user.name, email });
      localStorage.setItem('authProfile', JSON.stringify(profileData));
      setProfileDetails(profileData);
      setProfilePicture(localStorage.getItem('authPicture') || '');
      setUserName(user.name || email);
      setIsAuthenticated(true);
      setAuthFields({ name: '', email: '', password: '' });
      setAuthError('');
      setAuthMessage('Signed in successfully. Redirecting to home...');
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
    setView('signin');
    setAuthMessage('You have been signed out.');
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const closeProfileDropdown = () => {
    setProfileDropdownOpen(false);
  };

  const handleProfileOption = (option) => {
    closeProfileDropdown();
    switch (option) {
      case 'profile':
        setView('profile');
        break;
      case 'gallery':
        setView('gallery');
        break;
      case 'settings':
        setView('settings');
        break;
      case 'signout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const handleDownload = async (url, filename) => {
    if (!isAuthenticated) {
      setAuthError('Please sign in to download wallpapers.');
      setView('signin');
      return;
    }
    const fullUrl = getFullImageUrl(url);
    try {
      const res = await fetch(fullUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download image via blob, falling back to direct link:', err);
      const link = document.createElement('a');
      link.href = fullUrl;
      link.target = '_blank';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="App">
      <header className="site-header">
        <div className="brand">DreamWall</div>
        <nav className="site-nav">
          <button className={view === 'home' ? 'nav-link active' : 'nav-link'} onClick={() => setView('home')}>
            Home
          </button>
          <button className={view === 'gallery' ? 'nav-link active' : 'nav-link'} onClick={() => setView('gallery')}>
            Gallery
          </button>
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
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
              <div className="profile-icon" onClick={toggleProfileDropdown}>
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div className={`profile-dropdown ${profileDropdownOpen ? 'open' : ''}`}>
                <button className="profile-dropdown-item" onClick={() => handleProfileOption('profile')}>
                  👤 Profile
                </button>
                <button className="profile-dropdown-item" onClick={() => handleProfileOption('gallery')}>
                  🖼️ Gallery
                </button>
                <button className="profile-dropdown-item" onClick={() => handleProfileOption('settings')}>
                  ⚙️ Settings
                </button>
                <button className="profile-dropdown-item signout" onClick={() => handleProfileOption('signout')}>
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {view === 'home' && authMessage && (
        <div className="home-toast alert success">{authMessage}</div>
      )}

      <main className="content">
        {view === 'home' && (
          <>
            <section className="hero-panel">
              <div className="hero-copy">
                <span className="eyebrow">AI Wallpaper Studio</span>
                <h1>Design the wallpaper of your imagination.</h1>
                <p>
                  {userName ? `Welcome back, ${userName}! ` : ''}Generate stunning custom wallpapers with prompts,
                  preview instantly, and collect your favorite creations in a curated gallery.
                </p>
                <div className="hero-actions">
                  <button className="primary active" onClick={() => setView('home')}>
                    Create Now
                  </button>
                  <button className="secondary" onClick={() => setView('gallery')}>
                    Explore Gallery
                  </button>
                </div>
                {!isAuthenticated && showSignupCheckbox && (
                  <div className="signup-reminder-card">
                    <label className="signup-reminder-checkbox">
                      <input
                        type="checkbox"
                        checked={signupCheckboxChecked}
                        onChange={handleSignupReminderToggle}
                      />
                      I want to sign up for a free account.
                    </label>
                    <button
                      className="primary"
                      type="button"
                      disabled={!signupCheckboxChecked}
                      onClick={handleSignupReminder}
                    >
                      Go to Sign Up
                    </button>
                  </div>
                )}
              </div>
              <div className="hero-preview">
                <div className="preview-card">
                  <div className="preview-tag">Live preview</div>
                  <video className="preview-image" autoPlay muted loop>
                    <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </section>

            <section className="generator-panel glass-card">
              <div className="creator-panel">
                <h2>Craft a magical wallpaper prompt</h2>
                <p>Select a suggestion or type your own vision.</p>
                {authError && <div className="alert error">{authError}</div>}
                
                <div className="model-selector-group">
                  <span className="selector-label">Choose AI Engine:</span>
                  <div className="selector-buttons">
                    <button 
                      type="button" 
                      className={`selector-btn ${model === 'flux' ? 'active' : ''}`}
                      onClick={() => setModel('flux')}
                    >
                      ⚡ FLUX.1 (Free & Fast)
                    </button>
                    <button 
                      type="button" 
                      className={`selector-btn ${model === 'dalle3' ? 'active' : ''}`}
                      onClick={() => setModel('dalle3')}
                    >
                      ✨ DALL-E 3 (Premium)
                    </button>
                  </div>
                </div>

                <div className="category-tabs">
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

                <div className="suggestions">
                  {categories[activeCategory].map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => setPrompt(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>

                <div className="textarea-container">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your wallpaper idea in vivid detail..."
                    rows="5"
                  />
                  {prompt.trim() && (
                    <button 
                      type="button" 
                      className="enhance-btn" 
                      onClick={handleEnhancePrompt}
                      title="Make this prompt highly detailed and artistic"
                    >
                      🪄 Enhance Prompt
                    </button>
                  )}
                </div>

                <button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="generate-btn">
                  {loading ? 'Dreaming...' : 'Generate Wallpaper'}
                </button>
              </div>

              <div className="result-panel">
                <h3>Latest creation</h3>
                <div className={`result-frame ${loading ? 'generating' : ''}`}>
                  {loading ? (
                    <div className="generation-loader">
                      <div className="spinner"></div>
                      <p className="loading-message">Dreaming up your wallpaper...</p>
                    </div>
                  ) : imageUrl ? (
                    <img src={getFullImageUrl(imageUrl)} alt="Generated Wallpaper" />
                  ) : (
                    <div className="empty-state placeholder-preview">
                      <img
                        src={previewPlaceholder.imageUrl}
                        alt={previewPlaceholder.prompt}
                      />
                      <div className="placeholder-copy">
                        <h4>{previewPlaceholder.prompt}</h4>
                        <p>Inspire your next wallpaper with moonlit ocean waves.</p>
                      </div>
                    </div>
                  )}
                </div>
                {generationInfo && !loading && (
                  <div className="model-badge">
                    Engine: <strong>{generationInfo.modelUsed === 'dalle3' ? 'OpenAI DALL-E 3' : 'Hugging Face FLUX.1'}</strong>
                    {generationInfo.fallback && <span className="fallback-tag"> (OpenAI fallback to FLUX)</span>}
                  </div>
                )}
                {imageUrl && !loading && (
                  <button className="download-btn" onClick={() => handleDownload(imageUrl, 'wallpaper.png')}>
                    Download Your Wallpaper
                  </button>
                )}
              </div>
            </section>

            <section className="latest-creations-panel glass-card">
              <div className="latest-header">
                <div>
                  <h2>Latest creations</h2>
                  <p>Fresh wallpaper previews from the newest generated designs.</p>
                </div>
                <button className="refresh-btn" onClick={fetchWallpapers}>
                  Refresh
                </button>
              </div>
              <div className="creation-grid">
                {displayedCreations.map((wallpaper) => (
                  <div key={wallpaper._id || wallpaper.id} className="creation-card">
                    <img src={getFullImageUrl(wallpaper.imageUrl)} alt={wallpaper.prompt} />
                    <div className="creation-card-body">
                      <p>{wallpaper.prompt}</p>
                      <div className="creation-actions">
                        <button
                          className="download-btn"
                          onClick={() =>
                            handleDownload(
                              wallpaper.imageUrl,
                              `wallpaper-${wallpaper._id || wallpaper.id}.png`
                            )
                          }
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        {view === 'gallery' && (
          <section className="gallery-panel">
            <div className="gallery-header">
              <div>
                <h2>Wallpaper Gallery</h2>
                <p>Browse generated wallpapers and download the ones that inspire you.</p>
              </div>
              <button onClick={fetchWallpapers} className="refresh-btn">
                Refresh Gallery
              </button>
            </div>
            <div className="wallpaper-grid">
              {wallpapers.length === 0 ? (
                <div className="empty-gallery">No wallpapers found yet. Generate one to populate the gallery.</div>
              ) : (
                wallpapers.map((wallpaper) => (
                  <div key={wallpaper._id} className="wallpaper-item">
                    <div className="image-wrap">
                      <img src={getFullImageUrl(wallpaper.imageUrl)} alt={wallpaper.prompt} />
                      <div className="overlay">
                        <p>{wallpaper.prompt}</p>
                        <button onClick={() => handleDownload(wallpaper.imageUrl, `wallpaper-${wallpaper._id}.png`)}>
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {!isAuthenticated && view !== 'signup' && view !== 'signin' && (
          <section className="auth-panel glass-card">
            <h2>Authentication Required</h2>
            <p>Please sign in or sign up to access the app.</p>
            <button className="primary" onClick={() => setView('signin')}>
              Sign In
            </button>
          </section>
        )}

        {view === 'profile' && (
          <section className="profile-panel glass-card">
            <div className="profile-header">
              <div>
                <h2>Your Profile</h2>
                <p>Update your profile picture and account details below.</p>
              </div>
              <button className="secondary" onClick={() => setView('home')}>
                Back Home
              </button>
            </div>
            <div className="profile-body">
              <div className="profile-avatar-card">
                <div className="profile-avatar">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" />
                  ) : (
                    <span>{(profileDetails.firstName || userName || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <label className="profile-picture-upload">
                  <span>Upload profile picture</span>
                  <input type="file" accept="image/*" onChange={handleProfilePictureChange} />
                </label>
              </div>
              <div className="profile-form">
                {authMessage && <div className="alert success">{authMessage}</div>}
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>First Name</label>
                  <input
                    type="text"
                    value={profileDetails.firstName}
                    onChange={(e) => handleProfileFieldChange('firstName', e.target.value)}
                    placeholder="First name"
                  />

                  <label>Last Name</label>
                  <input
                    type="text"
                    value={profileDetails.lastName}
                    onChange={(e) => handleProfileFieldChange('lastName', e.target.value)}
                    placeholder="Last name"
                  />

                  <label>Email</label>
                  <input
                    type="email"
                    value={profileDetails.email}
                    onChange={(e) => handleProfileFieldChange('email', e.target.value)}
                    placeholder="you@example.com"
                  />

                  <label>Username</label>
                  <input
                    type="text"
                    value={profileDetails.username}
                    onChange={(e) => handleProfileFieldChange('username', e.target.value)}
                    placeholder="Username"
                  />

                  <button className="primary" type="button" onClick={handleSaveProfile}>
                    Save Profile
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {view === 'settings' && (
          <section className="settings-panel glass-card">
            <div className="settings-header">
              <div>
                <h2>Account Settings</h2>
                <p>Manage your email verification, phone verification, and password.</p>
              </div>
              <button className="secondary" onClick={() => setView('home')}>
                Back Home
              </button>
            </div>
            {authMessage && <div className="settings-alert alert success">{authMessage}</div>}
            <div className="settings-grid">
              <div className="settings-card">
                <h3>Email Verification</h3>
                <label>Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingsChange('email', e.target.value)}
                  placeholder="you@example.com"
                />
                <div className="verification-row">
                  <button className="secondary" type="button" onClick={sendEmailVerification}>
                    Send Code
                  </button>
                  <span className={settings.emailVerified ? 'verified' : 'not-verified'}>
                    {settings.emailVerified ? 'Verified' : 'Not verified'}
                  </span>
                </div>
                {settings.emailCodeSent && (
                  <>
                    <label>Verification Code</label>
                    <input
                      type="text"
                      value={settings.emailCode}
                      onChange={(e) => handleSettingsChange('emailCode', e.target.value)}
                      placeholder="Enter code"
                    />
                    <button className="primary" type="button" onClick={verifyEmailCode}>
                      Verify Email
                    </button>
                  </>
                )}
              </div>

              <div className="settings-card">
                <h3>Phone Verification</h3>
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => handleSettingsChange('phone', e.target.value)}
                  placeholder="+1234567890"
                />
                <div className="verification-row">
                  <button className="secondary" type="button" onClick={sendPhoneVerification}>
                    Send Code
                  </button>
                  <span className={settings.phoneVerified ? 'verified' : 'not-verified'}>
                    {settings.phoneVerified ? 'Verified' : 'Not verified'}
                  </span>
                </div>
                {settings.phoneCodeSent && (
                  <>
                    <label>Verification Code</label>
                    <input
                      type="text"
                      value={settings.phoneCode}
                      onChange={(e) => handleSettingsChange('phoneCode', e.target.value)}
                      placeholder="Enter code"
                    />
                    <button className="primary" type="button" onClick={verifyPhoneCode}>
                      Verify Phone
                    </button>
                  </>
                )}
              </div>

              <div className="settings-card settings-password-card">
                <h3>Change Password</h3>
                <label>Current Password</label>
                <input
                  type="password"
                  value={settings.currentPassword}
                  onChange={(e) => handleSettingsChange('currentPassword', e.target.value)}
                  placeholder="Current password"
                />
                <label>New Password</label>
                <input
                  type="password"
                  value={settings.newPassword}
                  onChange={(e) => handleSettingsChange('newPassword', e.target.value)}
                  placeholder="New password"
                />
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={settings.confirmPassword}
                  onChange={(e) => handleSettingsChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
                <button className="primary" type="button" onClick={changePassword}>
                  Change Password
                </button>
              </div>
            </div>
          </section>
        )}


        {view === 'signin' && (
          <section className="auth-panel glass-card">
            <h2>Sign In</h2>
            <p>Welcome back! Enter your credentials to continue.</p>
            {authError && <div className="alert error">{authError}</div>}
            {authMessage && <div className="alert success">{authMessage}</div>}
            <form onSubmit={(e) => e.preventDefault()}>
              <label>Email</label>
              <input
                type="email"
                value={authFields.email}
                onChange={(e) => handleAuthFieldChange('email', e.target.value)}
                placeholder="you@example.com"
              />
              <label>Password</label>
              <input
                type="password"
                value={authFields.password}
                onChange={(e) => handleAuthFieldChange('password', e.target.value)}
                placeholder="Enter your password"
              />
              <button className="primary" type="button" onClick={handleSignin}>
                Sign In
              </button>
            </form>
          </section>
        )}

        {view === 'signup' && (
          <section className="auth-panel glass-card">
            <h2>Sign Up</h2>
            <p>Create a new account and start designing wallpapers.</p>
            {authError && <div className="alert error">{authError}</div>}
            {authMessage && <div className="alert success">{authMessage}</div>}
            <form onSubmit={(e) => e.preventDefault()}>
              <label>Name</label>
              <input
                type="text"
                value={authFields.name}
                onChange={(e) => handleAuthFieldChange('name', e.target.value)}
                placeholder="Your name"
              />
              <label>Email</label>
              <input
                type="email"
                value={authFields.email}
                onChange={(e) => handleAuthFieldChange('email', e.target.value)}
                placeholder="you@example.com"
              />
              <label>Password</label>
              <input
                type="password"
                value={authFields.password}
                onChange={(e) => handleAuthFieldChange('password', e.target.value)}
                placeholder="Create a password"
              />
              <button className="primary" type="button" onClick={handleSignup}>
                Sign Up
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;