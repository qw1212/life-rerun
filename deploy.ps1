#Requires -Version 5.1
$ErrorActionPreference = "Stop"

Write-Host "🌱 Life Rerun 部署脚本（Windows）" -ForegroundColor Green

# 检查环境变量
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env 文件不存在，请复制 .env.example 并配置 API Key" -ForegroundColor Yellow
    exit 1
}

# 安装依赖
Write-Host "📦 安装依赖..." -ForegroundColor Cyan
npm install

# 清理 Vite 缓存，避免构建卡在 transforming
Write-Host "🧹 清理 Vite 缓存..." -ForegroundColor Cyan
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps/web/node_modules/.vite

# 类型检查与构建
Write-Host "🔍 类型检查..." -ForegroundColor Cyan
npm run typecheck

Write-Host "🧹 代码检查..." -ForegroundColor Cyan
npm run lint

Write-Host "🧪 运行测试..." -ForegroundColor Cyan
npm run test

Write-Host "🏗️  构建..." -ForegroundColor Cyan
npm run build

# Docker 部署：新版 Docker Desktop 已内置 compose 子命令，旧环境仍是独立命令
Write-Host "🐳 启动 Docker Compose..." -ForegroundColor Cyan
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    docker-compose down
    docker-compose up --build -d
} else {
    docker compose down
    docker compose up --build -d
}

Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "🌐 访问 http://localhost"
Write-Host "🔧 后端 API http://localhost/api"
