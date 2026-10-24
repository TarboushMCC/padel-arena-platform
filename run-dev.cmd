@echo off
setlocal

set "ROOT=%~dp0"
pushd "%ROOT%" >nul 2>&1

set "NODE_DIR=%ROOT%.tools\node-v24.14.0-win-x64"
set "NPM_CMD=%NODE_DIR%\npm.cmd"
set "DB_START=%ROOT%scripts\start-db.ps1"

if not exist "%NODE_DIR%\node.exe" (
  echo [ERROR] Local Node runtime not found:
  echo         %NODE_DIR%\node.exe
  echo.
  echo Run setup first, then try again.
  pause
  popd >nul 2>&1
  exit /b 1
)

if not exist "%NPM_CMD%" (
  echo [ERROR] Local npm not found:
  echo         %NPM_CMD%
  pause
  popd >nul 2>&1
  exit /b 1
)
if not exist "%DB_START%" (
  echo [ERROR] DB start script not found:
  echo         %DB_START%
  pause
  popd >nul 2>&1
  exit /b 1
)

set "PATH=%NODE_DIR%;%PATH%"

echo Starting PostgreSQL...
powershell -ExecutionPolicy Bypass -File "%DB_START%"
if errorlevel 1 (
  echo.
  echo [ERROR] Could not start PostgreSQL.
  pause
  popd >nul 2>&1
  exit /b 1
)

call "%NPM_CMD%" run dev
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] Dev server failed with exit code %EXIT_CODE%.
  pause
)

popd >nul 2>&1
exit /b %EXIT_CODE%
