@echo off
setlocal
cd /d "%~dp0backend"
echo.
echo Iniciando API MVP da Nodere em http://localhost:3333
echo.
if not exist ".env" (
  copy "..\.env.mvp.example" ".env" >nul
  echo Arquivo backend\.env criado a partir do modelo.
  echo Preencha SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_MAPS_API_KEY e OPENAI_API_KEY antes de usar dados reais.
  echo.
)
if not exist "node_modules" (
  echo Instalando dependencias do backend. Isso pode levar alguns minutos.
  call npm install
)
call npm run dev
pause
