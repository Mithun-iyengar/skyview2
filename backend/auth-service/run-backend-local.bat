@echo off
REM Local Java wrapper for auth-service without requiring admin environment changes
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.9.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "%~dp0"
mvn spring-boot:run
