@echo off
echo Starting Legasus E-commerce Backend Server...

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js and try again.
    pause
    exit /b
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies.
        pause
        exit /b
    )
)

REM Initialize database
echo Initializing database...
node scripts/init-db.js

REM Start the server
echo Starting server...
npm start

pause