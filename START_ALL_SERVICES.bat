@echo off
REM Skyline Airways - Quick Start Script for Windows

echo ========================================
echo Skyline Airways - Startup Script
echo ========================================
echo.
echo This will start all services in the correct order.
echo Make sure MySQL is running on localhost:3306
echo.

REM Check if MySQL is running
echo Checking MySQL connection...
if defined SKIP_MYSQL_CHECK (
    echo SKIP_MYSQL_CHECK is set - skipping MySQL availability check.
) else (
    goto :do_mysql_check
)
goto :after_mysql_check

:do_mysql_check
mysql -u root -p"root@39" -e "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: MySQL is not running on localhost:3306
    echo Please start MySQL and try again (or set SKIP_MYSQL_CHECK=1 to bypass check).
    pause
    exit /b 1
)
echo MySQL is running. Continuing...

:after_mysql_check
echo.

REM Start Eureka in a new window
echo Starting Eureka Service Registry (Port 8761)...
start "Eureka Registry" cmd /k "cd backend\service-registry && mvn -DskipTests clean package && mvn spring-boot:run"
timeout /t 5

REM Start Auth Service in a new window
echo Starting Auth Service (Port 8086)...
start "Auth Service" cmd /k "cd backend\auth-service && mvn -DskipTests clean package && mvn spring-boot:run"
timeout /t 10

REM Start Flight Service in a new window
echo Starting Flight Service (Port 8082)...
start "Flight Service" cmd /k "cd backend\flight-service && mvn -DskipTests clean package && mvn spring-boot:run"
timeout /t 10

REM Start API Gateway in a new window
set "API_GATEWAY_PORT=8080"
netstat -ano | findstr /R /C:":8080 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo Port 8080 is already in use. Starting API Gateway on port 8081 instead.
    set "API_GATEWAY_PORT=8081"
)
echo Starting API Gateway (Port %API_GATEWAY_PORT%)...
start "API Gateway" cmd /k "cd backend\api-gateway && set SERVER_PORT=%API_GATEWAY_PORT% && mvn -DskipTests clean package && mvn spring-boot:run"
timeout /t 5

REM Start Booking Service (uses mvnw if present)
echo Starting Booking Service (default port)...
if exist backend\booking-service\mvnw.cmd (
    start "Booking Service" cmd /k "cd backend\booking-service && .\mvnw.cmd -DskipTests spring-boot:run"
) else (
    start "Booking Service" cmd /k "cd backend\booking-service && mvn -DskipTests spring-boot:run"
)
timeout /t 5

REM Start Payment Service
echo Starting Payment Service...
start "Payment Service" cmd /k "cd backend\payment-service && mvn -DskipTests clean package && mvn spring-boot:run"
timeout /t 5

REM Start Frontend in a new window
echo Starting Frontend (Port 3000)...
start "Frontend" cmd /k "cd frontend && set API_GATEWAY_PORT=%API_GATEWAY_PORT% && npm install && npm run dev"

echo.
echo ========================================
echo All services are starting...
echo ========================================
echo.
echo Eureka Dashboard: http://localhost:8761
echo API Gateway: http://localhost:%API_GATEWAY_PORT%
echo Frontend: http://localhost:3000
echo.
echo Wait for all services to show "UP" in Eureka before making requests.
echo.
pause
