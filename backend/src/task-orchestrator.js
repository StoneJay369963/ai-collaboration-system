/**
 * 🎯 任务编排器 - 智能任务管理系统
 * 
 * 管理任务依赖关系，智能调度，负载均衡和进度预测
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

class TaskOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxConcurrentTasks: options.maxConcurrentTasks || 100,
      taskTimeout: options.taskTimeout || 30 * 60 * 1000, // 30分钟
      retryAttempts: options.retryAttempts || 3,
      loadBalancing: options.loadBalancing || true,
      predictiveScheduling: options.predictiveScheduling || true,
      ...options
    };
    
    // 数据结构
    this.tasks = new Map();              // taskId -> 任务详情
    this.dependencyGraph = new Map();    // taskId -> 依赖任务ID数组
    this.reverseDependencies = new Map(); // taskId -> 被依赖任务ID数组
    this.taskStatus = new Map();         // taskId -> 状态信息
    this.agentTasks = new Map();         // agentId -> 任务ID数组
    
    // 队列
    this.pendingQueue = [];              // 待处理任务
    this.readyQueue = new PriorityQueue(); // 可执行任务
    this.runningTasks = new Set();       // 运行中任务
    this.completedTasks = new Map();     // 已完成任务
    this.failedTasks = new Map();        // 失败任务
    
    // 调度历史
    this.schedulingHistory = [];
    this.performanceMetrics = new Map(); // agentId -> 性能指标
    
    // 预测模型
    this.predictionModel = new PredictionModel();
    
    // 统计
    this.stats = {
      tasksCreated: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      tasksRetried: 0,
      totalRuntime: 0,
      averageCompletionTime: 0
    };
    
    // 启动调度器
    this.startScheduler();
  }
  
  /**
   * 启动任务调度器
   */
  startScheduler() {
    console.log('🚀 任务编排器启动...');
    
    // 定期检查可执行任务
    this.schedulerInterval = setInterval(() => {
      this.processReadyQueue();
      this.checkTimeouts();
      this.updateMetrics();
    }, 5000); // 每5秒检查一次
    
    // 定期清理
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldTasks();
    }, 60 * 60 * 1000); // 每小时清理一次
    
    console.log('✅ 任务编排器启动完成');
  }
  
  /**
   * 创建任务
   */
  createTask(taskData) {
    const taskId = taskData.id || uuidv4();
    
    const task = {
      id: taskId,
      title: taskData.title || '未命名任务',
      description: taskData.description || '',
      type: taskData.type || 'general',
      priority: taskData.priority || 3, // 1-5, 1最高
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // 任务需求
      requirements: {
        skills: taskData.skills || [],
        estimatedTime: taskData.estimatedTime || 1800, // 30分钟
        complexity: taskData.complexity || 'medium',
        resources: taskData.resources || {}
      },
      
      // 依赖关系
      dependencies: taskData.dependencies || [],
      dependents: [],
      
      // 分配信息
      assignedTo: null,
      assignedAt: null,
      startedAt: null,
      completedAt: null,
      
      // 执行信息
      retryCount: 0,
      maxRetries: this.options.retryAttempts,
      timeout: taskData.timeout || this.options.taskTimeout,
      
      // 结果
      result: null,
      output: null,
      metrics: {}
    };
    
    // 保存任务
    this.tasks.set(taskId, task);
    this.taskStatus.set(taskId, {
      status: 'pending',
      createdAt: task.createdAt
    });
    
    // 建立依赖关系
    this.buildDependencies(taskId, task.dependencies);
    
    // 添加到待处理队列
    this.pendingQueue.push(taskId);
    
    this.stats.tasksCreated++;
    
    console.log(`📋 任务创建: ${task.title} (${taskId})`);
    this.emit('task_created', { task });
    
    // 尝试立即调度
    setTimeout(() => this.scheduleTask(taskId), 0);
    
    return task;
  }
  
  /**
   * 建立依赖关系
   */
  buildDependencies(taskId, dependencies) {
    // 正向依赖
    this.dependencyGraph.set(taskId, dependencies);
    
    // 反向依赖
    for (const depId of dependencies) {
      if (!this.reverseDependencies.has(depId)) {
        this.reverseDependencies.set(depId, []);
      }
      this.reverseDependencies.get(depId).push(taskId);
      
      // 更新被依赖任务的信息
      const depTask = this.tasks.get(depId);
      if (depTask) {
        if (!depTask.dependents) {
          depTask.dependents = [];
        }
        depTask.dependents.push(taskId);
      }
    }
  }
  
  /**
   * 调度任务
   */
  scheduleTask(taskId) {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      console.warn(`⚠️ 任务 ${taskId} 不存在`);
      return false;
    }
    
    // 检查是否已在队列中
    if (task.status !== 'pending') {
      return false;
    }
    
    // 检查依赖是否满足
    const dependenciesSatisfied = this.checkDependencies(taskId);
    
    if (dependenciesSatisfied) {
      // 任务可执行，添加到就绪队列
      task.status = 'ready';
      task.updatedAt = new Date();
      
      this.readyQueue.enqueue(taskId, this.calculateTaskPriority(task));
      
      console.log(`🎯 任务可执行: ${task.title} (${taskId})`);
      this.emit('task_ready', { task });
      
      return true;
    } else {
      // 依赖未满足，保持等待
      console.log(`⏳ 任务等待依赖: ${task.title} (${taskId})`);
      return false;
    }
  }
  
  /**
   * 检查依赖是否满足
   */
  checkDependencies(taskId) {
    const dependencies = this.dependencyGraph.get(taskId) || [];
    
    if (dependencies.length === 0) {
      return true; // 无依赖，可直接执行
    }
    
    for (const depId of dependencies) {
      const depTask = this.tasks.get(depId);
      
      if (!depTask) {
        console.warn(`⚠️ 依赖任务 ${depId} 不存在`);
        return false;
      }
      
      if (depTask.status !== 'completed') {
        return false; // 依赖任务未完成
      }
    }
    
    return true; // 所有依赖都已完成
  }
  
  /**
   * 计算任务优先级
   */
  calculateTaskPriority(task) {
    let priority = task.priority || 3;
    
    // 根据任务类型调整
    switch (task.type) {
      case 'critical':
        priority = 1;
        break;
      case 'high':
        priority = Math.min(priority, 2);
        break;
      case 'low':
        priority = Math.max(priority, 4);
        break;
    }
    
    // 根据复杂度调整
    switch (task.requirements.complexity) {
      case 'high':
        priority = Math.min(priority, 2);
        break;
      case 'low':
        priority = Math.max(priority, 4);
        break;
    }
    
    // 根据预估时间调整（长时间任务优先级稍低）
    const estimatedHours = task.requirements.estimatedTime / 3600;
    if (estimatedHours > 2) {
      priority = Math.min(priority + 1, 5);
    }
    
    return priority;
  }
  
  /**
   * 处理就绪队列
   */
  processReadyQueue() {
    if (this.readyQueue.isEmpty()) {
      return;
    }
    
    // 获取当前运行任务数
    const runningCount = this.runningTasks.size;
    const availableSlots = this.options.maxConcurrentTasks - runningCount;
    
    if (availableSlots <= 0) {
      return; // 已达并发上限
    }
    
    // 分配任务
    for (let i = 0; i < Math.min(availableSlots, this.readyQueue.size()); i++) {
      const taskId = this.readyQueue.dequeue();
      if (taskId) {
        this.prepareTaskForExecution(taskId);
      }
    }
  }
  
  /**
   * 准备任务执行
   */
  prepareTaskForExecution(taskId) {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return;
    }
    
    task.status = 'preparing';
    task.updatedAt = new Date();
    
    console.log(`🔧 准备执行任务: ${task.title} (${taskId})`);
    
    // 发出任务准备事件，等待分配AI代理
    this.emit('task_preparing', { task });
  }
  
  /**
   * 智能分配AI代理
   */
  assignTaskToAgent(taskId, availableAgents) {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }
    
    if (task.status !== 'preparing') {
      throw new Error(`任务 ${taskId} 状态为 ${task.status}，无法分配`);
    }
    
    if (availableAgents.length === 0) {
      console.warn(`⚠️ 无可用AI代理用于任务 ${taskId}`);
      return null;
    }
    
    // 分析任务需求
    const taskRequirements = this.analyzeTaskRequirements(task);
    
    // 筛选匹配的代理
    const suitableAgents = availableAgents.filter(agent =>
      this.isAgentSuitable(agent, taskRequirements)
    );
    
    if (suitableAgents.length === 0) {
      // 尝试寻找最接近的匹配
      const closestAgent = this.findClosestAgent(availableAgents, taskRequirements);
      if (closestAgent) {
        console.log(`🔄 使用最接近的匹配: ${closestAgent.name}`);
        suitableAgents.push(closestAgent);
      } else {
        console.warn(`⚠️ 没有合适的AI代理用于任务 ${taskId}`);
        return null;
      }
    }
    
    // 选择最优代理（考虑负载均衡）
    const selectedAgent = this.selectOptimalAgent(suitableAgents, task);
    
    if (selectedAgent) {
      return this.finalizeTaskAssignment(task, selectedAgent);
    }
    
    return null;
  }
  
  /**
   * 分析任务需求
   */
  analyzeTaskRequirements(task) {
    const requirements = {
      skills: task.requirements.skills || [],
      estimatedTime: task.requirements.estimatedTime,
      complexity: task.requirements.complexity,
      resources: task.requirements.resources,
      type: task.type
    };
    
    // 根据任务类型推断技能需求
    const inferredSkills = this.inferSkillsFromTaskType(task.type);
    requirements.skills = [...new Set([...requirements.skills, ...inferredSkills])];
    
    return requirements;
  }
  
  /**
   * 从任务类型推断技能
   */
  inferSkillsFromTaskType(taskType) {
    const skillMap = {
      'development': ['coding', 'debugging', 'problem_solving'],
      'testing': ['testing', 'qa', 'validation'],
      'documentation': ['writing', 'documentation', 'communication'],
      'design': ['design', 'ui_ux', 'creativity'],
      'analysis': ['analysis', 'research', 'data_processing'],
      'deployment': ['devops', 'deployment', 'automation'],
      'review': ['code_review', 'quality_assurance', 'attention_to_detail']
    };
    
    return skillMap[taskType] || ['general'];
  }
  
  /**
   * 检查AI代理是否合适
   */
  isAgentSuitable(agent, requirements) {
    // 检查必备技能
    const requiredSkills = requirements.skills || [];
    const agentSkills = agent.capabilities?.skills || [];
    
    const hasRequiredSkills = requiredSkills.every(skill =>
      agentSkills.includes(skill)
    );
    
    if (!hasRequiredSkills) {
      return false;
    }
    
    // 检查代理负载
    const agentLoad = this.getAgentLoad(agent.id);
    if (agentLoad >= 100) {
      return false;
    }
    
    // 检查复杂度匹配
    const complexity = requirements.complexity;
    const agentQuality = agent.performance?.quality || 5;
    
    if (complexity === 'high' && agentQuality < 8) {
      return false;
    }
    
    if (complexity === 'critical' && agentQuality < 9) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 获取代理负载
   */
  getAgentLoad(agentId) {
    const tasks = this.agentTasks.get(agentId) || [];
    
    let totalLoad = 0;
    for (const taskId of tasks) {
      const task = this.tasks.get(taskId);
      if (task && task.status === 'running') {
        totalLoad += this.calculateTaskLoad(task);
      }
    }
    
    return Math.min(totalLoad, 100);
  }
  
  /**
   * 计算任务负载
   */
  calculateTaskLoad(task) {
    const baseLoad = 20; // 基础负载
    
    // 根据复杂度调整
    let complexityMultiplier = 1;
    switch (task.requirements.complexity) {
      case 'low':
        complexityMultiplier = 0.7;
        break;
      case 'medium':
        complexityMultiplier = 1;
        break;
      case 'high':
        complexityMultiplier = 1.5;
        break;
      case 'critical':
        complexityMultiplier = 2;
        break;
    }
    
    // 根据预估时间调整
    const estimatedHours = task.requirements.estimatedTime / 3600;
    const timeMultiplier = Math.min(estimatedHours / 2, 2); // 最大2倍
    
    return Math.round(baseLoad * complexityMultiplier * timeMultiplier);
  }
  
  /**
   * 查找最接近的代理
   */
  findClosestAgent(agents, requirements) {
    let bestAgent = null;
    let bestScore = -1;
    
    for (const agent of agents) {
      const score = this.calculateAgentMatchScore(agent, requirements);
      
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }
    
    // 只返回分数足够高的匹配
    return bestScore >= 0.6 ? bestAgent : null;
  }
  
  /**
   * 计算代理匹配分数
   */
  calculateAgentMatchScore(agent, requirements) {
    const requiredSkills = requirements.skills || [];
    const agentSkills = agent.capabilities?.skills || [];
    
    if (requiredSkills.length === 0) {
      return 1.0;
    }
    
    // 技能匹配度
    const matchedSkills = requiredSkills.filter(skill =>
      agentSkills.includes(skill)
    );
    const skillScore = matchedSkills.length / requiredSkills.length;
    
    // 负载分数
    const agentLoad = this.getAgentLoad(agent.id);
    const loadScore = 1 - (agentLoad / 100);
    
    // 性能匹配
    const complexity = requirements.complexity;
    const agentQuality = agent.performance?.quality || 5;
    let qualityScore = 1.0;
    
    if (complexity === 'critical') {
      qualityScore = agentQuality >= 9 ? 1.0 : agentQuality / 9;
    } else if (complexity === 'high') {
      qualityScore = agentQuality >= 8 ? 1.0 : agentQuality / 8;
    } else if (complexity === 'medium') {
      qualityScore = agentQuality >= 6 ? 1.0 : agentQuality / 6;
    }
    
    // 历史成功率
    const successRate = this.getAgentSuccessRate(agent.id);
    
    // 综合分数
    const totalScore = (
      skillScore * 0.4 +
      loadScore * 0.2 +
      qualityScore * 0.2 +
      successRate * 0.2
    );
    
    return totalScore;
  }
  
  /**
   * 获取代理历史成功率
   */
  getAgentSuccessRate(agentId) {
    const metrics = this.performanceMetrics.get(agentId);
    
    if (!metrics) {
      return 0.8; // 默认成功率
    }
    
    const { tasksCompleted, tasksFailed } = metrics;
    const total = tasksCompleted + tasksFailed;
    
    if (total === 0) {
      return 0.8;
    }
    
    return tasksCompleted / total;
  }
  
  /**
   * 选择最优代理
   */
  selectOptimalAgent(agents, task) {
    if (agents.length === 0) {
      return null;
    }
    
    if (agents.length === 1) {
      return agents[0];
    }
    
    // 考虑负载均衡
    if (this.options.loadBalancing) {
      return this.selectWithLoadBalancing(agents, task);
    }
    
    // 否则选择评分最高的
    return this.selectHighestScoringAgent(agents, task);
  }
  
  /**
   * 基于负载均衡选择代理
   */
  selectWithLoadBalancing(agents, task) {
    let bestAgent = null;
    let bestScore = -1;
    
    for (const agent of agents) {
      const matchScore = this.calculateAgentMatchScore(agent, this.analyzeTaskRequirements(task));
      const loadScore = 1 - (this.getAgentLoad(agent.id) / 100);
      
      // 综合分数：匹配度60% + 负载均衡40%
      const totalScore = (matchScore * 0.6) + (loadScore * 0.4);
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestAgent = agent;
      }
    }
    
    return bestAgent;
  }
  
  /**
   * 选择评分最高的代理
   */
  selectHighestScoringAgent(agents, task) {
    let bestAgent = null;
    let bestScore = -1;
    
    for (const agent of agents) {
      const score = this.calculateAgentMatchScore(agent, this.analyzeTaskRequirements(task));
      
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }
    
    return bestAgent;
  }
  
  /**
   * 最终化任务分配
   */
  finalizeTaskAssignment(task, agent) {
    // 更新任务状态
    task.status = 'assigned';
    task.assignedTo = agent.id;
    task.assignedAt = new Date();
    task.updatedAt = new Date();
    
    // 更新代理任务映射
    if (!this.agentTasks.has(agent.id)) {
      this.agentTasks.set(agent.id, []);
    }
    this.agentTasks.get(agent.id).push(task.id);
    
    // 记录调度历史
    this.recordSchedulingDecision(task, agent);
    
    console.log(`🎯 任务分配完成: ${task.title} -> ${agent.name}`);
    this.emit('task_assigned', { task, agent });
    
    return { task, agent };
  }
  
  /**
   * 记录调度决策
   */
  recordSchedulingDecision(task, agent) {
    const decision = {
      taskId: task.id,
      taskTitle: task.title,
      agentId: agent.id,
      agentName: agent.name,
      timestamp: new Date(),
      decisionFactors: {
        skillsMatch: this.calculateSkillsMatch(agent, task),
        load: this.getAgentLoad(agent.id),
        priority: task.priority,
        complexity: task.requirements.complexity
      }
    };
    
    this.schedulingHistory.push(decision);
    
    // 保持历史记录大小
    const maxHistory = 1000;
    if (this.schedulingHistory.length > maxHistory) {
      this.schedulingHistory = this.schedulingHistory.slice(-maxHistory);
    }
  }
  
  /**
   * 计算技能匹配度
   */
  calculateSkillsMatch(agent, task) {
    const requiredSkills = task.requirements.skills || [];
    const agentSkills = agent.capabilities?.skills || [];
    
    if (requiredSkills.length === 0) {
      return 1.0;
    }
    
    const matchedSkills = requiredSkills.filter(skill =>
      agentSkills.includes(skill)
    );
    
    return matchedSkills.length / requiredSkills.length;
  }
  
  /**
   * 开始执行任务
   */
  startTaskExecution(taskId) {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }
    
    if (task.status !== 'assigned') {
      throw new Error(`任务 ${taskId} 状态为 ${task.status}，无法开始执行`);
    }
    
    // 更新任务状态
    task.status = 'running';
    task.startedAt = new Date();
    task.updatedAt = new Date();
    
    // 添加到运行中集合
    this.runningTasks.add(taskId);
    
    // 设置超时检查
    this.setupTaskTimeout(taskId);
    
    console.log(`🚀 任务开始执行: ${task.title} (${taskId})`);
    this.emit('task_started', { task });
    
    return task;
  }
  
  /**
   * 设置任务超时
   */
  setupTaskTimeout(taskId) {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return;
    }
    
    const timeout = task.timeout || this.options.taskTimeout;
    
    setTimeout(() => {
      this.checkTaskTimeout(taskId);
    }, timeout);
  }
  
  /**
   * 检查任务超时
   */
  checkTaskTimeout(taskId) {
    const task = this.tasks.get(taskId);
    
    if (!task || task.status !== 'running') {
      return;
    }
    
    const runningTime = Date.now() - task.startedAt.getTime();
    const timeout = task.timeout || this.options.taskTimeout;
    
    if (runningTime > timeout) {
      console.warn(`⏰ 任务超时: ${task.title} (${taskId})`);
      
      this.handleTaskFailure(taskId, {
        error: '任务执行超时',
        reason: `运行时间 ${Math.round(runningTime / 1000)}秒 超过限制 ${timeout / 1000}秒`
      });
    }
  }
  
  /**
   * 完成任务
   */
  completeTask(taskId, result) {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }
    
    if (task.status !== 'running') {
      throw new Error(`任务 ${taskId} 状态为 ${task.status}，无法完成`);
    }
    
    // 计算执行时间
    const startTime = task.startedAt.getTime();
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // 更新任务状态
    task.status = 'completed';
    task.completedAt = new Date();
    task.updatedAt = new Date();
    task.result = result;
    task.metrics.executionTime = executionTime;
    task.metrics.completedAt = task.completedAt;
    
    // 从运行中集合移除
    this.runningTasks.delete(taskId);
    
    // 添加到已完成映射
    this.completedTasks.set(taskId, {
      task,
      completedAt: task.completedAt,
      executionTime
    });
    
    // 更新代理性能指标
    this.updateAgentMetrics(task.assignedTo, true);
    
    // 更新统计
    this.stats.tasksCompleted++;
    this.stats.totalRuntime += executionTime;
    this.stats.averageCompletionTime = 
      this.stats.totalRuntime / this.stats.tasksCompleted;
    
    console.log(`✅ 任务完成: ${task.title} (${taskId}) - 用时 ${Math.round(executionTime / 1000)}秒`);
    this.emit('task_completed', { task, result, executionTime });
    
    // 检查依赖此任务的其他任务
    this.checkDependentTasks(taskId);
    
    return { task, executionTime };
  }
  
  /**
   * 处理任务失败
   */
  handleTaskFailure(taskId, error) {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return;
    }
    
    task.status = 'failed';
    task.updatedAt = new Date();
    task.result = { error: true, ...error };
    
    // 从运行中集合移除
    this.runningTasks.delete(taskId);
    
    // 更新代理性能指标
    this.updateAgentMetrics(task.assignedTo, false);
    
    // 检查重试
    if (task.retryCount < task.maxRetries) {
      this.retryTask(taskId);
    } else {
      // 最终失败
      this.finalizeTaskFailure(taskId, error);
    }
  }
  
  /**
   * 重试任务
   */
  retryTask(taskId) {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return;
    }
    
    task.retryCount++;
    task.status = 'pending';
    task.assignedTo = null;
    task.assignedAt = null;
    task.startedAt = null;
    task.updatedAt = new Date();
    
    // 从代理任务映射中移除
    if (task.assignedTo) {
      const agentTasks = this.agentTasks.get(task.assignedTo);
      if (agentTasks) {
        const index = agentTasks.indexOf(taskId);
        if (index > -1) {
          agentTasks.splice(index, 1);
        }
      }
    }
    
    this.stats.tasksRetried++;
    
    console.log(`🔄 任务重试: ${task.title} (${taskId}) - 第 ${task.retryCount} 次`);
    this.emit('task_retry', { task, retryCount: task.retryCount });
    
    // 重新调度
    this.scheduleTask(taskId);
  }
  
  /**
   * 最终化任务失败
   */
  finalizeTaskFailure(taskId, error) {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return;
    }
    
    task.status = 'failed_final';
    task.updatedAt = new Date();
    
    this.failedTasks.set(taskId, {
      task,
      failedAt: new Date(),
      error,
      retryCount: task.retryCount
    });
    
    this.stats.tasksFailed++;
    
    console.error(`❌ 任务最终失败: ${task.title} (${taskId}) - ${error.reason || error.message}`);
    this.emit('task_failed', { task, error });
    
    // 检查依赖此任务的其他任务
    this.handleDependentTaskFailure(taskId);
  }
  
  /**
   * 检查依赖任务
   */
  checkDependentTasks(taskId) {
    const dependents = this.reverseDependencies.get(taskId) || [];
    
    for (const dependentId of dependents) {
      // 重新检查依赖
      const dependenciesSatisfied = this.checkDependencies(dependentId);
      
      if (dependenciesSatisfied) {
        // 依赖满足，尝试调度
        this.scheduleTask(dependentId);
      }
    }
  }
  
  /**
   * 处理依赖任务失败
   */
  handleDependentTaskFailure(taskId) {
    const dependents = this.reverseDependencies.get(taskId) || [];
    
    for (const dependentId of dependents) {
      const dependentTask = this.tasks.get(dependentId);
      
      if (dependentTask && dependentTask.status === 'pending') {
        // 标记为因依赖失败而失败
        this.handleTaskFailure(dependentId, {
          error: '依赖任务失败',
          reason: `依赖任务 ${taskId} 失败`,
          dependentTaskId: taskId
        });
      }
    }
  }
  
  /**
   * 更新代理性能指标
   */
  updateAgentMetrics(agentId, success) {
    if (!this.performanceMetrics.has(agentId)) {
      this.performanceMetrics.set(agentId, {
        tasksCompleted: 0,
        tasksFailed: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        lastUpdated: new Date()
      });
    }
    
    const metrics = this.performanceMetrics.get(agentId);
    
    if (success) {
      metrics.tasksCompleted++;
    } else {
      metrics.tasksFailed++;
    }
    
    metrics.lastUpdated = new Date();
  }
  
  /**
   * 更新指标
   */
  updateMetrics() {
    // 这里可以更新各种运行时指标
    // 例如：队列长度、平均等待时间、成功率等
  }
  
  /**
   * 清理旧任务
   */
  cleanupOldTasks() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    // 清理已完成任务
    for (const [taskId, data] of this.completedTasks) {
      if (now - data.completedAt.getTime() > maxAge) {
        this.completedTasks.delete(taskId);
        this.tasks.delete(taskId);
        this.taskStatus.delete(taskId);
      }
    }
    
    // 清理失败任务
    for (const [taskId, data] of this.failedTasks) {
      if (now - data.failedAt.getTime() > maxAge) {
        this.failedTasks.delete(taskId);
        this.tasks.delete(taskId);
        this.taskStatus.delete(taskId);
      }
    }
    
    console.log(`🧹 清理了旧任务，当前任务数: ${this.tasks.size}`);
  }
  
  /**
   * 获取任务信息
   */
  getTaskInfo(taskId) {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return null;
    }
    
    const dependencies = this.dependencyGraph.get(taskId) || [];
    const dependents = this.reverseDependencies.get(taskId) || [];
    
    return {
      ...task,
      dependencies: dependencies.map(depId => ({
        id: depId,
        title: this.tasks.get(depId)?.title,
        status: this.tasks.get(depId)?.status
      })),
      dependents: dependents.map(depId => ({
        id: depId,
        title: this.tasks.get(depId)?.title,
        status: this.tasks.get(depId)?.status
      })),
      agentLoad: task.assignedTo ? this.getAgentLoad(task.assignedTo) : 0
    };
  }
  
  /**
   * 获取系统状态
   */
  getSystemStatus() {
    return {
      stats: { ...this.stats },
      queues: {
        pending: this.pendingQueue.length,
        ready: this.readyQueue.size(),
        running: this.runningTasks.size,
        completed: this.completedTasks.size,
        failed: this.failedTasks.size
      },
      agents: {
        total: this.agentTasks.size,
        withTasks: Array.from(this.agentTasks.entries())
          .filter(([_, tasks]) => tasks.length > 0).length
      },
      performance: {
        successRate: this.stats.tasksCompleted / Math.max(this.stats.tasksCreated, 1),
        averageTime: this.stats.averageCompletionTime,
        throughput: this.calculateThroughput()
      }
    };
  }
  
  /**
   * 计算吞吐量
   */
  calculateThroughput() {
    const completedTasks = this.stats.tasksCompleted;
    const runtime = this.stats.totalRuntime / 1000; // 转换为秒
    
    if (runtime === 0) {
      return 0;
    }
    
    return completedTasks / (runtime / 3600); // 任务/小时
  }
  
  /**
   * 停止编排器
   */
  stop() {
    console.log('🛑 停止任务编排器...');
    
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // 保存状态
    this.saveState();
    
    console.log('✅ 任务编排器已停止');
  }
  
  /**
   * 保存状态（简化实现）
   */
  saveState() {
    // 这里可以保存状态到文件或数据库
    console.log('💾 任务编排器状态已保存');
  }
}

