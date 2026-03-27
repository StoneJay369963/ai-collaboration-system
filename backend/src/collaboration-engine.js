/**
 * 🤖 AI协作引擎 - 核心模块
 * 
 * 管理多个AI的协作会话，协调任务分配，处理冲突解决
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

class CollaborationEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxSessions: 100,
      maxAgentsPerSession: 10,
      taskTimeout: 5 * 60 * 1000, // 5分钟
      ...options
    };
    
    // 存储结构
    this.sessions = new Map();          // 协作会话
    this.agents = new Map();            // AI代理注册表
    this.projects = new Map();          // 项目信息
    this.taskQueue = new PriorityQueue(); // 任务优先队列
    this.knowledgeBase = new KnowledgeBase(); // 知识库
    
    // 统计信息
    this.stats = {
      sessionsCreated: 0,
      tasksCompleted: 0,
      conflictsResolved: 0,
      knowledgeEntries: 0
    };
    
    this.initialize();
  }
  
  /**
   * 初始化引擎
   */
  initialize() {
    console.log('🤖 AI协作引擎初始化...');
    
    // 注册默认AI角色
    this.registerDefaultAgents();
    
    // 加载知识库
    this.knowledgeBase.load();
    
    // 启动心跳检测
    this.startHeartbeat();
    
    console.log('✅ AI协作引擎初始化完成');
  }
  
  /**
   * 注册默认AI角色
   */
  registerDefaultAgents() {
    const defaultAgents = [
      {
        id: 'fullstack-ai',
        name: '全栈开发者AI',
        type: 'developer',
        capabilities: {
          languages: ['javascript', 'typescript', 'python', 'java'],
          frameworks: ['react', 'vue', 'express', 'django'],
          databases: ['mongodb', 'mysql', 'postgresql'],
          skills: ['frontend', 'backend', 'api', 'database']
        },
        performance: {
          speed: 8,
          quality: 9,
          reliability: 9
        }
      },
      {
        id: 'ml-ai',
        name: '机器学习AI',
        type: 'ml_engineer',
        capabilities: {
          languages: ['python', 'r'],
          frameworks: ['tensorflow', 'pytorch', 'scikit-learn'],
          skills: ['data_analysis', 'model_training', 'feature_engineering']
        },
        performance: {
          speed: 7,
          quality: 9,
          reliability: 8
        }
      },
      {
        id: 'devops-ai',
        name: '运维AI',
        type: 'devops',
        capabilities: {
          skills: ['deployment', 'monitoring', 'automation', 'docker', 'kubernetes']
        },
        performance: {
          speed: 9,
          quality: 8,
          reliability: 9
        }
      },
      {
        id: 'qa-ai',
        name: '质量保证AI',
        type: 'qa',
        capabilities: {
          skills: ['testing', 'code_review', 'security_scan', 'performance_test']
        },
        performance: {
          speed: 8,
          quality: 9,
          reliability: 8
        }
      }
    ];
    
    defaultAgents.forEach(agent => this.registerAgent(agent));
  }
  
  /**
   * 注册AI代理
   */
  registerAgent(agentData) {
    const agent = {
      id: agentData.id || uuidv4(),
      name: agentData.name,
      type: agentData.type,
      capabilities: agentData.capabilities || {},
      performance: agentData.performance || {},
      status: 'available',
      currentTasks: [],
      completedTasks: [],
      load: 0, // 当前负载 (0-100)
      joinedAt: new Date(),
      lastActivity: new Date()
    };
    
    this.agents.set(agent.id, agent);
    
    this.emit('agent_registered', { agent });
    console.log(`✅ AI代理注册: ${agent.name} (${agent.id})`);
    
    return agent;
  }
  
  /**
   * 创建协作会话
   */
  createSession(projectId, options = {}) {
    const sessionId = uuidv4();
    
    const session = {
      id: sessionId,
      projectId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // 会话配置
      settings: {
        maxAgents: options.maxAgents || 5,
        collaborationMode: options.mode || 'parallel', // parallel, sequential, hybrid
        conflictResolution: options.conflictResolution || 'auto',
        ...options
      },
      
      // 参与成员
      participants: [],
      
      // 会话数据
      tasks: [],
      files: [],
      messages: [],
      conflicts: [],
      
      // 统计信息
      stats: {
        tasksCompleted: 0,
        conflictsResolved: 0,
        messagesExchanged: 0,
        filesModified: 0
      }
    };
    
    this.sessions.set(sessionId, session);
    this.stats.sessionsCreated++;
    
    this.emit('session_created', { session });
    console.log(`✅ 协作会话创建: ${sessionId} (项目: ${projectId})`);
    
    return session;
  }
  
  /**
   * AI加入会话
   */
  joinSession(sessionId, agentId, role = 'participant') {
    const session = this.sessions.get(sessionId);
    const agent = this.agents.get(agentId);
    
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`);
    }
    
    if (!agent) {
      throw new Error(`AI代理 ${agentId} 未注册`);
    }
    
    // 检查会话人数限制
    if (session.participants.length >= session.settings.maxAgents) {
      throw new Error(`会话 ${sessionId} 已达到最大人数限制`);
    }
    
    // 更新AI状态
    agent.status = 'in_session';
    agent.currentSession = sessionId;
    agent.lastActivity = new Date();
    
    // 添加到会话参与者
    const participant = {
      agentId: agent.id,
      agentName: agent.name,
      role,
      joinedAt: new Date(),
      contributions: 0
    };
    
    session.participants.push(participant);
    session.updatedAt = new Date();
    
    this.emit('agent_joined', { sessionId, agent, role });
    console.log(`🤝 AI加入会话: ${agent.name} -> ${sessionId}`);
    
    return { session, agent, participant };
  }
  
  /**
   * 创建任务
   */
  createTask(sessionId, taskData) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`);
    }
    
    const task = {
      id: uuidv4(),
      sessionId,
      title: taskData.title,
      description: taskData.description,
      type: taskData.type || 'development', // development, testing, documentation, etc.
      priority: taskData.priority || 3, // 1-5, 1最高
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // 任务需求
      requirements: {
        skills: taskData.skills || [],
        estimatedTime: taskData.estimatedTime || 3600, // 秒
        complexity: taskData.complexity || 'medium', // low, medium, high
        dependencies: taskData.dependencies || []
      },
      
      // 分配信息
      assignedTo: null,
      assignedAt: null,
      startedAt: null,
      completedAt: null,
      
      // 任务结果
      result: null,
      outputFiles: [],
      metrics: {}
    };
    
    // 添加到会话任务列表
    session.tasks.push(task);
    session.updatedAt = new Date();
    
    // 添加到任务队列
    this.taskQueue.enqueue(task, task.priority);
    
    this.emit('task_created', { sessionId, task });
    console.log(`📋 任务创建: ${task.title} (${task.id})`);
    
    return task;
  }
  
  /**
   * 智能任务分配
   */
  assignTaskIntelligently(sessionId, taskId) {
    const session = this.sessions.get(sessionId);
    const task = session?.tasks.find(t => t.id === taskId);
    
    if (!session || !task) {
      throw new Error('会话或任务不存在');
    }
    
    if (task.status !== 'pending') {
      throw new Error(`任务 ${taskId} 状态为 ${task.status}，无法分配`);
    }
    
    // 获取可用的AI代理
    const availableAgents = this.getAvailableAgents(sessionId);
    
    if (availableAgents.length === 0) {
      console.log(`⚠️ 没有可用的AI代理用于任务 ${taskId}`);
      return null;
    }
    
    // 分析任务需求
    const taskRequirements = this.analyzeTaskRequirements(task);
    
    // 匹配AI能力
    const suitableAgents = availableAgents.filter(agent =>
      this.matchAgentToTask(agent, taskRequirements)
    );
    
    if (suitableAgents.length === 0) {
      console.log(`⚠️ 没有匹配的AI代理用于任务 ${taskId}`);
      
      // 尝试寻找最接近的匹配
      const closestAgent = this.findClosestAgent(availableAgents, taskRequirements);
      if (closestAgent) {
        console.log(`🔄 使用最接近的匹配: ${closestAgent.name}`);
        suitableAgents.push(closestAgent);
      }
    }
    
    // 选择最优AI
    const selectedAgent = this.selectOptimalAgent(suitableAgents, task);
    
    if (selectedAgent) {
      // 分配任务
      return this.assignTaskToAgent(task, selectedAgent);
    }
    
    return null;
  }
  
  /**
   * 分析任务需求
   */
  analyzeTaskRequirements(task) {
    const requirements = {
      skills: task.requirements.skills || [],
      estimatedTime: task.requirements.estimatedTime || 3600,
      complexity: task.requirements.complexity || 'medium',
      type: task.type
    };
    
    // 根据任务类型推断额外需求
    switch (task.type) {
      case 'development':
        requirements.skills.push('coding', 'debugging');
        break;
      case 'testing':
        requirements.skills.push('testing', 'qa');
        break;
      case 'documentation':
        requirements.skills.push('writing', 'documentation');
        break;
      case 'design':
        requirements.skills.push('design', 'ui_ux');
        break;
    }
    
    return requirements;
  }
  
  /**
   * 匹配AI到任务
   */
  matchAgentToTask(agent, requirements) {
    const agentSkills = Object.keys(agent.capabilities.skills || {});
    
    // 检查必备技能
    const requiredSkills = requirements.skills || [];
    const hasRequiredSkills = requiredSkills.every(skill =>
      agentSkills.includes(skill)
    );
    
    if (!hasRequiredSkills) {
      return false;
    }
    
    // 检查AI负载
    if (agent.load > 80) { // 负载超过80%不分配新任务
      return false;
    }
    
    // 检查AI性能匹配
    const taskComplexity = requirements.complexity;
    const agentQuality = agent.performance.quality || 5;
    
    // 高复杂度任务需要高质量AI
    if (taskComplexity === 'high' && agentQuality < 8) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 查找最接近的AI匹配
   */
  findClosestAgent(agents, requirements) {
    let bestAgent = null;
    let bestScore = -1;
    
    for (const agent of agents) {
      const score = this.calculateMatchScore(agent, requirements);
      
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }
    
    // 只返回分数足够高的匹配
    return bestScore >= 0.6 ? bestAgent : null;
  }
  
  /**
   * 计算匹配分数
   */
  calculateMatchScore(agent, requirements) {
    const agentSkills = Object.keys(agent.capabilities.skills || {});
    const requiredSkills = requirements.skills || [];
    
    if (requiredSkills.length === 0) {
      return 1.0; // 没有特定要求，所有AI都匹配
    }
    
    // 计算技能匹配度
    const matchedSkills = requiredSkills.filter(skill =>
      agentSkills.includes(skill)
    );
    const skillScore = matchedSkills.length / requiredSkills.length;
    
    // 考虑AI负载
    const loadScore = 1 - (agent.load / 100);
    
    // 考虑性能匹配
    const complexity = requirements.complexity;
    const agentQuality = agent.performance.quality || 5;
    let qualityScore = 1.0;
    
    if (complexity === 'high') {
      qualityScore = agentQuality >= 8 ? 1.0 : agentQuality / 8;
    } else if (complexity === 'medium') {
      qualityScore = agentQuality >= 6 ? 1.0 : agentQuality / 6;
    }
    
    // 综合分数
    const totalScore = (skillScore * 0.5) + (loadScore * 0.3) + (qualityScore * 0.2);
    
    return totalScore;
  }
  
  /**
   * 选择最优AI
   */
  selectOptimalAgent(agents, task) {
    if (agents.length === 0) {
      return null;
    }
    
    if (agents.length === 1) {
      return agents[0];
    }
    
    // 综合评分选择
    let bestAgent = null;
    let bestScore = -1;
    
    for (const agent of agents) {
      const score = this.calculateAgentScore(agent, task);
      
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }
    
    return bestAgent;
  }
  
  /**
   * 计算AI综合分数
   */
  calculateAgentScore(agent, task) {
    let score = 0;
    
    // 1. 性能匹配 (40%)
    const performanceScore = this.calculatePerformanceScore(agent, task);
    score += performanceScore * 0.4;
    
    // 2. 当前负载 (30%)
    const loadScore = 1 - (agent.load / 100);
    score += loadScore * 0.3;
    
    // 3. 历史成功率 (20%)
    const successRate = this.calculateSuccessRate(agent);
    score += successRate * 0.2;
    
    // 4. 响应速度 (10%)
    const speedScore = (agent.performance.speed || 5) / 10;
    score += speedScore * 0.1;
    
    return score;
  }
  
  /**
   * 计算性能匹配分数
   */
  calculatePerformanceScore(agent, task) {
    const requirements = this.analyzeTaskRequirements(task);
    return this.calculateMatchScore(agent, requirements);
  }
  
  /**
   * 计算AI历史成功率
   */
  calculateSuccessRate(agent) {
    const completedTasks = agent.completedTasks || [];
    
    if (completedTasks.length === 0) {
      return 0.8; // 默认成功率
    }
    
    const successfulTasks = completedTasks.filter(task => 
      task.result === 'success'
    );
    
    return successfulTasks.length / completedTasks.length;
  }
  
  /**
   * 分配任务给AI
   */
  assignTaskToAgent(task, agent) {
    const session = this.sessions.get(task.sessionId);
    
    if (!session) {
      throw new Error(`会话 ${task.sessionId} 不存在`);
    }
    
    // 更新任务状态
    task.status = 'assigned';
    task.assignedTo = agent.id;
    task.assignedAt = new Date();
    task.updatedAt = new Date();
    
    // 更新AI状态
    agent.currentTasks.push(task.id);
    agent.load += this.calculateTaskLoad(task);
    agent.lastActivity = new Date();
    
    // 更新会话状态
    session.updatedAt = new Date();
    
    this.emit('task_assigned', { task, agent });
    console.log(`🎯 任务分配: ${task.title} -> ${agent.name}`);
    
    // 设置任务超时检查
    this.setupTaskTimeout(task);
    
    return { task, agent };
  }
  
  /**
   * 计算任务负载
   */
  calculateTaskLoad(task) {
    const estimatedTime = task.requirements.estimatedTime || 3600;
    const complexity = task.requirements.complexity;
    
    let baseLoad = Math.min(estimatedTime / 3600, 30); // 每小时任务增加30%负载
    
    switch (complexity) {
      case 'high':
        baseLoad *= 1.5;
        break;
      case 'low':
        baseLoad *= 0.7;
        break;
    }
    
    return Math.min(baseLoad, 50); // 最大50%负载
  }
  
  /**
   * 设置任务超时
   */
  setupTaskTimeout(task) {
    const timeout = task.requirements.estimatedTime * 1000 * 1.5; // 1.5倍估计时间
    
    setTimeout(() => {
      this.checkTaskTimeout(task.id);
    }, timeout);
  }
  
  /**
   * 检查任务超时
   */
  checkTaskTimeout(taskId) {
    // 查找任务
    for (const session of this.sessions.values()) {
      const task = session.tasks.find(t => t.id === taskId);
      
      if (task && task.status === 'assigned') {
        console.log(`⏰ 任务超时: ${task.title} (${taskId})`);
        
        // 标记为超时
        task.status = 'timeout';
        task.updatedAt = new Date();
        
        // 释放AI负载
        const agent = this.agents.get(task.assignedTo);
        if (agent) {
          agent.currentTasks = agent.currentTasks.filter(id => id !== taskId);
          agent.load -= this.calculateTaskLoad(task);
        }
        
        this.emit('task_timeout', { task });
        
        // 重新分配任务
        this.assignTaskIntelligently(task.sessionId, task.id);
      }
    }
  }
  
  /**
   * 完成任务
   */
  completeTask(taskId, result) {
    // 查找任务
    let foundTask = null;
    let foundSession = null;
    
    for (const session of this.sessions.values()) {
      const task = session.tasks.find(t => t.id === taskId);
      if (task) {
        foundTask = task;
        foundSession = session;
        break;
      }
    }
    
    if (!foundTask || !foundSession) {
      throw new Error(`任务 ${taskId} 不存在`);
    }
    
    if (foundTask.status !== 'assigned' && foundTask.status !== 'in_progress') {
      throw new Error(`任务 ${taskId} 状态为 ${foundTask.status}，无法完成`);
    }
    
    // 更新任务状态
    foundTask.status = 'completed';
    foundTask.result = result;
    foundTask.completedAt = new Date();
    foundTask.updatedAt = new Date();
    
    // 更新AI状态
    const agent = this.agents.get(foundTask.assignedTo);
    if (agent) {
      agent.currentTasks = agent.currentTasks.filter(id => id !== taskId);
      agent.completedTasks.push({
        taskId,
        title: foundTask.title,
        result: result.status || 'success',
        completedAt: new Date()
      });
      agent.load -= this.calculateTaskLoad(foundTask);
      agent.lastActivity = new Date();
    }
    
    // 更新会话统计
    foundSession.stats.tasksCompleted++;
    foundSession.updatedAt = new Date();
    
    // 更新引擎统计
    this.stats.tasksCompleted++;
    
    // 记录知识
    this.recordKnowledge(foundTask, result);
    
    this.emit('task_completed', { task: foundTask, result });
    console.log(`✅ 任务完成: ${foundTask.title} (${taskId})`);
    
    return { task: foundTask, session: foundSession };
  }
  
  /**
   * 记录知识
   */
  recordKnowledge(task, result) {
    const knowledgeEntry = {
      id: uuidv4(),
      taskId: task.id,
      taskTitle: task.title,
      taskType: task.type,
      agentId: task.assignedTo,
      timestamp: new Date(),
      insights: result.insights || [],
      solutions: result.solutions || [],
      challenges: result.challenges || [],
      bestPractices: result.bestPractices || []
    };
    
    this.knowledgeBase.addEntry(knowledgeEntry);
    this.stats.knowledgeEntries++;
    
    console.log(`🧠 知识记录: ${task.title}`);
  }
  
  /**
   * 处理代码冲突
   */
  resolveCodeConflict(conflictData) {
    const { filePath, oldCode, newCode1, newCode2, agent1, agent2 } = conflictData;
    
    console.log(`⚔️ 检测到代码冲突: ${filePath}`);
    console.log(`  代理1: ${agent1}, 代理2: ${agent2}`);
    
    // 冲突解决策略
    const resolution = {
      filePath,
      conflictId: uuidv4(),
      detectedAt: new Date(),
      resolvedAt: null,
      strategy: 'merge',
      result: null
    };
    
    // 简单的合并策略
    try {
      resolution.result = this.mergeCodes(oldCode, newCode1, newCode2);
      resolution.resolvedAt = new Date();
      resolution.status = 'resolved';
      
      console.log(`✅ 代码冲突解决: ${filePath}`);
      
    } catch (error) {
      resolution.status = 'unresolved';
      resolution.error = error.message;
      
      console.log(`❌ 代码冲突解决失败: ${error.message}`);
    }
    
    // 记录到知识库
    this.knowledgeBase.addConflictResolution(resolution);
    this.stats.conflictsResolved++;
    
    this.emit('conflict_resolved', { conflictData, resolution });
    
    return resolution;
  }
  
  /**
   * 简单代码合并
   */
  mergeCodes(oldCode, newCode1, newCode2) {
    // 这里实现一个简单的合并算法
    // 实际项目中应该使用更复杂的算法
    
    // 检查是否有完全相同的更改
    if (newCode1 === newCode2) {
      return newCode1;
    }
    
    // 尝试合并
    const lines1 = newCode1.split('\n');
    const lines2 = newCode2.split('\n');
    
    const mergedLines = [];
    const maxLines = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        mergedLines.push(line1);
      } else if (line1 && !line2) {
        mergedLines.push(line1);
      } else if (!line1 && line2) {
        mergedLines.push(line2);
      } else {
        // 冲突行，优先选择第一个版本，标记冲突
        mergedLines.push(`// 冲突: 选择版本1`);
        mergedLines.push(line1);
        mergedLines.push(`// 原始版本2: ${line2}`);
      }
    }
    
    return mergedLines.join('\n');
  }
  
  /**
   * 获取可用AI代理
   */
  getAvailableAgents(sessionId = null) {
    const availableAgents = [];
    
    for (const agent of this.agents.values()) {
      // 检查状态
      if (agent.status !== 'available') {
        continue;
      }
      
      // 检查负载
      if (agent.load >= 100) {
        continue;
      }
      
      // 检查是否已在会话中
      if (sessionId && agent.currentSession === sessionId) {
        availableAgents.push(agent);
      } else if (!sessionId) {
        availableAgents.push(agent);
      }
    }
    
    return availableAgents;
  }
  
  /**
   * 获取会话统计
   */
  getSessionStats(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    const stats = {
      sessionId,
      participants: session.participants.length,
      tasks: {
        total: session.tasks.length,
        pending: session.tasks.filter(t => t.status === 'pending').length,
        assigned: session.tasks.filter(t => t.status === 'assigned').length,
        in_progress: session.tasks.filter(t => t.status === 'in_progress').length,
        completed: session.tasks.filter(t => t.status === 'completed').length
      },
      progress: this.calculateSessionProgress(session),
      conflicts: session.conflicts.length,
      lastActivity: session.updatedAt
    };
    
    return stats;
  }
  
  /**
   * 计算会话进度
   */
  calculateSessionProgress(session) {
    const tasks = session.tasks;
    
    if (tasks.length === 0) {
      return 0;
    }
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => 
      t.status === 'assigned' || t.status === 'in_progress'
    ).length;
    
    // 完成的任务100%，进行中的任务50%
    const progress = (completedTasks + (inProgressTasks * 0.5)) / tasks.length;
    
    return Math.min(Math.round(progress * 100), 100);
  }
  
  /**
   * 获取系统统计
   */
  getSystemStats() {
    return {
      ...this.stats,
      activeSessions: Array.from(this.sessions.values()).filter(s => 
        s.status === 'active'
      ).length,
      registeredAgents: this.agents.size,
      availableAgents: this.getAvailableAgents().length,
      queuedTasks: this.taskQueue.size(),
      knowledgeEntries: this.knowledgeBase.getEntryCount(),
      uptime: this.getUptime()
    };
  }
  
  /**
   * 获取运行时间
   */
  getUptime() {
    const now = new Date();
    const uptimeMs = now - this.startTime;
    
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  
  /**
   * 启动心跳检测
   */
  startHeartbeat() {
    this.startTime = new Date();
    
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, 30000); // 每30秒一次
    
    console.log('💓 心跳检测已启动');
  }
  
  /**
   * 执行心跳检测
   */
  performHeartbeat() {
    const now = new Date();
    
    // 检查AI代理活动
    for (const agent of this.agents.values()) {
      const lastActivity = new Date(agent.lastActivity);
      const inactiveTime = now - lastActivity;
      
      if (inactiveTime > 5 * 60 * 1000) { // 5分钟无活动
        console.log(`⚠️ AI代理 ${agent.name} 无活动 ${Math.round(inactiveTime / 1000)}秒`);
        
        // 标记为不活跃
        if (agent.status === 'available') {
          agent.status = 'inactive';
        }
      }
    }
    
    // 检查会话活动
    for (const session of this.sessions.values()) {
      const lastUpdate = new Date(session.updatedAt);
      const inactiveTime = now - lastUpdate;
      
      if (inactiveTime > 30 * 60 * 1000) { // 30分钟无活动
        console.log(`⚠️ 会话 ${session.id} 无活动 ${Math.round(inactiveTime / (1000 * 60))}分钟`);
        
        // 可以考虑自动结束长时间无活动的会话
      }
    }
    
    this.emit('heartbeat', { timestamp: now });
  }
  
  /**
   * 停止引擎
   */
  shutdown() {
    console.log('🛑 停止AI协作引擎...');
    
    // 停止心跳
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // 保存知识库
    this.knowledgeBase.save();
    
    // 结束所有会话
    for (const session of this.sessions.values()) {
      session.status = 'ended';
      session.endedAt = new Date();
    }
    
    console.log('✅ AI协作引擎已停止');
  }
}

