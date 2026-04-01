@echo off
echo ============================================================
echo    Sports Predictor Pro v2.0 - Installation
echo ============================================================
echo.

echo Installing backend dependencies...
cd backend
call npm install

echo.
echo Creating data directory...
if not exist "data" mkdir data

echo.
echo ============================================================
echo Installation complete!
echo ============================================================
echo.
echo IMPORTANT: Add your OpenAI API key to backend/.env
echo.
echo To start the system:
echo 1. Run start.bat
echo 2. The application will open in your browser automatically
echo.
pause