@echo off
echo 🚀 Findoor Backend Quick Start
echo ================================
echo.

echo 1️⃣ Checking MongoDB...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MongoDB not found. Please install MongoDB first.
    pause
    exit /b 1
)
echo ✅ MongoDB is installed

echo.
echo 2️⃣ Starting MongoDB in background...
start "MongoDB" mongod --dbpath ./data/db
timeout /t 3 >nul

echo.
echo 3️⃣ Testing backend setup...
node test-server.js

echo.
echo 4️⃣ Starting development server...
echo Press Ctrl+C to stop the server
echo.
npm run dev

pause
