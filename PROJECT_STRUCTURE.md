# 🏗️ AI协作系统项目结构

## 📁 项目目录结构

```
ai-collaboration-system/
├── 📚 docs/                           # 项目文档
│   ├── DEVELOPMENT_PROGRESS.md       # 开发进度报告
│   └── FRONTEND_PLAN.md              # 前端开发计划
├── ⚙️ backend/                        # 后端服务
│   ├── package.json                  # 依赖配置
│   ├── .env.example                  # 环境变量示例
│   └── src/                          # 源代码
│       ├── collaboration-engine.js   # 协作引擎核心
│       ├── task-orchestrator.js      # 任务编排器
│       ├── communication-manager.js  # 通信管理器
│       └── server.js                 # 主服务器
├── 🎨 frontend/                       # 前端界面
│   ├── React + TypeScript 应用
│   └── Material-UI 组件库
└── 📄 PROJECT_README.md              # 项目详细说明
```

## 🚀 快速开始

### 后端启动
```bash
cd backend
npm install
npm start
```

### 前端启动  
```bash
cd frontend
npm install
npm run dev
```

## 📊 系统功能

### 核心模块
1. **协作引擎** - 多AI会话管理
2. **任务编排** - 智能任务分配
3. **通信管理** - AI间实时通信
4. **质量保证** - 代码质量检查

### 技术栈
- **后端**: Node.js, Express, Socket.IO
- **前端**: React, TypeScript, Material-UI
- **数据库**: SQLite/PostgreSQL
- **部署**: Docker, GitHub Actions

## 🔗 相关链接

- [GitHub仓库](https://github.com/StoneJay369963/ai-collaboration-system)
- [开发文档](/docs)
- [API接口](/docs/API.md)

---
*项目创建时间: $(date)*
