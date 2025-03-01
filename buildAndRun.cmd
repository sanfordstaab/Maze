@echo off
echo Stopping any running server or client processes...

:: Kill any process using port 3001 (server)
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":3001"') DO (
    echo Killing process with PID: %%P
    taskkill /F /PID %%P 2>nul
    if errorlevel 1 (
        echo Failed to kill process on port 3001
    ) else (
        echo Successfully killed process on port 3001
    )
)

:: Kill any process using port 3000 (client)
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":3000"') DO (
    echo Killing process with PID: %%P
    taskkill /F /PID %%P 2>nul
    if errorlevel 1 (
        echo Failed to kill process on port 3000
    ) else (
        echo Successfully killed process on port 3000
    )
)

:: Add a short delay to ensure ports are released
echo Waiting for ports to be released...
timeout /t 2 /nobreak > nul

echo Installing and starting server...
cd server
call npm install
call npm run build
start cmd /k npm run dev

echo Installing and starting client...
cd ../client
call npm install
start cmd /k npm start

cd ..
echo Both server and client have been started in separate windows.
echo You can access the application at http://localhost:3000