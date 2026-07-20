@echo off
REM Build Script for DreamWall Client

echo.
echo ================================
echo  Building DreamWall Client
echo ================================
echo.

cd client

echo Installing dependencies...
call npm install

if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Building optimized production build...
call npm run build

if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ================================
echo  Build completed successfully!
echo ================================
echo.
echo The client is now ready to be served by the server.
echo To start the server, run: START_SERVER.bat
echo.
cd ..
pause
