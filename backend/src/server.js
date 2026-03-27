#!/usr/bin/env node

/**
 * 🚀 AI协作开发系统 v2.0 - 主服务器
 * 
 * 启动所有核心服务：协作引擎、通信管理器、任务编排器、API服务器
 */

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// 核心模块
const CollaborationEngine = require('./collaboration-engine');
const CommunicationManager = require('./communication-manager');
const TaskOrchestrator = require('./task-orchestrator');

class AICollaborationServer {
  constructor(config = {}) {
    this.config = {
      port: config.port || 4000,
      wsPort: config.wsPort || 8080,
      dataPath: config.dataPath || './data',
      uploadPath: config.uploadPath || './uploads',
      logPath: config.logPath || './logs',
      ...config
    };
    
    // Express应用
    this.app = express();
    this.server = http.createServer(this.app);
    
    // 核心服务
    this.collaborationEngine = null;
    this.communicationManager = null;
    this.taskOrchestrator = null;
    
    // 状态
    this.isRunning = false;
    this.startTime = null;
    
    // 初始化
    this.initialize();
  }
  
  /**
   * 初始化服务器
   */
  async initialize() {
    console.log('🚀 AI协作开发系统 v2.0 初始化...');
    
    try {
      // 确保目录存在
      await this.ensureDirectories();
      
      // 配置中间件
      this.configureMiddleware();
      
      // 配置路由
      this.configureRoutes();
      
      // 初始化核心服务
      await this.initializeServices();
      
      // 配置WebSocket
      this.configureWebSocket();
      
      // 错误处理
      this.configureErrorHandling();
      
      console.log('✅ 服务器初始化完成');
      
    } catch (error) {
      console.error(`❌ 服务器初始化失败: ${error.message}`);
      process.exit(1);
    }
  }
  
