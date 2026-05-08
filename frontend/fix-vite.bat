@echo off
echo Cleaning node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo node_modules removed
)
if exist package-lock.json (
    del package-lock.json
    echo package-lock.json removed
)
echo.
echo Reinstalling dependencies...
call npm install
echo.
echo Done! Now try: npm run dev