/**
 * 优先级队列
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
  
  remove(item) {
    const index = this.items.findIndex(i => i.item === item);
    if (index > -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }
}

/**
 * 预测模型（简化实现）
 */
class PredictionModel {
  constructor() {
    this.history = [];
    this.model = {};
  }
  
  predict(task) {
    // 基于历史数据预测执行时间
    const similarTasks = this.findSimilarTasks(task);
    
    if (similarTasks.length === 0) {
      return task.requirements.estimatedTime || 1800;
    }
    
    const totalTime = similarTasks.reduce((sum, t) => sum + t.actualTime, 0);
    const averageTime = totalTime / similarTasks.length;
    
    // 根据复杂度调整
    const complexityFactor = this.getComplexityFactor(task.requirements.complexity);
    
    return Math.round(averageTime * complexityFactor);
  }
  
  findSimilarTasks(task) {
    return this.history.filter(h =>
      h.type === task.type &&
      h.complexity === task.requirements.complexity
    ).slice(0, 10); // 取最近10个
  }
  
  getComplexityFactor(complexity) {
    const factors = {
      'low': 0.7,
      'medium': 1.0,
      'high': 1.5,
      'critical': 2.0
    };
    
    return factors[complexity] || 1.0;
  }
  
  recordExecution(task, actualTime) {
    this.history.push({
      type: task.type,
      complexity: task.requirements.complexity,
      estimatedTime: task.requirements.estimatedTime,
      actualTime,
      timestamp: new Date()
    });
    
    // 保持历史记录大小
    const maxHistory = 1000;
    if (this.history.length > maxHistory) {
      this.history = this.history.slice(-maxHistory);
    }
  }
}

module.exports = TaskOrchestrator;