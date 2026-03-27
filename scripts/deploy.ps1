[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "AI协作开发系统 - 部署脚本" -ForegroundColor Cyan
Write-Host "=============================="
Write-Host ""

$ProjectDir = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectDir "backend"
$FrontendDir = Join-Path $ProjectDir "frontend"

Write-Host "项目: $ProjectDir"

Write-Host ""
Write-Host "检查环境..."
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Node.js 未安装" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js: $nodeVersion"

# 后端
Write-Host ""
Write-Host "部署后端..."
Set-Location $BackendDir

$envFile = Join-Path $BackendDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "创建配置..."
    @"
NODE_ENV=development
PORT=4000
HOST=localhost
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=ai-collaboration-secret-key
JWT_EXPIRES_IN=7d
DATABASE_URL=sqlite://./data/collaboration.db
"@ | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "配置已创建"
}

@("data", "uploads", "logs") | ForEach-Object {
    $p = Join-Path $BackendDir $_
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
}

$nodeModules = Join-Path $BackendDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "安装依赖..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "安装完成"
} else {
    Write-Host "依赖已存在"
}

# 前端
Write-Host ""
Write-Host "部署前端..."
Set-Location $FrontendDir

$envFile = Join-Path $FrontendDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "创建配置..."
    @"
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:8080
"@ | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "配置已创建"
}

$nodeModules = Join-Path $FrontendDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "安装依赖..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "安装完成"
} else {
    Write-Host "依赖已存在"
}

Set-Location $ProjectDir

Write-Host ""
Write-Host "=============================="
Write-Host "部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "启动命令:"
Write-Host "  后端: cd backend; npm start"
Write-Host "  前端: cd frontend; npm run dev"
Write-Host "  一键启动: scripts\start.bat"
Write-Host ""
Write-Host "访问地址:"
Write-Host "  前端: http://localhost:3000"
Write-Host "  后端: http://localhost:4000"
Write-Host "=============================="

Write-Host ""
$resp = Read-Host "立即启动? (Y/n)"
if ($resp -eq '' -or $resp -eq 'Y' -or $resp -eq 'y') {
    & "$PSScriptRoot\start.ps1"
}