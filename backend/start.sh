#!/bin/bash

# 🚀 AI协作开发系统 v2.0 - 启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 输出带颜色的消息
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境
check_environment() {
    log_info "检查环境..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        return 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        return 1
    fi
    
    # 检查Node.js版本
    NODE_VERSION=$(node -v | cut -d 'v' -f 2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d '.' -f 1)
    
    if [ $NODE_MAJOR -lt 18 ]; then
        log_warning "Node.js 版本 $NODE_VERSION 低于推荐版本 18+"
    fi
    
    log_success "环境检查通过"
    return 0
}

# 安装依赖
install_dependencies() {
    log_info "安装依赖..."
    
    if [ -f "package-lock.json" ] || [ -f "yarn.lock" ]; then
        log_info "检测到 lock 文件，跳过安装"
        return 0
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        log_success "依赖安装完成"
        return 0
    else
        log_error "依赖安装失败"
        return 1
    fi
}

# 创建目录结构
create_directories() {
    log_info "创建目录结构..."
    
    local dirs=(
        "data"
        "data/projects"
        "data/sessions"
        "uploads"
        "uploads/files"
        "uploads/avatars"
        "logs"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "创建目录: $dir"
        fi
    done
    
    log_success "目录结构创建完成"
}

# 复制配置文件
setup_config() {
    log_info "设置配置文件..."
    
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        cp .env.example .env
        log_info "已复制 .env.example 到 .env"
        log_warning "请编辑 .env 文件配置您的设置"
    fi
    
    log_success "配置文件设置完成"
}

# 启动开发服务器
start_development() {
    log_info "启动开发服务器..."
    
    export NODE_ENV=development
    
    # 使用nodemon（如果已安装）
    if command -v nodemon &> /dev/null || [ -f "node_modules/.bin/nodemon" ]; then
        log_info "使用 nodemon 启动..."
        npx nodemon src/server.js
    else
        log_info "使用 node 启动..."
        node src/server.js
    fi
}

# 启动生产服务器
start_production() {
    log_info "启动生产服务器..."
    
    export NODE_ENV=production
    
    # 构建（如果有需要）
    if [ -f "package.json" ] && grep -q "\"build\"" package.json; then
        log_info "构建项目..."
        npm run build
    fi
    
    # 启动服务器
    node src/server.js
}

# 显示帮助
show_help() {
    echo "AI协作开发系统 v2.0 - 启动脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  dev      启动开发服务器（默认）"
    echo "  prod     启动生产服务器"
    echo "  install  安装依赖并设置环境"
    echo "  setup    仅设置环境（不安装依赖）"
    echo "  check    检查环境"
    echo "  help     显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 dev       # 启动开发服务器"
    echo "  $0 prod      # 启动生产服务器"
    echo "  $0 install   # 安装依赖并设置环境"
    echo ""
}

# 主函数
main() {
    local command=${1:-"dev"}
    
    case $command in
        "dev")
            check_environment || exit 1
            install_dependencies
            create_directories
            setup_config
            start_development
            ;;
        "prod")
            check_environment || exit 1
            install_dependencies
            create_directories
            setup_config
            start_production
            ;;
        "install")
            check_environment || exit 1
            install_dependencies
            create_directories
            setup_config
            log_success "安装完成"
            ;;
        "setup")
            create_directories
            setup_config
            log_success "环境设置完成"
            ;;
        "check")
            check_environment
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"