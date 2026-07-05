@echo off
echo ============================================================
echo  Compass - PostgreSQL Password Reset
echo ============================================================
echo.
echo Running as: %USERNAME%
echo.

REM Step 1: Stop PostgreSQL service
echo [1/4] Stopping PostgreSQL service...
net stop postgresql-x64-18
if %errorlevel% neq 0 (
    echo [!] Could not stop service. You need Administrator rights.
    echo     Right-click this file and select "Run as Administrator"
    pause
    exit /b 1
)

REM Step 2: Temporarily set trust authentication
echo [2/4] Setting temporary trust authentication...
cd "C:\Program Files\PostgreSQL\18\data"
copy pg_hba.conf pg_hba.conf.bak /Y >nul
REM Replace scram-sha-256 with trust for local connections
powershell -Command "(Get-Content pg_hba.conf) -replace 'scram-sha-256', 'trust' | Set-Content pg_hba.conf"

REM Step 3: Start PostgreSQL and set passwords
echo [3/4] Starting PostgreSQL...
net start postgresql-x64-18

REM Wait for service to fully start
timeout /t 3 /nobreak >nul

cd "C:\Program Files\PostgreSQL\18\bin"

echo Setting postgres superuser password...
psql.exe -U postgres -c "ALTER USER postgres WITH PASSWORD 'compass_dev';"

echo Creating timelog user...
psql.exe -U postgres -c "CREATE USER timelog WITH PASSWORD 'timelog123';"

echo Creating compass database...
psql.exe -U postgres -c "CREATE DATABASE compass OWNER timelog;"

echo Granting privileges...
psql.exe -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE compass TO timelog;"

REM Step 4: Restore secure authentication
echo [4/4] Restoring scram-sha-256 authentication...
net stop postgresql-x64-18
cd "C:\Program Files\PostgreSQL\18\data"
copy pg_hba.conf.bak pg_hba.conf /Y >nul
net start postgresql-x64-18

echo.
echo ============================================================
echo  DONE! PostgreSQL is configured.
echo  Superuser: postgres / compass_dev
echo  App user:   timelog / timelog123
echo  Database:   compass
echo ============================================================
pause
