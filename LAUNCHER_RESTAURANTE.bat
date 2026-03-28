@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title Restaurante Escolar - Panel de Control
color 0F

:MENU
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════════╗
echo  ║                                                                  ║
echo  ║       SISTEMA DE RESTAURANTE ESCOLAR - PANEL DE CONTROL          ║
echo  ║                                                                  ║
echo  ╚══════════════════════════════════════════════════════════════════╝
echo.

:: Verificacion rapida
call :CHECK_SERVICES

echo  ESTADO ACTUAL:
echo  ────────────────────────────────────────────────────────────────────
if "!DB_OK!"=="YES" (
    echo    [OK] Base de Datos - MySQL: Activa
) else (
    echo    [!!] Base de Datos - MySQL: DESACTIVADA - Inicia XAMPP primero
)
if "!BE_OK!"=="YES" (
    echo    [OK] Servidor Backend:     En ejecucion (Puerto 5000^)
) else (
    echo    [--] Servidor Backend:     Detenido
)
if "!FE_OK!"=="YES" (
    echo    [OK] Servidor Frontend:    En ejecucion (Puerto 5173^)
) else (
    echo    [--] Servidor Frontend:    Detenido
)
echo  ────────────────────────────────────────────────────────────────────
echo.
echo  MENU DE ACCIONES:
echo.
echo    [1] INICIAR TODO (Backend + Frontend + Navegador^)
echo    [2] Detener todos los servicios
echo    [3] Verificar salud del sistema (Health Check^)
echo    [4] Herramientas (Puertos / Firewall / Reinstalar^)
echo    [5] Ver enlaces de red (LAN^)
echo    [0] Salir
echo.
set /p "opt=  Selecciona una opcion [0-5]: "

if "!opt!"=="1" goto START_ALL
if "!opt!"=="2" goto STOP_ALL
if "!opt!"=="3" goto HEALTH
if "!opt!"=="4" goto TOOLS
if "!opt!"=="5" goto NETWORK
if "!opt!"=="0" goto SALIR

echo.
echo  Opcion no valida. Intenta de nuevo...
timeout /t 2 /nobreak >nul
goto MENU

:: ═══════════════════════════════════════════════════════════════════════
::                          INICIAR SISTEMA
:: ═══════════════════════════════════════════════════════════════════════
:START_ALL
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════════╗
echo  ║              INICIANDO SISTEMA COMPLETO...                       ║
echo  ╚══════════════════════════════════════════════════════════════════╝
echo.

:: Validar MySQL primero
call :CHECK_SERVICES
if "!DB_OK!"=="NO" (
    echo  [!!] ERROR: MySQL de XAMPP no esta detectado.
    echo      Por favor, abre el panel de XAMPP e inicia MySQL.
    echo.
    echo  Presiona cualquier tecla para volver al menu...
    pause >nul
    goto MENU
)
echo  [OK] MySQL detectado.

:: Iniciar Backend
if "!BE_OK!"=="NO" (
    echo  [1/2] Iniciando Backend...
    cd /d "%~dp0backend"
    start "Backend - Restaurante Escolar" cmd /k "npm run dev"
    echo       Esperando que el Backend arranque...
    timeout /t 4 /nobreak >nul
) else (
    echo  [OK] Backend ya esta activo.
)

:: Iniciar Frontend
cd /d "%~dp0"
if "!FE_OK!"=="NO" (
    echo  [2/2] Iniciando Frontend...
    start "Frontend - Restaurante Escolar" cmd /k "npm run dev -- --host"
    echo       Esperando que el Frontend arranque...
    timeout /t 6 /nobreak >nul
) else (
    echo  [OK] Frontend ya esta activo.
)

echo.
echo  ════════════════════════════════════════════════════════════════════
echo   SISTEMA INICIADO EXITOSAMENTE
echo  ════════════════════════════════════════════════════════════════════
echo.
echo  Abriendo navegador en: http://localhost:5173
start "" http://localhost:5173
echo.
echo  Presiona cualquier tecla para volver al menu...
pause >nul
goto MENU

:: ═══════════════════════════════════════════════════════════════════════
::                          DETENER SISTEMA
:: ═══════════════════════════════════════════════════════════════════════
:STOP_ALL
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════════╗
echo  ║              DETENIENDO SERVICIOS...                             ║
echo  ╚══════════════════════════════════════════════════════════════════╝
echo.

