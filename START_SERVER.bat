@echo off
REM Start DreamWall Backend Server
REM This script starts the backend server

echo.
echo ================================
echo  DreamWall Backend Server
echo ================================
echo.

cd backend
echo Starting backend server on port 5000...
echo.
echo Server endpoint: http://localhost:5000
echo.
npm start

pause
