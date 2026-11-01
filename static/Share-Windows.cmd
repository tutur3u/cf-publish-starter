@echo off
rem Double-click this file on Windows. / Bam dup chuot vao file nay tren Windows.
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Chua cai Node.js. Tai ban LTS tai https://nodejs.org roi chay lai.
  echo Node.js is not installed. Get the LTS from https://nodejs.org and try again.
  echo.
  pause
  exit /b 1
)
call npm run share
echo.
pause