echo  Cerrando ventanas de desarrollo...
taskkill /f /fi "WINDOWTITLE eq Frontend - Restaurante Escolar" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Backend - Restaurante Escolar" >nul 2>&1
timeout /t 1 /nobreak >nul

echo  Liberando puertos 5000 y 5173...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr "LISTENING" ^| findstr ":5173 "') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr "LISTENING" ^| findstr ":5000 "') do (
    taskkill /f /pid %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo.
echo  [OK] Servicios detenidos correctamente.
echo.
echo  Presiona cualquier tecla para volver al menu...
pause >nul
goto MENU

:: ═══════════════════════════════════════════════════════════════════════
::                           HEALTH CHECK
:: ═══════════════════════════════════════════════════════════════════════
:HEALTH
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════════╗
echo  ║              VERIFICANDO SALUD DEL SISTEMA...                    ║
echo  ╚══════════════════════════════════════════════════════════════════╝
echo.

:: Estado de XAMPP
echo  --- ESTADO DE XAMPP ---
tasklist /FI "IMAGENAME eq httpd.exe" 2>NUL | find /I "httpd.exe" >NUL
if "!ERRORLEVEL!"=="0" (
    echo  [OK] Apache: Ejecutandose
) else (
    echo  [!!] Apache: Detenido
)
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I "mysqld.exe" >NUL
if "!ERRORLEVEL!"=="0" (
    echo  [OK] MySQL:  Ejecutandose
) else (
    echo  [!!] MySQL:  Detenido
)

echo.
echo  --- ESTADO DE LA APLICACION ---
call :CHECK_SERVICES
if "!BE_OK!"=="YES" (
    echo  [OK] Backend:  Puerto 5000 activo
) else (
    echo  [--] Backend:  No detectado en puerto 5000
)
if "!FE_OK!"=="YES" (
    echo  [OK] Frontend: Puerto 5173 activo
) else (
    echo  [--] Frontend: No detectado en puerto 5173
)

echo.
echo  --- HEALTH CHECK DETALLADO (npm run health^) ---
echo.
cd /d "%~dp0backend"
call npm run health 2>nul
if "!ERRORLEVEL!" neq "0" (
    echo.
    echo  [!!] El health check reporto problemas. Revisa los mensajes arriba.
)

cd /d "%~dp0"
echo.
echo  Presiona cualquier tecla para volver al menu...
pause >nul
goto MENU

:: ═══════════════════════════════════════════════════════════════════════
::                          HERRAMIENTAS
:: ═══════════════════════════════════════════════════════════════════════
:TOOLS
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════════╗
echo  ║              HERRAMIENTAS DE REPARACION                          ║
echo  ╚══════════════════════════════════════════════════════════════════╝
echo.
echo    [1] Liberar puertos bloqueados (5000 y 5173^)
echo    [2] Configurar Firewall (Requiere Administrador^)
echo    [3] Re-instalar dependencias del Backend
echo    [4] Re-instalar dependencias del Frontend
echo    [0] Volver al menu principal
echo.
set /p "tool_opt=  Selecciona una herramienta [0-4]: "

if "!tool_opt!"=="1" (
    echo.
    echo  Liberando puertos...
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr "LISTENING" ^| findstr ":5173 "') do (
        echo  Cerrando proceso PID: %%a (puerto 5173^)
        taskkill /F /PID %%a >nul 2>&1
    )
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr "LISTENING" ^| findstr ":5000 "') do (
        echo  Cerrando proceso PID: %%a (puerto 5000^)
        taskkill /F /PID %%a >nul 2>&1
    )
    echo.
    echo  [OK] Puertos liberados.
    timeout /t 2 /nobreak >nul
    goto TOOLS
)
if "!tool_opt!"=="2" (
    echo.
    echo  Verificando permisos de administrador...
    net session >nul 2>&1
    if "!ERRORLEVEL!" neq "0" (
        echo  [!!] Se requieren permisos de administrador.
        echo      Cierra este archivo y abrelo con click derecho - Ejecutar como administrador
        echo.
        pause
        goto TOOLS
    )
    echo  Configurando reglas del Firewall...
    netsh advfirewall firewall delete rule name="Restaurante Escolar - Frontend" >nul 2>&1
    netsh advfirewall firewall delete rule name="Restaurante Escolar - Backend" >nul 2>&1
    netsh advfirewall firewall add rule name="Restaurante Escolar - Frontend" dir=in action=allow protocol=TCP localport=5173 >nul 2>&1
    netsh advfirewall firewall add rule name="Restaurante Escolar - Backend" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
    echo  [OK] Firewall configurado para puertos 5000 y 5173.
    echo.
    pause
    goto TOOLS
)
if "!tool_opt!"=="3" (
    echo.
    echo  Reinstalando dependencias del Backend...
    cd /d "%~dp0backend"
    call npm install
    cd /d "%~dp0"
    echo.
    echo  [OK] Dependencias del Backend reinstaladas.
    pause
    goto TOOLS
)
if "!tool_opt!"=="4" (
    echo.
    echo  Reinstalando dependencias del Frontend...
    cd /d "%~dp0"
    call npm install
    echo.
    echo  [OK] Dependencias del Frontend reinstaladas.
    pause
    goto TOOLS
)
if "!tool_opt!"=="0" goto MENU

