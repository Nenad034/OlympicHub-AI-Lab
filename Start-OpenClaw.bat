@echo off
echo ==========================================================
echo    Olympic Hub - OpenClaw AI Agent Launcher
echo ==========================================================
echo.
echo Provera Docker okruzenja...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo GRESKA: Docker nije instaliran ili nije pokrenut!
    echo Molim vas instalirajte Docker Desktop sa: https://www.docker.com/products/docker-desktop/
    pause
    exit /b
)

echo.
echo Pokretanje OpenClaw kontejnera...
docker compose up -d

if %errorlevel% equ 0 (
    echo.
    echo [USPEH] OpenClaw je uspesno pokrenut u pozadini!
    echo.
    echo Portovi: 
    echo - Gateway: http://localhost:18789
    echo - Bridge: http://localhost:18790
    echo.
    echo Mozete kopirati ovaj fajl na DESKTOP za brzi pristup.
) else (
    echo.
    echo [GRESKA] Doslo je do problema prilikom pokretanja kontejnera.
)

echo.
pause
