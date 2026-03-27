[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "启动 AI协作开发系统" -ForegroundColor Cyan
Write-Host "=============================="

$ProjectDir = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectDir "backend"
$FrontendDir = Join-Path $ProjectDir "frontend"

Write-Host "检查环境..."
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Node.js 未安装" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js: $nodeVersion"

Write-Host ""
Write-Host "启动后端..."
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$BackendDir'; npm start" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "启动前端..."
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$FrontendDir'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "=============================="
Write-Host "服务已启动！" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址:"
Write-Host "  前端: http://localhost:3000"
Write-Host "  后端: http://localhost:4000"
Write-Host "=============================="

Write-Host ""
Read-Host "按 Enter 退出"