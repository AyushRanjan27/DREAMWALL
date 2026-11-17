@echo off
REM Build Script for DreamWall Frontend

echo.
echo ================================
echo  Building DreamWall Frontend
echo ================================
echo.

cd frontend

echo Installing frontend dependencies...
call npm install

if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
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
echo The frontend build is ready in frontend/build
echo.
cd ..
pause
