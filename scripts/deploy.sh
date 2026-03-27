#!/bin/bash

# AI协作开发系统部署脚本

echo "🚀 AI协作开发系统 v2.0 - 部署脚本"
echo "=================================="

# 项目路径
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "项目路径: $PROJECT_DIR"

# 检查 Node.js
echo "📋 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js 版本: $NODE_VERSION"

# 部署后端
echo ""
echo "📦 部署后端服务..."
cd $BACKEND_DIR

# 检查并创建 .env 文件
if [ ! -f .env ]; then
    echo "📝 创建后端环境配置文件..."
    cat > .env << 'EOF'
# 服务器配置
NODE_ENV=development
PORT=4000
HOST=localhost
CORS_ORIGIN=http://localhost:3000

# 安全配置
JWT_SECRET=ai-collaboration-secret-key
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
SESSION_SECRET=session-secret

# 数据库配置
DATABASE_URL=sqlite://./data/collaboration.db
DATABASE_PATH=./data/collaboration.db

# 文件存储
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# AI配置
AI_AGENT_COUNT=4
AI_MAX_CONCURRENT_TASKS=3
AI_TASK_TIMEOUT_MS=300000
EOF
    echo "✅ .env 文件已创建"
else
    echo "⚠️ .env 文件已存在，跳过创建"
fi

# 创建必要目录
mkdir -p data/projects data/sessions uploads/files uploads/avatars logs

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install --no-audit --no-fund
    if [ $? -eq 0 ]; then
        echo "✅ 后端依赖安装完成"
    else
        echo "❌ 后端依赖安装失败"
        exit 1
    fi
else
    echo "⚠️ node_modules 已存在，跳过安装"
fi

# 部署前端
echo ""
echo "📦 部署前端应用..."
cd $FRONTEND_DIR

# 检查并创建 .env 文件
if [ ! -f .env ]; then
    echo "📝 创建前端环境配置文件..."
    cat > .env << 'EOF'
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:8080
VITE_APP_NAME="AI协作开发系统 v2.0"
VITE_APP_VERSION="2.0.0-alpha"
VITE_ENVIRONMENT="development"
VITE_DEBUG="true"
EOF
    echo "✅ .env 文件已创建"
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install --no-audit --no-fund
    if [ $? -eq 0 ]; then
        echo "✅ 前端依赖安装完成"
    else
        echo "❌ 前端依赖安装失败"
        exit 1
    fi
else
    echo "⚠️ node_modules 已存在，跳过安装"
fi

echo ""
echo "=================================="
echo "✅ 部署完成！"
echo ""
echo "📋 启动命令:"
echo "  后端: cd $BACKEND_DIR && npm start"
echo "  前端: cd $FRONTEND_DIR && npm run dev"
echo ""
echo "🌐 访问地址:"
echo "  前端: http://localhost:3000"
echo "  后端 API: http://localhost:4000"
echo "=================================="
