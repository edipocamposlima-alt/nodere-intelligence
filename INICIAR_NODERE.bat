@echo off
setlocal
cd /d "%~dp0"
echo.
echo Iniciando Nodere Intelligence em http://localhost:4173
echo Feche esta janela para parar o servidor local.
echo.
start "" "http://localhost:4173"
where node >nul 2>nul
if not errorlevel 1 (
  node serve-nodere.mjs
  goto :end
)
set BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe
if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" serve-nodere.mjs
  goto :end
)
echo.
echo Node nao encontrado. Abrindo index.html diretamente.
start "" "%~dp0index.html"
:end
pause
