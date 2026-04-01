@echo off
title Sports Predictor Pro v2.0
color 0A
echo ============================================================
echo    Sports Predictor Pro v2.0 - AI-Powered Predictions
echo ============================================================
echo.
echo 🤖 AI Features:
echo    - AI Explanations for each prediction
echo    - Intelligent insights generation
echo    - Accuracy tracking and analysis
echo.
echo 📊 Real Data Sources:
echo    ⚽ Football: Premier League, La Liga, Serie A, Bundesliga
echo    🏀 Basketball: NBA, EuroLeague
echo    🎾 Tennis: ATP, WTA Tour
echo.
echo ============================================================
echo.

cd backend

echo Starting server with AI capabilities...
echo.

start /B node src/server.js

timeout /t 4 /nobreak > nul

start http://localhost:3000

echo.
echo ============================================================
echo ✅ System is running with AI-Powered Features
echo ============================================================
echo.
echo 🌐 Access: http://localhost:3000
echo 📅 Today's Date: %date%
echo ⏰ Current Time: %time%
echo.
echo 🤖 AI Features: Enabled
echo 📊 Accuracy Tracking: Active
echo 💡 Insights Engine: Running
echo.
echo 🔄 Data refreshes automatically every 30 minutes
echo.
echo Press any key to stop the server...
echo ============================================================

pause > nul
taskkill /F /IM node.exe > nul 2>&1
echo Server stopped.