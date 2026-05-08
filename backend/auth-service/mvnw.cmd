@echo off
rem Lightweight mvnw shim: forward to system mvn if available
where mvn >nul 2>&1
if %ERRORLEVEL%==0 (
  mvn %*
) else (
  echo Maven not found on PATH. Install Maven or regenerate the Maven wrapper.
  exit /b 1
)
