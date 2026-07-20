@echo off
REM Start DreamWall Server with Production Build
REM This script serves the built React client through the Node.js server

echo.
echo ================================
echo  DreamWall Server - Production Mode
echo ================================
echo.

REM Check if client build exists
if not exist "client\build\index.html" (
    echo ERROR: Client build not found!
    echo Please run: cd client ^&^& npm run build ^&^& cd ..
    echo.
    pause
    exit /b 1
)

REM Navigate to server and start
cd server
echo Starting server on port 5000...
echo.
echo Once the server starts, visit: http://localhost:5000
echo.
npm start

pause
