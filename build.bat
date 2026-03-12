@echo off
echo Building VaultDL.exe...

REM Build the React frontend first
cd frontend
call npm run build
cd ..

REM Run PyInstaller using full path (works even if pyinstaller is not on PATH)
"%APPDATA%\Python\Python314\Scripts\pyinstaller.exe" VaultDL.spec --noconfirm

echo.
echo Done! Your app is at: dist\VaultDL.exe
pause
