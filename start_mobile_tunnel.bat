@echo off
echo ==========================================================
echo   VidhiScan Mobile HTTPS Tunnel Launcher (PWA & Camera)
echo ==========================================================
echo.
echo Launching secure Cloudflare HTTPS tunnel for port 3000...
echo.
echo No passwords, no login, and no tokens needed!
echo Open the generated https://*.trycloudflare.com link on your mobile phone.
echo.
echo ==========================================================
cloudflared.exe tunnel --url http://127.0.0.1:3000
pause
