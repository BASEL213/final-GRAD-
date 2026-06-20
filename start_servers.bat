@echo off
title Findoor — Start All Servers
echo ============================================================
echo   Findoor — Starting all services
echo ============================================================
echo.

echo [1/5] Flutter Web App (port 4001)...
start "Findoor Flutter Web :4001" cmd /k "cd /d "B:\integerated grad\mobile" && flutter run -d chrome --web-port 4001"

timeout /t 3 /nobreak >nul

echo [2/5] Node.js API (port 3000)...
start "Findoor Node.js :3000" cmd /k "cd /d "B:\integerated grad\web\backend" && node server.js"

timeout /t 2 /nobreak >nul

echo [3/5] React Frontend (port 5173)...
start "Findoor React :5173" cmd /k "cd /d "B:\integerated grad\web\frontend" && npm run dev"

timeout /t 2 /nobreak >nul

echo [4/5] Flask OCR (port 5001)...
start "Findoor Flask OCR :5001" cmd /k "cd /d "B:\integerated grad\ai\ocr" && "B:\integerated grad\ai\ai-gateway\venv\Scripts\python.exe" flask_api.py 2>&1"

timeout /t 2 /nobreak >nul

echo [5/5] FastAPI AI Gateway (port 5000)...
start "Findoor FastAPI :5000" cmd /k "cd /d "B:\integerated grad\ai\ai-gateway\Backend" && "B:\integerated grad\ai\ai-gateway\venv\Scripts\python.exe" main.py"

echo.
echo ============================================================
echo   All 5 servers launching in separate windows.
echo   Wait ~15 seconds for them to fully start.
echo.
echo   Flutter Web    ->  http://localhost:4001
echo   Web Dashboard  ->  http://localhost:5173
echo   Node.js API    ->  http://localhost:3000/api
echo   FastAPI        ->  http://localhost:5000
echo   Flask OCR      ->  http://localhost:5001  (internal)
echo.
echo   Mobile app IP  ->  192.168.1.8
echo ============================================================
echo.
pause
