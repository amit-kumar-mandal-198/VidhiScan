@echo off
echo Starting VidhiScan Backend and Frontend...
start "VidhiScan Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
start "VidhiScan Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Both servers have been launched!
echo - Desktop: http://localhost:3000
echo - Mobile Phone (same Wi-Fi): http://172.168.25.73:3000
echo - Backend:  http://localhost:8000
echo.
pause
