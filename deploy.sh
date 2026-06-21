#!/usr/bin/env bash
set -e

echo "🌱 Life Rerun 部署脚本"

# 检查环境变量
if [ ! -f .env ]; then
  echo "⚠️  .env 文件不存在，请复制 .env.example 并配置 API Key"
  exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 清理 Vite 缓存，避免构建卡在 transforming
echo "🧹 清理 Vite 缓存..."
rm -rf apps/web/node_modules/.vite

# 类型检查与构建
echo "🔍 类型检查..."
npm run typecheck

echo "🧹 代码检查..."
npm run lint

echo "🏗️  构建..."
npm run build

# Docker 部署
echo "🐳 启动 Docker Compose..."
docker-compose down
docker-compose up --build -d

echo "✅ 部署完成！"
echo "🌐 访问 http://localhost"
echo "🔧 后端 API http://localhost:3001"
