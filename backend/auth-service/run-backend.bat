@echo off
REM Set JAVA_HOME to Microsoft JDK installation
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.9.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

REM Verify Java is set correctly
echo Verifying Java installation...
java -version

REM Run Maven clean install
echo Building backend...
mvn clean install -DskipTests

REM Run Spring Boot application
echo Starting Spring Boot application...
mvn spring-boot:run

pause
