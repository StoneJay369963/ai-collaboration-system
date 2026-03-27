#!/usr/bin/env node

/**
 * 🎮 AI协作开发系统 v2.0 - 演示脚本
 * 
 * 展示系统核心功能的演示
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const WebSocket = require('ws');

class AICollaborationDemo {
  constructor(baseURL = 'http://localhost:4000', wsURL = 'ws://localhost:8080') {
    this.baseURL = baseURL;
    this.wsURL = wsURL;
    this.api = axios.create({ baseURL });
    
    this.sessionId = null;
    this.agents = [];
    this.tasks = [];
    this.websocket = null;
  }
  
  /**
   * 运行完整演示
   */
  async runFullDemo() {
    console.log('🚀 开始AI协作开发系统演示\n');
    
    try {
      // 1. 检查服务器状态
      await this.checkServerStatus();
      
      // 2. 注册AI代理
      await this.registerAgents();
      
      // 3. 创建协作会话
      await this.createCollaborationSession();
      
      // 4. 连接到WebSocket
      await this.connectWebSocket();
      
      // 5. 创建和分配任务
      await this.createAndAssignTasks();
      
      // 6. 模拟任务完成
      await this.simulateTaskCompletion();
      
      // 7. 展示系统状态
      await this.showSystemStatus();
      
      console.log('\n🎉 演示完成！');
      
    } catch (error) {
      console.error(`❌ 演示失败: ${error.message}`);
      process.exit(1);
    }
  }
  
  /**
   * 检查服务器状态
   */
  async checkServerStatus() {
    console.log('1️⃣ 检查服务器状态...');
    
    try {
      const response = await this.api.get('/health');
      
      console.log(`✅ 服务器状态: ${response.data.status}`);
      console.log(`📊 版本: ${response.data.version}`);
      console.log(`⏱️  运行时间: ${response.data.uptime}`);
      
    } catch (error) {
      throw new Error(`服务器未响应: ${error.message}`);
    }
  }
  
  /**
   * 注册AI代理
   */
  async registerAgents() {
    console.log('\n2️⃣ 注册AI代理...');
    
    const agents = [
      {
        id: 'ai-dev-001',
        name: '全栈开发者AI',
        type: 'developer',
        capabilities: {
          skills: ['javascript', 'typescript', 'react', 'nodejs', 'database'],
          speed: 9,
          quality: 8
        }
      },
      {
        id: 'ai-ml-001',
        name: '机器学习AI',
        type: 'ml_engineer',
        capabilities: {
          skills: ['python', 'tensorflow', 'data_analysis', 'model_training'],
          speed: 7,
          quality: 9
        }
      },
      {
        id: 'ai-qa-001',
        name: '质量保证AI',
        type: 'qa',
        capabilities: {
          skills: ['testing', 'code_review', 'security', 'performance'],
          speed: 8,
          quality: 9
        }
      },
      {
        id: 'ai-docs-001',
        name: '文档AI',
        type: 'documentation',
        capabilities: {
          skills: ['writing', 'documentation', 'technical_writing'],
          speed: 9,
          quality: 8
        }
      }
    ];
    
    for (const agent of agents) {
      try {
        const response = await this.api.post('/api/agents/register', agent);
        this.agents.push(response.data.agent);
        console.log(`✅ 注册: ${agent.name}`);
      } catch (error) {
        console.warn(`⚠️ 注册失败 ${agent.name}: ${error.message}`);
      }
    }
    
    console.log(`📊 总共注册 ${this.agents.length} 个AI代理`);
  }
  
  /**
   * 创建协作会话
   */
  async createCollaborationSession() {
    console.log('\n3️⃣ 创建协作会话...');
    
    const projectId = `project-${Date.now()}`;
    const sessionData = {
      projectId,
      agents: this.agents.map(a => a.id),
      options: {
        maxAgents: 4,
        mode: 'parallel',
        conflictResolution: 'auto'
      }
    };
    
    try {
      const response = await this.api.post('/api/sessions', sessionData);
      this.sessionId = response.data.session.id;
      
      console.log(`✅ 会话创建成功: ${this.sessionId}`);
      console.log(`📋 项目ID: ${projectId}`);
      console.log(`👥 参与者: ${response.data.session.participants.length} 个AI`);
      
    } catch (error) {
      throw new Error(`创建会话失败: ${error.message}`);
    }
  }
  
  /**
   * 连接到WebSocket
   */
  async connectWebSocket() {
    console.log('\n4️⃣ 连接到WebSocket服务器...');
    
    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(this.wsURL);
      
      this.websocket.on('open', () => {
        console.log('✅ WebSocket连接成功');
        
        // 认证
        const authMessage = {
          type: 'authenticate',
          data: {
            userId: 'demo-user',
            token: 'demo-token',
            sessionId: this.sessionId,
            agentInfo: { name: '演示用户', role: 'observer' }
          }
        };
        
        this.websocket.send(JSON.stringify(authMessage));
        resolve();
      });
      
      this.websocket.on('message', (data) => {
        const message = JSON.parse(data.toString());
        this.handleWebSocketMessage(message);
      });
      
      this.websocket.on('error', (error) => {
        console.error(`❌ WebSocket错误: ${error.message}`);
        reject(error);
      });
      
      this.websocket.on('close', () => {
        console.log('🔌 WebSocket连接关闭');
      });
    });
  }
  
  /**
   * 处理WebSocket消息
   */
  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'authenticated':
        console.log('🔐 WebSocket认证成功');
        break;
        
      case 'chat_message':
        console.log(`💬 聊天消息: ${message.data.senderName}: ${message.data.message}`);
        break;
        
      case 'task_update':
        console.log(`📋 任务更新: ${message.data.taskId} -> ${message.data.status}`);
        break;
        
      case 'code_change':
        console.log(`📝 代码变更: ${message.data.filePath}`);
        break;
    }
  }
  
  /**
   * 创建和分配任务
   */
  async createAndAssignTasks() {
    console.log('\n5️⃣ 创建和分配任务...');
    
    const tasks = [
      {
        title: '实现用户认证系统',
        description: '开发用户注册、登录、权限管理功能',
        type: 'development',
        priority: 1,
        skills: ['javascript', 'nodejs', 'database'],
        estimatedTime: 7200, // 2小时
        complexity: 'high'
      },
      {
        title: '编写API文档',
        description: '为REST API编写详细的文档',
        type: 'documentation',
        priority: 2,
        skills: ['writing', 'documentation'],
        estimatedTime: 3600, // 1小时
        complexity: 'medium'
      },
      {
        title: '编写单元测试',
        description: '为核心功能编写单元测试',
        type: 'testing',
        priority: 2,
        skills: ['testing', 'javascript'],
        estimatedTime: 5400, // 1.5小时
        complexity: 'medium'
      },
      {
        title: '性能优化',
        description: '分析并优化系统性能',
        type: 'analysis',
        priority: 3,
        skills: ['performance', 'analysis'],
        estimatedTime: 10800, // 3小时
        complexity: 'high'
      }
    ];
    
    for (const taskData of tasks) {
      try {
        const task = await this.createTask(taskData);
        await this.assignTask(task.id);
        await this.simulateTaskProgress(task.id);
        
      } catch (error) {
        console.warn(`⚠️ 任务创建失败: ${error.message}`);
      }
    }
  }
  
  /**
   * 创建单个任务
   */
  async createTask(taskData) {
    const response = await this.api.post('/api/tasks', {
      sessionId: this.sessionId,
      ...taskData
    });
    
    const task = response.data.task;
    this.tasks.push(task);
    
    console.log(`✅ 任务创建: ${task.title} (ID: ${task.id})`);
    
    return task;
  }
  
  /**
   * 分配任务
   */
  async assignTask(taskId) {
    // 获取可用代理
    const agentsResponse = await this.api.get('/api/agents');
    const availableAgents = agentsResponse.data.agents.filter(a => a.status === 'available');
    
    if (availableAgents.length === 0) {
      throw new Error('没有可用的AI代理');
    }
    
    // 分配任务给第一个可用代理
    const agent = availableAgents[0];
    
    const response = await this.api.post(`/api/tasks/${taskId}/assign`, {
      agentId: agent.id
    });
    
    console.log(`🎯 任务分配: ${taskId} -> ${agent.name}`);
    
    return response.data;
  }
  
  /**
   * 模拟任务进度
   */
  async simulateTaskProgress(taskId) {
    // 通过WebSocket发送进度更新
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const progressMessage = {
        type: 'task_update',
        data: {
          sessionId: this.sessionId,
          taskId,
          status: 'in_progress',
          progress: 25,
          details: { message: '任务已开始执行' }
        }
      };
      
      this.websocket.send(JSON.stringify(progressMessage));
      console.log(`📊 进度更新: ${taskId} -> 25%`);
    }
    
    // 模拟一些延迟
    await this.sleep(1000);
  }
  
  /**
   * 模拟任务完成
   */
  async simulateTaskCompletion() {
    console.log('\n6️⃣ 模拟任务完成...');
    
    for (const task of this.tasks) {
      try {
        const result = {
          status: 'success',
          output: `任务 "${task.title}" 已完成`,
          metrics: {
            executionTime: Math.floor(Math.random() * 3600) + 1800, // 0.5-1.5小时
            qualityScore: Math.floor(Math.random() * 30) + 70, // 70-100分
            issuesFound: Math.floor(Math.random() * 5)
          }
        };
        
        await this.api.post(`/api/tasks/${task.id}/complete`, result);
        
        console.log(`✅ 任务完成: ${task.title}`);
        
        // 发送完成通知
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          const completeMessage = {
            type: 'task_update',
            data: {
              sessionId: this.sessionId,
              taskId: task.id,
              status: 'completed',
              progress: 100,
              details: { message: '任务已完成' }
            }
          };
          
          this.websocket.send(JSON.stringify(completeMessage));
        }
        
        await this.sleep(500);
        
      } catch (error) {
        console.warn(`⚠️ 任务完成模拟失败: ${error.message}`);
      }
    }
  }
  
  /**
   * 展示系统状态
   */
  async showSystemStatus() {
    console.log('\n7️⃣ 展示系统状态...\n');
    
    try {
      // 获取系统信息
      const systemResponse = await this.api.get('/api/system');
      const systemInfo = systemResponse.data;
      
      console.log('📊 系统状态概览:');
      console.log('='.repeat(40));
      console.log(`🏃 状态: ${systemInfo.status}`);
      console.log(`⏱️  运行时间: ${systemInfo.uptime}`);
      console.log(`📅 启动时间: ${new Date(systemInfo.startTime).toLocaleString()}`);
      
      console.log('\n🔧 服务状态:');
      console.log(`  🤖 协作引擎: ${systemInfo.services.collaborationEngine}`);
      console.log(`  📡 通信管理器: ${systemInfo.services.communicationManager}`);
      console.log(`  🎯 任务编排器: ${systemInfo.services.taskOrchestrator}`);
      
      console.log('\n📈 系统统计:');
      console.log(`  🏠 会话数: ${systemInfo.stats.sessions}`);
      console.log(`  🤖 AI代理数: ${systemInfo.stats.agents}`);
      console.log(`  📋 任务数: ${systemInfo.stats.tasks}`);
      console.log(`  🔌 连接数: ${systemInfo.stats.connections}`);
      
      console.log('\n🌐 访问端点:');
      console.log(`  📊 API: ${systemInfo.endpoints.api}`);
      console.log(`  🔗 WebSocket: ${systemInfo.endpoints.websocket}`);
      console.log(`  📁 文件上传: ${systemInfo.endpoints.uploads}`);
      
      // 获取会话详情
      if (this.sessionId) {
        console.log('\n🏠 当前会话详情:');
        console.log('-'.repeat(40));
        
        const sessionResponse = await this.api.get(`/api/sessions/${this.sessionId}`);
        const session = sessionResponse.data;
        
        console.log(`ID: ${session.session.id}`);
        console.log(`项目: ${session.session.projectId}`);
        console.log(`状态: ${session.session.status}`);
        console.log(`创建时间: ${new Date(session.session.createdAt).toLocaleString()}`);
        
        console.log(`\n📊 会话统计:`);
        console.log(`  参与者: ${session.stats.participants || 0}`);
        console.log(`  任务总数: ${session.stats.tasks?.total || 0}`);
        console.log(`  已完成: ${session.stats.tasks?.completed || 0}`);
        console.log(`  进度: ${session.stats.progress || 0}%`);
        
        console.log(`\n📋 任务列表:`);
        if (session.tasks && session.tasks.length > 0) {
          session.tasks.forEach((task, index) => {
            console.log(`  ${index + 1}. ${task.title} [${task.status}] - ${task.assignedTo || '未分配'}`);
          });
        } else {
          console.log('  暂无任务');
        }
      }
      
      console.log('\n' + '='.repeat(40));
      console.log('🎮 演示结束 - AI协作开发系统运行正常！');
      
    } catch (error) {
      console.warn(`⚠️ 获取系统状态失败: ${error.message}`);
    }
  }
  
  /**
   * 休眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

/**
 * 运行演示
 */
async function main() {
  const demo = new AICollaborationDemo();
  
  try {
    await demo.runFullDemo();
  } finally {
    demo.cleanup();
  }
}

// 命令行接口
if (require.main === module) {
  main().catch(error => {
    console.error('演示失败:', error);
    process.exit(1);
  });
}

module.exports = AICollaborationDemo;