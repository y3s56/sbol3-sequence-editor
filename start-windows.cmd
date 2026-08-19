@echo off
setlocal
cd /d "%~dp0"
echo.
echo SBOL3 Sequence Editor - Windows launcher
echo =======================================
echo Checking Node.js...
node -v || goto :node_error
call npm.cmd -v || goto :npm_error
if not exist node_modules (
  echo.
  echo Installing dependencies from npm registry...
  call npm.cmd install || goto :install_error
)
echo.
echo Running automated tests...
call npm.cmd test || goto :test_error
echo.
echo Starting Vite development server...
call npm.cmd run dev
goto :eof

:node_error
echo Node.js is not available in PATH.
exit /b 1
:npm_error
echo npm is not available. Reinstall Node.js LTS or use npm.cmd.
exit /b 1
:install_error
echo Dependency installation failed. Check internet access and npm registry settings.
exit /b 1
:test_error
echo Automated tests failed. Development server was not started.
exit /b 1
