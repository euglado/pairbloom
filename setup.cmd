@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Install Node.js 24 LTS first. & pause & exit /b 1)
call npm ci --ignore-scripts || (pause & exit /b 1)
call npm run build || (pause & exit /b 1)
call npm run setup || (pause & exit /b 1)
echo Install using the link above, then run register.cmd.
pause