  /**
   * 确保目录存在
   */
  async ensureDirectories() {
    const directories = [
      this.config.dataPath,
      this.config.uploadPath,
      this.config.logPath,
      path.join(this.config.dataPath, 'projects'),
      path.join(this.config.dataPath, 'sessions'),
      path.join(this.config.uploadPath, 'files'),
      path.join(this.config.uploadPath, 'avatars')
    ];
    
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 目录创建: ${dir}`);
      } catch (error) {
        console.warn(`⚠️ 创建目录失败 ${dir}: ${error.message}`);
      }
    }
  }
  
  /**
   * 配置中间件
   */
  configureMiddleware() {
    // 基础中间件
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      
      next();
    });
    
    // 请求日志
    this.app.use((req, res, next) => {
      const start = Date.now();
      const requestId = uuidv4();
      
      // 添加请求ID
      req.requestId = requestId;
      
      // 记录请求开始
      console.log(`📥 ${req.method} ${req.path} [${requestId}]`);
      
      // 记录响应完成
      res.on('finish', () => {
        const duration = Date.now() - start;
        const statusColor = res.statusCode >= 400 ? '❌' : '✅';
        console.log(`${statusColor} ${req.method} ${req.path} ${res.statusCode} - ${duration}ms [${requestId}]`);
      });
      
      next();
    });
    
    // 静态文件服务
    this.app.use('/uploads', express.static(this.config.uploadPath));
    this.app.use('/docs', express.static(path.join(__dirname, '../docs')));
  }
  
  /**
   * 配置路由
   */
  configureRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        version: '2.0.0',
        uptime: this.getUptime(),
        timestamp: new Date().toISOString()
      });
    });
    
    // 系统信息
    this.app.get('/api/system', (req, res) => {
      res.json(this.getSystemInfo());
    });
    
    // 协作引擎API
    this.app.post('/api/sessions', (req, res) => {
      this.handleCreateSession(req, res);
    });
    
    this.app.get('/api/sessions/:id', (req, res) => {
      this.handleGetSession(req, res);
    });
    
    this.app.post('/api/sessions/:id/join', (req, res) => {
      this.handleJoinSession(req, res);
    });
    
    // 任务API
    this.app.post('/api/tasks', (req, res) => {
      this.handleCreateTask(req, res);
    });
    
    this.app.get('/api/tasks/:id', (req, res) => {
      this.handleGetTask(req, res);
    });
    
    this.app.post('/api/tasks/:id/assign', (req, res) => {
      this.handleAssignTask(req, res);
    });
    
    this.app.post('/api/tasks/:id/complete', (req, res) => {
      this.handleCompleteTask(req, res);
    });
    
    // AI代理API
    this.app.get('/api/agents', (req, res) => {
      this.handleGetAgents(req, res);
    });
    
    this.app.post('/api/agents/register', (req, res) => {
      this.handleRegisterAgent(req, res);
    });
    
    // 知识库API
    this.app.get('/api/knowledge', (req, res) => {
      this.handleSearchKnowledge(req, res);
    });
    
    this.app.post('/api/knowledge', (req, res) => {
      this.handleAddKnowledge(req, res);
    });
    
    // 文件上传
    this.app.post('/api/upload', (req, res) => {
      this.handleFileUpload(req, res);
    });
    
    // 默认路由
    this.app.get('*', (req, res) => {
      res.json({
        message: 'AI协作开发系统 v2.0 API',
        version: '2.0.0',
        endpoints: {
          system: '/api/system',
          sessions: '/api/sessions',
          tasks: '/api/tasks',
          agents: '/api/agents',
          knowledge: '/api/knowledge',
          upload: '/api/upload',
          websocket: `ws://localhost:${this.config.wsPort}`
        }
      });
    });
  }
  
  /**
   * 初始化核心服务
   */
  async initializeServices() {
    console.log('🔧 初始化核心服务...');
    
    // 1. 协作引擎
    this.collaborationEngine = new CollaborationEngine({
      maxSessions: 100,
      maxAgentsPerSession: 10
    });
    
    // 2. 通信管理器
    this.communicationManager = new CommunicationManager({
      port: this.config.wsPort,
      uploadPath: this.config.uploadPath
    });
    
    // 3. 任务编排器
    this.taskOrchestrator = new TaskOrchestrator({
      maxConcurrentTasks: 50,
      taskTimeout: 30 * 60 * 1000
    });
    
    // 设置服务间事件转发
    this.setupEventForwarding();
    
    console.log('✅ 核心服务初始化完成');
  }
  
  /**
   * 设置事件转发
   */
  setupEventForwarding() {
    // 协作引擎事件转发
    this.collaborationEngine.on('session_created', (data) => {
      this.communicationManager.emit('session_created', data);
    });
    
    this.collaborationEngine.on('task_assigned', (data) => {
      this.communicationManager.emit('task_assigned', data);
      this.taskOrchestrator.emit('task_assigned', data);
    });
    
    this.collaborationEngine.on('task_completed', (data) => {
      this.communicationManager.emit('task_completed', data);
      this.taskOrchestrator.emit('task_completed', data);
    });
    
    // 通信管理器事件转发
    this.communicationManager.on('chat_message', (data) => {
      this.collaborationEngine.emit('chat_message', data);
    });
    
    this.communicationManager.on('code_change', (data) => {
      this.collaborationEngine.emit('code_change', data);
    });
    
    // 任务编排器事件转发
    this.taskOrchestrator.on('task_ready', (data) => {
      this.collaborationEngine.emit('task_ready', data);
    });
    
    this.taskOrchestrator.on('task_failed', (data) => {
      this.collaborationEngine.emit('task_failed', data);
      this.communicationManager.emit('task_failed', data);
    });
  }
  
  /**
   * 配置WebSocket
   */
  configureWebSocket() {
    // 启动WebSocket服务器
    this.communicationManager.start(this.server);
    
    console.log(`📡 WebSocket服务器启动在端口 ${this.config.wsPort}`);
  }
  
  /**
   * 配置错误处理
   */
  configureErrorHandling() {
    // 404处理
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `路由 ${req.method} ${req.path} 不存在`,
        requestId: req.requestId
      });
    });
    
    // 错误处理中间件
    this.app.use((error, req, res, next) => {
      console.error(`❌ 服务器错误 [${req.requestId}]:`, error);
      
      res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: error.message || '服务器内部错误',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  /**
   * 处理创建会话
   */
  async handleCreateSession(req, res) {
    try {
      const { projectId, agents, options } = req.body;
      
      if (!projectId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'projectId 是必需的'
        });
      }
      
      const session = this.collaborationEngine.createSession(projectId, options);
      
      // 如果有指定代理，让他们加入会话
      if (agents && Array.isArray(agents)) {
        for (const agentId of agents) {
          try {
            this.collaborationEngine.joinSession(session.id, agentId);
          } catch (error) {
            console.warn(`⚠️ 代理 ${agentId} 加入会话失败: ${error.message}`);
          }
        }
      }
      
      res.json({
        success: true,
        session,
        message: '会话创建成功'
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 处理获取会话
   */
  async handleGetSession(req, res) {
    try {
      const { id } = req.params;
      
      const session = this.collaborationEngine.sessions.get(id);
      
      if (!session) {
        return res.status(404).json({
          error: 'Not Found',
          message: `会话 ${id} 不存在`
        });
      }
      
      const stats = this.collaborationEngine.getSessionStats(id);
      
      res.json({
        success: true,
        session,
        stats,
        tasks: session.tasks || []
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 处理加入会话
   */
  async handleJoinSession(req, res) {
    try {
      const { id } = req.params;
      const { agentId, role } = req.body;
      
      if (!agentId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'agentId 是必需的'
        });
      }
      
      const result = this.collaborationEngine.joinSession(id, agentId, role);
      
      res.json({
        success: true,
        ...result,
        message: '加入会话成功'
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 处理创建任务
   */
  async handleCreateTask(req, res) {
    try {
      const { sessionId, ...taskData } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'sessionId 是必需的'
        });
      }
      
      const task = this.collaborationEngine.createTask(sessionId, taskData);
      
      // 同时添加到任务编排器
      const orchestratedTask = this.taskOrchestrator.createTask({
        ...taskData,
        id: task.id,
        sessionId
      });
      
      res.json({
        success: true,
        task,
        orchestratedTask,
        message: '任务创建成功'
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 处理获取任务
   */
  async handleGetTask(req, res) {
    try {
      const { id } = req.params;
      
      // 从协作引擎获取任务
      let task = null;
      let session = null;
      
      for (const [sessionId, s] of this.collaborationEngine.sessions) {
        const found = s.tasks.find(t => t.id === id);
        if (found) {
          task = found;
          session = s;
          break;
        }
      }
      
      if (!task) {
        return res.status(404).json({
          error: 'Not Found',
          message: `任务 ${id} 不存在`
        });
      }
      
      // 从任务编排器获取详细信息
      const orchestratedInfo = this.taskOrchestrator.getTaskInfo(id);
      
      res.json({
        success: true,
        task,
        session: session ? {
          id: session.id,
          projectId: session.projectId,
          status: session.status
        } : null,
        orchestratedInfo,
        dependencies: this.taskOrchestrator.dependencyGraph.get(id) || []
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 处理分配任务
   */
  async handleAssignTask(req, res) {
    try {
      const { id } = req.params;
      const { agentId } = req.body;
      
      if (!agentId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'agentId 是必需的'
        });
      }
      
      // 从协作引擎查找任务
      let task = null;
      let sessionId = null;
      
      for (const [sid, session] of this.collaborationEngine.sessions) {
        const found = session.tasks.find(t => t.id === id);
        if (found) {
          task = found;
          sessionId = sid;
          break;
        }
      }
      
      if (!task) {
        return res.status(404).json({
          error: 'Not Found',
          message: `任务 ${id} 不存在`
        });
      }
      
      // 获取代理信息
      const agent = this.collaborationEngine.agents.get(agentId);
      
      if (!agent) {
        return res.status(404).json({
          error: 'Not Found',
          message: `代理 ${agentId} 不存在`
        });
      }
      
      // 分配任务
      const result = this.collaborationEngine.assignTaskToAgent(task, agent);
      
      // 更新任务编排器
      this.taskOrchestrator.finalizeTaskAssignment(task, agent);
      
      res.json({
        success: true,
        ...result,
        message: '任务分配成功'
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 处理完成任务
   */
  async handleCompleteTask(req, res) {
    try {
      const { id } = req.params;
      const result = req.body;
      
      // 从协作引擎完成任务
      const completionResult = this.collaborationEngine.completeTask(id, result);
      
      if (!completionResult) {
        return res.status(404).json({
          error: 'Not Found',
          message: `任务 ${id} 不存在或无法完成`
        });
      }
      
      // 更新任务编排器
      this.taskOrchestrator.completeTask(id, result);
      
      res.json({
        success: true,
        ...completionResult,
        message: '任务完成成功'
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 处理获取代理
   */
  async handleGetAgents(req, res) {
    try {
      const agents = Array.from(this.collaborationEngine.agents.values());
      
      res.json({
        success: true,
        agents,
        count: agents.length,
        available: agents.filter(a => a.status === 'available').length
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 处理注册代理
   */
  async handleRegisterAgent(req, res) {
    try {
      const agentData = req.body;
      
      const agent = this.collaborationEngine.registerAgent(agentData);
      
      res.json({
        success: true,
        agent,
        message: '代理注册成功'
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 处理搜索知识
   */
  async handleSearchKnowledge(req, res) {
    try {
      const { query, category } = req.query;
      
      if (!query) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'query 是必需的'
        });
      }
      
      const results = this.collaborationEngine.knowledgeBase.search(query, category);
      
      res.json({
        success: true,
        query,
        category: category || 'all',
        results,
        count: results.length
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 处理添加知识
   */
  async handleAddKnowledge(req, res) {
    try {
      const knowledgeData = req.body;
      
      this.collaborationEngine.knowledgeBase.addEntry(knowledgeData);
      
      res.json({
        success: true,
        message: '知识添加成功',
        entry: knowledgeData
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 处理文件上传
   */
  async handleFileUpload(req, res) {
    try {
      // 这里应该实现实际的文件上传处理
      // 使用multer或其他中间件
      
      res.json({
        success: true,
        message: '文件上传API - 待实现',
        note: '使用WebSocket进行文件传输更合适'
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
  
  /**
   * 获取系统信息
   */
  getSystemInfo() {
    return {
      version: '2.0.0',
      status: this.isRunning ? 'running' : 'stopped',
      uptime: this.getUptime(),
      startTime: this.startTime,
      
      services: {
        collaborationEngine: this.collaborationEngine ? 'running' : 'stopped',
        communicationManager: this.communicationManager ? 'running' : 'stopped',
        taskOrchestrator: this.taskOrchestrator ? 'running' : 'stopped'
      },
      
      stats: {
        sessions: this.collaborationEngine ? this.collaborationEngine.sessions.size : 0,
        agents: this.collaborationEngine ? this.collaborationEngine.agents.size : 0,
        tasks: this.taskOrchestrator ? this.taskOrchestrator.tasks.size : 0,
        connections: this.communicationManager ? this.communicationManager.connections.size : 0
      },
      
      endpoints: {
        api: `http://localhost:${this.config.port}/api`,
        websocket: `ws://localhost:${this.config.wsPort}`,
        uploads: `http://localhost:${this.config.port}/uploads`
      }
    };
  }
  
  /**
   * 获取运行时间
   */
  getUptime() {
    if (!this.startTime) {
      return '0s';
    }
    
    const uptimeMs = Date.now() - this.startTime;
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * 启动服务器
   */
  async start() {
    if (this.isRunning) {
      console.warn('⚠️ 服务器已经在运行');
      return;
    }
    
    try {
      console.log('🚀 启动AI协作开发服务器...');
      
      // 监听端口
      await new Promise((resolve, reject) => {
        this.server.listen(this.config.port, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      
      this.isRunning = true;
      this.startTime = Date.now();
      
      console.log(`✅ 服务器启动成功`);
      console.log(`🌐 HTTP服务器: http://localhost:${this.config.port}`);
      console.log(`📡 WebSocket服务器: ws://localhost:${this.config.wsPort}`);
      console.log(`📁 上传目录: ${this.config.uploadPath}`);
      console.log(`💾 数据目录: ${this.config.dataPath}`);
      console.log('\n📋 可用端点:');
      console.log(`  健康检查: GET /health`);
      console.log(`  系统信息: GET /api/system`);
      console.log(`  创建会话: POST /api/sessions`);
      console.log(`  创建任务: POST /api/tasks`);
      console.log(`  代理列表: GET /api/agents`);
      console.log(`  知识搜索: GET /api/knowledge`);
      
      // 注册进程退出处理
      this.setupProcessHandlers();
      
    } catch (error) {
      console.error(`❌ 服务器启动失败: ${error.message}`);
      process.exit(1);
    }
  }
  
  /**
   * 设置进程处理
   */
  setupProcessHandlers() {
    // 优雅关闭
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 收到信号 ${signal}，开始优雅关闭...`);
      
      this.isRunning = false;
      
      // 停止服务
      if (this.taskOrchestrator) {
        this.taskOrchestrator.stop();
      }
      
      if (this.collaborationEngine) {
        this.collaborationEngine.shutdown();
      }
      
      if (this.communicationManager) {
        await this.communicationManager.stop();
      }
      
      // 关闭服务器
      this.server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
      });
      
      // 强制超时
      setTimeout(() => {
        console.error('⏰ 关闭超时，强制退出');
        process.exit(1);
      }, 10000);
    };
    
    // 注册信号处理
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // 未捕获异常处理
    process.on('uncaughtException', (error) => {
      console.error('❌ 未捕获异常:', error);
      gracefulShutdown('uncaughtException');
    });
    
    // 未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ 未处理的Promise拒绝:', reason);
    });
  }
  
  /**
   * 停止服务器
   */
  async stop() {
    await this.server.close();
    this.isRunning = false;
    console.log('🛑 服务器已停止');
  }
}

/**
 * 命令行接口
 */
if (require.main === module) {
  const server = new AICollaborationServer({
    port: process.env.PORT || 4000,
    wsPort: process.env.WS_PORT || 8080,
    dataPath: process.env.DATA_PATH || './data',
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  });
  
  server.start().catch(error => {
    console.error('启动失败:', error);
    process.exit(1);
  });
}

module.exports = AICollaborationServer;