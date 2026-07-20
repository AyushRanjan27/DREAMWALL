# Prompt Wallpaper Creation

A MERN stack web application that allows users to generate custom wallpapers based on text prompts using AI, with full authentication support.

## Features

- **User Authentication**: Sign up and sign in with email/password
- **Wallpaper Generation**: Input text prompts to create AI-generated wallpapers using OpenAI's DALL-E
- **Wallpaper Gallery**: View all previously generated wallpapers
- **Download Functionality**: Download wallpapers directly from the app
- **Profile Management**: Manage your profile, picture, and account settings
- **Email/Phone Verification**: Verify your account with email and phone verification
- **Password Security**: Change your password with validation
- **MongoDB Storage**: Save prompts and generated image URLs with user authentication
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between dark and light themes

## Tech Stack

- **Frontend**: React.js with Axios for API calls
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **AI**: OpenAI DALL-E API

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally on port 27017, or a remote MongoDB URI)
- OpenAI API Key
- Git

### Installation

1. **Clone/Navigate to the Project**:
   ```bash
   cd path/to/MEAN
   ```

2. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Install Client Dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up Environment Variables**:
   
   Create/Update `server/.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/wallpaperdb
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   ```

   Ensure MongoDB is running locally on port 27017 or update `MONGODB_URI` with your MongoDB connection string.

5. **Build the Client**:
   ```bash
   cd client
   npm run build
   cd ..
   ```

## Running the Application

### Option 1: Run Server Only (for development with separate React dev server)

**Terminal 1 - Start the Backend Server**:
```bash
cd server
npm start
# Server will be available at http://localhost:5000
```

**Terminal 2 - Start the React Development Server**:
```bash
cd client
npm start
# React dev server will be available at http://localhost:3000
```

### Option 2: Run Server with Built Client (production mode)

The server is configured to serve the built React application:

```bash
cd server
npm start
# Full application available at http://localhost:5000
```

For this to work, ensure the client has been built:
```bash
cd client
npm run build
```

## Usage

1. **Create an Account**:
   - Click "Sign Up" on the homepage
   - Enter your name, email, and password
   - Your account will be created and ready to use

2. **Sign In**:
   - Enter your email and password
   - You'll be authenticated and redirected to the home page

3. **Generate Wallpapers**:
   - Enter a descriptive prompt (e.g., "a serene mountain landscape at sunset")
   - Click "Generate Wallpaper"
   - View the AI-generated image

4. **Browse Gallery**:
   - Click "Wallpaper Gallery" to view all generated wallpapers
   - See prompts and images in a grid layout

3. **Download Wallpapers**:
   - Click "Download" button on any wallpaper to save it locally

## API Endpoints

- `POST /api/generate-wallpaper`: Generate a new wallpaper from a prompt
- `GET /api/wallpapers`: Retrieve all stored wallpapers

## Notes

- Requires an OpenAI API key with credits for DALL-E usage
- Images are generated at 1024x1024 resolution
- Wallpapers are stored in MongoDB for gallery viewing