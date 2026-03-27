#!/bin/bash

# AI协作开发系统 - 一键启动脚本

echo "🚀 启动 AI协作开发系统 v2.0"
echo "=================================="

PROJECT_DIR="/D/ai-collaboration-system"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# 检查依赖
check_dependencies() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir/node_modules" ]; then
        echo "❌ $name 依赖未安装，请先运行 ./deploy.sh"
        return 1
    fi
    return 0
}

# 检查后端依赖
check_dependencies $BACKEND_DIR "后端" || exit 1

# 检查前端依赖
check_dependencies $FRONTEND_DIR "前端" || exit 1

# 启动后端
echo "📦 启动后端服务..."
cd $BACKEND_DIR
if [ ! -f .env ]; then
    echo "⚠️ 后端 .env 文件不存在，使用默认配置"
fi

# 在后台启动后端
nohup npm start > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo "   日志: tail -f $PROJECT_DIR/backend.log"
echo "   地址: http://localhost:4000"

# 等待后端启动
sleep 3

# 启动前端
echo ""
echo "📦 启动前端应用..."
cd $FRONTEND_DIR

# 在后台启动前端
nohup npm run dev > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端应用已启动 (PID: $FRONTEND_PID)"
echo "   日志: tail -f $PROJECT_DIR/frontend.log"
echo "   地址: http://localhost:3000"

echo ""
echo "=================================="
echo "✅ 所有服务已启动！"
echo ""
echo "🌐 访问地址:"
echo "   前端界面: http://localhost:3000"
echo "   后端 API: http://localhost:4000"
echo ""
echo "📋 常用命令:"
echo "   查看后端日志: tail -f $PROJECT_DIR/backend.log"
echo "   查看前端日志: tail -f $PROJECT_DIR/frontend.log"
echo "   停止后端: kill $BACKEND_PID"
echo "   停止前端: kill $FRONTEND_PID"
echo "=================================="

# 保存 PID
echo "$BACKEND_PID $FRONTEND_PID" > "$PROJECT_DIR/.pids"

# 等待几秒钟后检查服务状态
sleep 2
echo ""
echo "🔍 检查服务状态..."
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ 后端服务健康检查通过"
else
    echo "⚠️ 后端服务启动中，请稍后检查日志"
fi
