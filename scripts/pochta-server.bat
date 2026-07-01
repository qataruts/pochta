@echo off
setlocal
rem Run a Pochta relay from a self-contained release on Windows — no Elixir/Node.
rem Data (SQLite + relay key + secret) lives in %USERPROFILE%\.pochta by default.

if "%POCHTA_RELEASE%"=="" (
  set "BIN=%~dp0bin\pochta.bat"
) else (
  set "BIN=%POCHTA_RELEASE%"
)
if not exist "%BIN%" (
  echo Pochta release not found.
  echo Build it ^(needs Elixir^) with:  cd apps\server ^&^& set MIX_ENV=prod ^&^& mix release
  echo or set POCHTA_RELEASE to ...\rel\pochta\bin\pochta.bat
  exit /b 1
)

if "%POCHTA_DATA%"=="" set "POCHTA_DATA=%USERPROFILE%\.pochta"
if not exist "%POCHTA_DATA%" mkdir "%POCHTA_DATA%"

set "SECRET_FILE=%POCHTA_DATA%\secret_key_base"
if not exist "%SECRET_FILE%" (
  powershell -NoProfile -Command "[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))" > "%SECRET_FILE%"
)
set /p SECRET_KEY_BASE=<"%SECRET_FILE%"

set PHX_SERVER=true
if "%PORT%"=="" set PORT=4000
set "DATABASE_PATH=%POCHTA_DATA%\chat.db"
set "RELAY_KEY_PATH=%POCHTA_DATA%\relay_identity.key"

echo Pochta relay -^> http://localhost:%PORT%   (data: %POCHTA_DATA%)
call "%BIN%" start