echo  Opcion no valida.
timeout /t 2 /nobreak >nul
goto TOOLS

:: ═══════════════════════════════════════════════════════════════════════
::                          RED / LAN
:: ═══════════════════════════════════════════════════════════════════════
:NETWORK
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════════╗
echo  ║              INFORMACION DE RED (ACCESO LAN^)                     ║
echo  ╚══════════════════════════════════════════════════════════════════╝
echo.
echo  ENLACES LOCALES (solo desde esta computadora^):
echo    Sistema: http://localhost:5173
echo    API:     http://localhost:5000
echo.

echo  ENLACES DE RED (desde otros dispositivos^):
set "IP_FOUND=NO"
for /f "tokens=2 delims=:" %%a in ('ipconfig 2^>nul ^| findstr /C:"IPv4"') do (
    set "curr_ip=%%a"
    set "curr_ip=!curr_ip: =!"
    if not "!curr_ip!"=="127.0.0.1" (
        echo    Sistema: http://!curr_ip!:5173
        echo    API:     http://!curr_ip!:5000
        set "IP_FOUND=YES"
    )
)
if "!IP_FOUND!"=="NO" (
    echo    No se pudo detectar la IP de red local.
)

echo.
echo  NOTA: Para acceso desde otros dispositivos, configura el Firewall
echo        usando la opcion 4 del menu principal (Herramientas^).
echo.
echo  Presiona cualquier tecla para volver al menu...
pause >nul
goto MENU

:: ═══════════════════════════════════════════════════════════════════════
::                             SALIR
:: ═══════════════════════════════════════════════════════════════════════
:SALIR
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════════╗
echo  ║                        SALIENDO...                               ║
echo  ╚══════════════════════════════════════════════════════════════════╝
echo.

call :CHECK_SERVICES

if "!BE_OK!"=="YES" if "!FE_OK!"=="YES" (
    echo  ADVERTENCIA: El sistema sigue funcionando.
    echo.
    set /p "det=  Deseas detener los servicios antes de salir? [S/N]: "
    if /i "!det!"=="S" (
        echo.
        echo  Deteniendo servicios...
        taskkill /f /fi "WINDOWTITLE eq Frontend - Restaurante Escolar" >nul 2>&1
        taskkill /f /fi "WINDOWTITLE eq Backend - Restaurante Escolar" >nul 2>&1
        for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr "LISTENING" ^| findstr ":5173 "') do (
            taskkill /f /pid %%a >nul 2>&1
        )
        for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr "LISTENING" ^| findstr ":5000 "') do (
            taskkill /f /pid %%a >nul 2>&1
        )
        timeout /t 2 /nobreak >nul
        echo  [OK] Servicios detenidos.
    )
)

echo.
echo  Gracias por usar el Sistema de Restaurante Escolar!
echo.
timeout /t 2 /nobreak >nul
exit /b

:: ═══════════════════════════════════════════════════════════════════════
::                     FUNCIONES AUXILIARES
:: ═══════════════════════════════════════════════════════════════════════
:CHECK_SERVICES
set "DB_OK=NO"
set "BE_OK=NO"
set "FE_OK=NO"

:: Validar MySQL
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I "mysqld.exe" >NUL 2>&1
if "!ERRORLEVEL!"=="0" set "DB_OK=YES"

:: Validar Backend (puerto 5000)
netstat -aon 2>nul | findstr "LISTENING" | findstr ":5000 " >nul 2>&1
if "!ERRORLEVEL!"=="0" set "BE_OK=YES"

:: Validar Frontend (puerto 5173)
netstat -aon 2>nul | findstr "LISTENING" | findstr ":5173 " >nul 2>&1
if "!ERRORLEVEL!"=="0" set "FE_OK=YES"

goto :eof