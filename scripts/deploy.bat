chcp 65001
@echo off
echo [AI协作开发系统 - 部署脚本]
echo ==============================
echo.

cd /d "%~dp0\.."
echo 项目路径: %CD%

echo [检查环境...]
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Node.js 未安装
    exit /b 1
)
node --version

echo.
echo [部署后端...]
cd backend

if not exist .env (
    echo [创建后端配置...]
    (
        echo NODE_ENV=development
        echo PORT=4000
        echo HOST=localhost
        echo CORS_ORIGIN=http://localhost:3000
        echo JWT_SECRET=ai-collaboration-secret-key
        echo JWT_EXPIRES_IN=7d
        echo DATABASE_URL=sqlite://./data/collaboration.db
    ) > .env
    echo [配置已创建]
)

if not exist data mkdir data
if not exist uploads mkdir uploads
if not exist logs mkdir logs

if not exist node_modules (
    echo [安装后端依赖...]
    call npm install
    if errorlevel 1 (
        echo [错误] 安装失败
        exit /b 1
    )
    echo [安装完成]
) else (
    echo [依赖已存在]
)

cd ..

echo.
echo [部署前端...]
cd frontend

if not exist .env (
    echo [创建前端配置...]
    (
        echo VITE_API_URL=http://localhost:4000
        echo VITE_WS_URL=ws://localhost:8080
    ) > .env
    echo [配置已创建]
)

if not exist node_modules (
    echo [安装前端依赖...]
    call npm install
    if errorlevel 1 (
        echo [错误] 安装失败
        exit /b 1
    )
    echo [安装完成]
) else (
    echo [依赖已存在]
)

cd ..

echo.
echo ==============================
echo [部署完成！]
echo.
echo 启动命令:
echo   后端: cd backend ^&^& npm start
echo   前端: cd frontend ^&^& npm run dev
echo   一键启动: scripts\start.bat
echo.
echo 访问地址:
echo   前端: http://localhost:3000
echo   后端: http://localhost:4000
echo ==============================
echo.
pause