/**
 * 优先级队列实现
 */
class PriorityQueue {
  constructor() {
    this.items = [];
  }
  
  enqueue(item, priority = 3) {
    this.items.push({ item, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }
  
  dequeue() {
    return this.items.shift()?.item;
  }
  
  peek() {
    return this.items[0]?.item;
  }
  
  size() {
    return this.items.length;
  }
  
  isEmpty() {
    return this.items.length === 0;
  }
}

/**
 * 知识库实现
 */
class KnowledgeBase {
  constructor() {
    this.entries = [];
    this.conflictResolutions = [];
    this.bestPractices = [];
    this.solutions = [];
  }
  
  load() {
    // 这里可以加载持久化的知识库
    console.log('📚 知识库加载完成');
  }
  
  save() {
    // 这里可以保存知识库到文件或数据库
    console.log('📚 知识库保存完成');
  }
  
  addEntry(entry) {
    this.entries.push(entry);
    
    // 提取最佳实践
    if (entry.bestPractices && entry.bestPractices.length > 0) {
      entry.bestPractices.forEach(practice => {
        this.bestPractices.push({
          ...practice,
          sourceTask: entry.taskId,
          learnedAt: new Date()
        });
      });
    }
    
    // 提取解决方案
    if (entry.solutions && entry.solutions.length > 0) {
      entry.solutions.forEach(solution => {
        this.solutions.push({
          ...solution,
          sourceTask: entry.taskId,
          addedAt: new Date()
        });
      });
    }
  }
  
  addConflictResolution(resolution) {
    this.conflictResolutions.push(resolution);
  }
  
  getEntryCount() {
    return this.entries.length;
  }
  
  search(query, category = 'all') {
    let results = [];
    
    switch (category) {
      case 'bestPractices':
        results = this.bestPractices.filter(practice =>
          practice.description.toLowerCase().includes(query.toLowerCase())
        );
        break;
      case 'solutions':
        results = this.solutions.filter(solution =>
          solution.description.toLowerCase().includes(query.toLowerCase())
        );
        break;
      case 'all':
      default:
        results = [
          ...this.bestPractices.filter(practice =>
            practice.description.toLowerCase().includes(query.toLowerCase())
          ),
          ...this.solutions.filter(solution =>
            solution.description.toLowerCase().includes(query.toLowerCase())
          )
        ];
        break;
    }
    
    return results.slice(0, 10); // 返回前10个结果
  }
}

module.exports = CollaborationEngine;