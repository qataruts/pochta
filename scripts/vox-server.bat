@echo off
setlocal
rem Run a Vox relay from a self-contained release on Windows — no Elixir/Node.
rem Data (SQLite + relay key + secret) lives in %USERPROFILE%\.vox by default.

if "%VOX_RELEASE%"=="" (
  set "BIN=%~dp0bin\vox.bat"
) else (
  set "BIN=%VOX_RELEASE%"
)
if not exist "%BIN%" (
  echo Vox release not found.
  echo Build it ^(needs Elixir^) with:  cd apps\server ^&^& set MIX_ENV=prod ^&^& mix release
  echo or set VOX_RELEASE to ...\rel\vox\bin\vox.bat
  exit /b 1
)

if "%VOX_DATA%"=="" set "VOX_DATA=%USERPROFILE%\.vox"
if not exist "%VOX_DATA%" mkdir "%VOX_DATA%"

set "SECRET_FILE=%VOX_DATA%\secret_key_base"
if not exist "%SECRET_FILE%" (
  powershell -NoProfile -Command "[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))" > "%SECRET_FILE%"
)
set /p SECRET_KEY_BASE=<"%SECRET_FILE%"

set PHX_SERVER=true
if "%PORT%"=="" set PORT=4000
set "DATABASE_PATH=%VOX_DATA%\chat.db"
set "RELAY_KEY_PATH=%VOX_DATA%\relay_identity.key"

echo Vox relay -^> http://localhost:%PORT%   (data: %VOX_DATA%)
call "%BIN%" start
