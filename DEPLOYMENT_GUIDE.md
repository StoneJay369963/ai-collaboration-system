# 🚀 AI协作开发系统 - 部署指南

## 📋 修复总结

本次部署修复了以下问题：

### 1. 前端构建工具冲突 (已修复)
- **问题**: `package.json` 使用 react-scripts，但存在 `vite.config.ts`
- **修复**: 更新 `package.json` 为 Vite 配置，统一使用 Vite 作为构建工具

### 2. 缺少核心文件 (已修复)
- **问题**: 缺少 Redux store、theme、样式等核心文件
- **修复**: 创建了以下文件：
  - `src/store/store.ts` - Redux store 配置
  - `src/store/slices/*.ts` - 各模块状态管理
  - `src/theme.ts` - MUI 主题配置
  - `src/index.css` - 全局样式
  - `index.html` - Vite 入口文件
  - `tsconfig.json` - TypeScript 配置

### 3. 依赖版本更新 (已修复)
- **问题**: 部分依赖版本过旧或类型不匹配
- **修复**: 更新了 package.json 中的依赖版本

---

## 🛠️ 部署步骤

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 配置后端环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置必要配置
```

### 3. 安装前端依赖

```bash
cd frontend
npm install
```

### 4. 启动服务

**方式一：分别启动**

```bash
# 终端 1 - 启动后端
cd backend
npm start

# 终端 2 - 启动前端
cd frontend
npm run dev
```

**方式二：使用一键启动脚本**

```bash
chmod +x start-all.sh
./start-all.sh
```

---

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端界面 | http://localhost:3000 | React + Vite 应用 |
| 后端 API | http://localhost:4000 | Express.js API |
| WebSocket | ws://localhost:8080 | Socket.io 实时通信 |

---

## 📁 项目结构

```
ai-collaboration-system/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── server.js       # 主服务器
│   │   ├── collaboration-engine.js  # 协作引擎
│   │   ├── communication-manager.js # 通信管理器
│   │   ├── task-orchestrator.js     # 任务编排器
│   │   ├── quality-assurance.js     # 质量保证
│   │   ├── config/         # 配置文件
│   │   └── services/       # 服务层
│   ├── package.json
│   ├── .env.example
│   └── start.sh
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── App.tsx        # 主应用组件
│   │   ├── main.tsx       # 入口文件
│   │   ├── store/         # Redux store
│   │   ├── components/    # 通用组件
│   │   ├── features/      # 功能模块
│   │   ├── services/      # API 服务
│   │   ├── theme.ts       # 主题配置
│   │   └── index.css      # 全局样式
│   ├── package.json
│   ├── vite.config.ts     # Vite 配置
│   ├── tsconfig.json      # TypeScript 配置
│   └── index.html         # 入口 HTML
├── deploy.sh              # 部署脚本
├── start-all.sh           # 一键启动脚本
└── README.md              # 项目说明
```

---

## 🔧 配置说明

### 后端环境变量 (.env)

```bash
# 服务器配置
PORT=4000
NODE_ENV=development

# 数据库
DATABASE_PATH=./data/collaboration.db

# 安全配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# WebSocket
WS_PORT=8080
```

### 前端环境变量 (.env)

```bash
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:8080
```

---

## 📝 开发计划

根据项目文档，当前进度：

- ✅ 协作引擎 (100%)
- ✅ 通信管理器 (100%)
- ✅ 任务编排器 (100%)
- ✅ 主服务器 (100%)
- ✅ 前端基础架构 (100%)
- 🔄 前端页面开发 (进行中)
- ⏳ 测试覆盖
- ⏳ 性能优化

---

## 🐛 已知问题

1. **前端页面**: 部分 features 目录下的页面组件可能需要根据实际业务逻辑进一步完善
2. **API 集成**: 当前使用 mock 数据，需要接入真实后端 API
3. **WebSocket**: 需要验证实时通信功能

---

## 📞 支持

如有问题，请参考：
- 项目 README: `/home/gem/workspace/ai-collaboration-system/README.md`
- 开发进度: `/home/gem/workspace/ai-collaboration-system/DEVELOPMENT_PROGRESS.md`
- 前端计划: `/home/gem/workspace/ai-collaboration-system/FRONTEND_DEVELOPMENT_PLAN.md`
