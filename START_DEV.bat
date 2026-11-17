@echo off
REM Start DreamWall in Development Mode
REM This script runs both the backend and frontend dev servers

echo.
echo ================================
echo  DreamWall - Development Mode
echo ================================
echo.
echo This will open 2 terminal windows:
echo - Backend Server (port 5000)
echo - Frontend React Server (port 3000)
echo.
pause

REM Start Backend in new window
echo Starting Backend Server...
start "DreamWall Backend" cmd /k "cd backend && npm start"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak

REM Start Frontend in new window
echo Starting Frontend React Server...
start "DreamWall Frontend" cmd /k "cd frontend && npm start"

echo.
echo Both servers are starting:
echo - Backend:  http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
