@echo off
REM Start DreamWall in Development Mode
REM This script runs both the server and client dev server

echo.
echo ================================
echo  DreamWall - Development Mode
echo ================================
echo.
echo This will open 2 new terminal windows:
echo - One for the Backend Server (port 5000)
echo - One for the React Dev Server (port 3000)
echo.
pause

REM Start Server in new window
echo Starting Backend Server...
start "DreamWall Server" cmd /k "cd server && npm start"

REM Wait a moment for server to start
timeout /t 3 /nobreak

REM Start Client in new window  
echo Starting React Dev Server...
start "DreamWall Client" cmd /k "cd client && npm start"

echo.
echo Both servers are starting...
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
