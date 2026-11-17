@echo off
rem Upload this folder to https://semiaof.github.io/offy/  (double-click to run)
cd /d "%~dp0"
echo.
echo  Uploading "new offy" to https://semiaof.github.io/offy/
echo.
git add -A
git commit -m "Update site"
git push origin main
if errorlevel 1 goto fail
git push origin main:gh-pages
if errorlevel 1 goto fail
echo.
echo  Done. The website updates in about 1-2 minutes.
echo.
pause
exit /b 0
:fail
echo.
echo  Upload failed. Read the message above, then try again.
echo.
pause
exit /b 1
