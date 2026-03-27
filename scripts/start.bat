chcp 65001
@echo off
echo [启动 AI协作开发系统]
echo.
cd /d "%~dp0\.."

echo [启动后端服务...]
start "后端服务" cmd /c "cd backend && npm start"

echo [启动前端服务...]
start "前端服务" cmd /c "cd frontend && npm run dev"

echo.
echo [服务已启动！]
echo 访问地址:
echo   前端: http://localhost:3000
echo   后端: http://localhost:4000
echo.
pause