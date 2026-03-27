/**
 * 📡 通信管理器 - 实时通信模块
 * 
 * 管理WebSocket连接，处理实时消息传递和文件传输
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

class CommunicationManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      port: options.port || 8080,
      maxConnections: options.maxConnections || 1000,
      pingInterval: options.pingInterval || 25000,
      pingTimeout: options.pingTimeout || 60000,
      maxMessageSize: options.maxMessageSize || 10 * 1024 * 1024, // 10MB
      ...options
    };
    
    // 连接管理
    this.wss = null;
    this.connections = new Map();        // clientId -> WebSocket
    this.sessions = new Map();           // sessionId -> 连接集合
    this.users = new Map();              // userId -> 连接信息
    
    // 房间管理
    this.rooms = new Map();              // roomId -> 连接集合
    
    // 消息队列
    this.messageQueue = new Map();       // roomId -> 消息队列
    this.offlineMessages = new Map();    // userId -> 离线消息
    
    // 文件传输
    this.fileTransfers = new Map();      // transferId -> 传输信息
    this.uploadPath = options.uploadPath || './uploads';
    
    // 统计
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,
      filesTransferred: 0
    };
    
    // 确保上传目录存在
    this.ensureUploadDirectory();
  }
  
  /**
   * 确保上传目录存在
   */
  async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
      console.log(`📁 上传目录已创建: ${this.uploadPath}`);
    } catch (error) {
      console.error(`❌ 创建上传目录失败: ${error.message}`);
    }
  }
  
  /**
   * 启动WebSocket服务器
   */
  start(server = null) {
    return new Promise((resolve, reject) => {
      try {
        if (server) {
          this.wss = new WebSocket.Server({ 
            server,
            maxPayload: this.options.maxMessageSize
          });
        } else {
          this.wss = new WebSocket.Server({ 
            port: this.options.port,
            maxPayload: this.options.maxMessageSize
          });
        }
        
        this.setupEventHandlers();
        
        console.log(`📡 WebSocket服务器启动在端口 ${this.options.port}`);
        
        // 开始心跳检测
        this.startHeartbeat();
        
        resolve(this.wss);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    // 连接事件
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // 服务器错误
    this.wss.on('error', (error) => {
      console.error(`❌ WebSocket服务器错误: ${error.message}`);
      this.emit('server_error', { error });
    });
    
    // 服务器关闭
    this.wss.on('close', () => {
      console.log('🛑 WebSocket服务器已关闭');
      this.emit('server_close');
    });
  }
  
  /**
   * 处理新连接
   */
  handleConnection(ws, request) {
    const clientId = uuidv4();
    const ip = request.headers['x-forwarded-for'] || 
               request.connection.remoteAddress;
    
    console.log(`🔌 新连接: ${clientId} (IP: ${ip})`);
    
    // 创建连接记录
    const connection = {
      id: clientId,
      ws,
      ip,
      connectedAt: new Date(),
      lastActivity: new Date(),
      authenticated: false,
      userId: null,
      sessionId: null,
      rooms: new Set()
    };
    
    // 保存连接
    this.connections.set(clientId, connection);
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    
    // 设置消息处理器
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });
    
    // 设置关闭处理器
    ws.on('close', (code, reason) => {
      this.handleDisconnection(clientId, code, reason);
    });
    
    // 设置错误处理器
    ws.on('error', (error) => {
      this.handleConnectionError(clientId, error);
    });
    
    // 发送欢迎消息
    this.sendToClient(clientId, {
      type: 'welcome',
      data: {
        clientId,
        message: '欢迎连接到AI协作通信系统',
        timestamp: new Date().toISOString(),
        serverInfo: {
          version: '2.0.0',
          maxMessageSize: this.options.maxMessageSize,
          features: ['realtime_chat', 'file_transfer', 'room_management']
        }
      }
    });
    
    this.emit('client_connected', { clientId, ip });
  }
  
  /**
   * 处理消息
   */
  async handleMessage(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection) {
      console.warn(`⚠️ 未知客户端消息: ${clientId}`);
      return;
    }
    
    // 更新最后活动时间
    connection.lastActivity = new Date();
    
    try {
      let message;
      
      // 解析消息
      if (Buffer.isBuffer(data) || typeof data === 'string') {
        message = JSON.parse(data.toString());
      } else {
        throw new Error('不支持的消息格式');
      }
      
      this.stats.messagesReceived++;
      this.stats.bytesTransferred += data.length;
      
      // 验证消息格式
      if (!message.type) {
        throw new Error('消息必须包含type字段');
      }
      
      // 处理不同类型的消息
      await this.routeMessage(clientId, message);
      
    } catch (error) {
      console.error(`❌ 消息处理错误 (客户端 ${clientId}): ${error.message}`);
      
      // 发送错误响应
      this.sendToClient(clientId, {
        type: 'error',
        data: {
          error: '消息处理失败',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
  
  /**
   * 路由消息到相应的处理器
   */
  async routeMessage(clientId, message) {
    const { type, data } = message;
    
    switch (type) {
      case 'authenticate':
        await this.handleAuthentication(clientId, data);
        break;
      
      case 'join_room':
        await this.handleJoinRoom(clientId, data);
        break;
      
      case 'leave_room':
        await this.handleLeaveRoom(clientId, data);
        break;
      
      case 'chat_message':
        await this.handleChatMessage(clientId, data);
        break;
      
      case 'task_update':
        await this.handleTaskUpdate(clientId, data);
        break;
      
      case 'code_change':
        await this.handleCodeChange(clientId, data);
        break;
      
      case 'file_transfer_start':
        await this.handleFileTransferStart(clientId, data);
        break;
      
      case 'file_chunk':
        await this.handleFileChunk(clientId, data);
        break;
      
      case 'file_transfer_complete':
        await this.handleFileTransferComplete(clientId, data);
        break;
      
      case 'typing_indicator':
        await this.handleTypingIndicator(clientId, data);
        break;
      
      case 'presence_update':
        await this.handlePresenceUpdate(clientId, data);
        break;
      
      case 'ping':
        await this.handlePing(clientId, data);
        break;
      
      default:
        console.warn(`⚠️ 未知消息类型: ${type}`);
        this.sendToClient(clientId, {
          type: 'error',
          data: {
            error: '未知消息类型',
            type,
            timestamp: new Date().toISOString()
          }
        });
    }
  }
  
  /**
   * 处理认证
   */
  async handleAuthentication(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection) {
      throw new Error('连接不存在');
    }
    
    const { userId, token, sessionId, agentInfo } = data;
    
    // 验证token（这里应该实现实际的验证逻辑）
    const isValid = await this.validateToken(token);
    
    if (!isValid) {
      throw new Error('认证失败：无效的token');
    }
    
    // 更新连接信息
    connection.authenticated = true;
    connection.userId = userId;
    connection.sessionId = sessionId;
    connection.agentInfo = agentInfo;
    
    // 添加到用户映射
    this.users.set(userId, connection);
    
    // 添加到会话
    if (sessionId) {
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, new Set());
      }
      this.sessions.get(sessionId).add(clientId);
    }
    
    console.log(`✅ 客户端认证: ${clientId} -> 用户 ${userId}`);
    
    // 发送认证成功响应
    this.sendToClient(clientId, {
      type: 'authenticated',
      data: {
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
        message: '认证成功'
      }
    });
    
    // 发送离线消息
    await this.deliverOfflineMessages(userId);
    
    this.emit('client_authenticated', { clientId, userId, sessionId });
  }
  
  /**
   * 验证token（简化实现）
   */
  async validateToken(token) {
    // 这里应该实现实际的token验证逻辑
    // 例如使用JWT验证
    return token && token.length > 10;
  }
  
  /**
   * 处理加入房间
   */
  async handleJoinRoom(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection || !connection.authenticated) {
      throw new Error('需要先认证');
    }
    
    const { roomId } = data;
    
    // 创建或获取房间
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      console.log(`🏠 房间创建: ${roomId}`);
    }
    
    const room = this.rooms.get(roomId);
    
    // 加入房间
    room.add(clientId);
    connection.rooms.add(roomId);
    
    console.log(`👤 用户加入房间: ${connection.userId} -> ${roomId}`);
    
    // 通知房间成员
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      data: {
        roomId,
        userId: connection.userId,
        clientId,
        timestamp: new Date().toISOString()
      }
    }, [clientId]); // 排除自己
    
    // 发送房间信息
    this.sendToClient(clientId, {
      type: 'room_joined',
      data: {
        roomId,
        members: Array.from(room).map(clientId => {
          const conn = this.connections.get(clientId);
          return {
            userId: conn?.userId,
            clientId,
            agentInfo: conn?.agentInfo
          };
        }).filter(m => m.userId),
        timestamp: new Date().toISOString()
      }
    });
    
    this.emit('user_joined_room', { 
      userId: connection.userId, 
      roomId, 
      clientId 
    });
  }
  
  /**
   * 处理离开房间
   */
  async handleLeaveRoom(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection) {
      return;
    }
    
    const { roomId } = data;
    
    if (!this.rooms.has(roomId)) {
      return;
    }
    
    const room = this.rooms.get(roomId);
    
    // 离开房间
    room.delete(clientId);
    connection.rooms.delete(roomId);
    
    console.log(`👤 用户离开房间: ${connection.userId} -> ${roomId}`);
    
    // 如果房间为空，删除房间
    if (room.size === 0) {
      this.rooms.delete(roomId);
      console.log(`🏠 房间删除: ${roomId}`);
    } else {
      // 通知剩余成员
      this.broadcastToRoom(roomId, {
        type: 'user_left',
        data: {
          roomId,
          userId: connection.userId,
          clientId,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    this.emit('user_left_room', { 
      userId: connection.userId, 
      roomId, 
      clientId 
    });
  }
  
  /**
   * 处理聊天消息
   */
  async handleChatMessage(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection || !connection.authenticated) {
      throw new Error('需要先认证');
    }
    
    const { roomId, message, attachments = [] } = data;
    
    if (!roomId || !message) {
      throw new Error('缺少必要字段: roomId 或 message');
    }
    
    // 检查用户是否在房间中
    if (!connection.rooms.has(roomId)) {
      throw new Error(`用户不在房间 ${roomId} 中`);
    }
    
    const chatMessage = {
      id: uuidv4(),
      roomId,
      senderId: connection.userId,
      senderName: connection.agentInfo?.name || '未知用户',
      message,
      attachments,
      timestamp: new Date().toISOString()
    };
    
    // 广播消息到房间
    this.broadcastToRoom(roomId, {
      type: 'chat_message',
      data: chatMessage
    });
    
    console.log(`💬 聊天消息: ${connection.userId} -> ${roomId}`);
    
    this.emit('chat_message', chatMessage);
  }
  
  /**
   * 处理任务更新
   */
  async handleTaskUpdate(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection || !connection.authenticated) {
      throw new Error('需要先认证');
    }
    
    const { sessionId, taskId, status, progress, details } = data;
    
    if (!sessionId) {
      throw new Error('缺少sessionId');
    }
    
    // 广播任务更新到会话中的所有客户端
    this.broadcastToSession(sessionId, {
      type: 'task_update',
      data: {
        taskId,
        status,
        progress,
        details,
        updatedBy: connection.userId,
        timestamp: new Date().toISOString()
      }
    });
    
    console.log(`📋 任务更新: ${taskId} -> ${status} (${progress}%)`);
    
    this.emit('task_update', { 
      sessionId, 
      taskId, 
      status, 
      progress,
      updatedBy: connection.userId 
    });
  }
  
  /**
   * 处理代码变更
   */
  async handleCodeChange(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection || !connection.authenticated) {
      throw new Error('需要先认证');
    }
    
    const { sessionId, filePath, changes, author } = data;
    
    if (!sessionId || !filePath || !changes) {
      throw new Error('缺少必要字段');
    }
    
    const codeChange = {
      id: uuidv4(),
      sessionId,
      filePath,
      changes,
      author: author || connection.userId,
      timestamp: new Date().toISOString()
    };
    
    // 广播代码变更到会话
    this.broadcastToSession(sessionId, {
      type: 'code_change',
      data: codeChange
    });
    
    console.log(`📝 代码变更: ${filePath} by ${connection.userId}`);
    
    this.emit('code_change', codeChange);
  }
  
  /**
   * 处理文件传输开始
   */
  async handleFileTransferStart(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection || !connection.authenticated) {
      throw new Error('需要先认证');
    }
    
    const { 
      transferId = uuidv4(), 
      fileName, 
      fileSize, 
      fileType, 
      roomId,
      totalChunks 
    } = data;
    
    if (!fileName || !fileSize) {
      throw new Error('缺少必要字段: fileName 或 fileSize');
    }
    
    // 创建传输记录
    const transfer = {
      id: transferId,
      fileName,
      fileSize,
      fileType,
      roomId,
      senderId: connection.userId,
      totalChunks: totalChunks || Math.ceil(fileSize / (1024 * 1024)), // 默认1MB每块
      receivedChunks: 0,
      chunks: new Map(),
      startedAt: new Date(),
      status: 'uploading'
    };
    
    this.fileTransfers.set(transferId, transfer);
    
    console.log(`📤 文件传输开始: ${fileName} (${fileSize} bytes)`);
    
    // 通知发送者传输已准备
    this.sendToClient(clientId, {
      type: 'file_transfer_ready',
      data: {
        transferId,
        fileName,
        fileSize,
        chunkSize: 1024 * 1024, // 1MB
        timestamp: new Date().toISOString()
      }
    });
    
    this.emit('file_transfer_started', { transferId, transfer });
  }
  
  /**
   * 处理文件块
   */
  async handleFileChunk(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection || !connection.authenticated) {
      throw new Error('需要先认证');
    }
    
    const { transferId, chunkIndex, chunkData, isBase64 = true } = data;
    
    if (!transferId || chunkIndex === undefined || !chunkData) {
      throw new Error('缺少必要字段');
    }
    
    const transfer = this.fileTransfers.get(transferId);
    
    if (!transfer) {
      throw new Error(`传输 ${transferId} 不存在`);
    }
    
    if (transfer.senderId !== connection.userId) {
      throw new Error('无权上传到此传输');
    }
    
    // 保存块数据
    transfer.chunks.set(chunkIndex, chunkData);
    transfer.receivedChunks++;
    
    console.log(`📦 文件块接收: ${transfer.fileName} 块 ${chunkIndex}`);
    
    // 发送确认
    this.sendToClient(clientId, {
      type: 'file_chunk_received',
      data: {
        transferId,
        chunkIndex,
        receivedChunks: transfer.receivedChunks,
        totalChunks: transfer.totalChunks,
        timestamp: new Date().toISOString()
      }
    });
    
    this.emit('file_chunk_received', { 
      transferId, 
      chunkIndex, 
      transfer 
    });
  }
  
  /**
   * 处理文件传输完成
   */
  async handleFileTransferComplete(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection || !connection.authenticated) {
      throw new Error('需要先认证');
    }
    
    const { transferId } = data;
    
    if (!transferId) {
      throw new Error('缺少transferId');
    }
    
    const transfer = this.fileTransfers.get(transferId);
    
    if (!transfer) {
      throw new Error(`传输 ${transferId} 不存在`);
    }
    
    if (transfer.senderId !== connection.userId) {
      throw new Error('无权完成此传输');
    }
    
    // 检查是否收到所有块
    if (transfer.receivedChunks < transfer.totalChunks) {
      throw new Error(`缺少块: 收到 ${transfer.receivedChunks}/${transfer.totalChunks}`);
    }
    
    // 重建文件
    try {
      const fileBuffer = await this.reconstructFile(transfer);
      const filePath = await this.saveFile(transfer, fileBuffer);
      
      transfer.filePath = filePath;
      transfer.status = 'completed';
      transfer.completedAt = new Date();
      
      console.log(`✅ 文件传输完成: ${transfer.fileName} -> ${filePath}`);
      
      // 通知发送者
      this.sendToClient(clientId, {
        type: 'file_transfer_completed',
        data: {
          transferId,
          fileName: transfer.fileName,
          filePath,
          fileSize: transfer.fileSize,
          timestamp: new Date().toISOString()
        }
      });
      
      // 如果有房间，广播文件可用通知
      if (transfer.roomId) {
        this.broadcastToRoom(transfer.roomId, {
          type: 'file_available',
          data: {
            transferId,
            fileName: transfer.fileName,
            fileSize: transfer.fileSize,
            fileType: transfer.fileType,
            senderId: transfer.senderId,
            filePath,
            timestamp: new Date().toISOString()
          }
        }, [clientId]); // 排除发送者
      }
      
      this.stats.filesTransferred++;
      
      this.emit('file_transfer_completed', { transferId, transfer, filePath });
      
    } catch (error) {
      transfer.status = 'failed';
      transfer.error = error.message;
      
      console.error(`❌ 文件重建失败: ${error.message}`);
      
      this.sendToClient(clientId, {
        type: 'file_transfer_failed',
        data: {
          transferId,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
      
      this.emit('file_transfer_failed', { transferId, transfer, error });
    }
  }
  
  /**
   * 重建文件
   */
  async reconstructFile(transfer) {
    const chunks = [];
    
    // 按顺序收集块
    for (let i = 0; i < transfer.totalChunks; i++) {
      const chunkData = transfer.chunks.get(i);
      
      if (!chunkData) {
        throw new Error(`缺少块 ${i}`);
      }
      
      // 解码base64
      const chunkBuffer = Buffer.from(chunkData, 'base64');
      chunks.push(chunkBuffer);
    }
    
    // 合并所有块
    return Buffer.concat(chunks);
  }
  
  /**
   * 保存文件
   */
  async saveFile(transfer, buffer) {
    const fileName = `${Date.now()}_${transfer.fileName}`;
    const filePath = path.join(this.uploadPath, fileName);
    
    await fs.writeFile(filePath, buffer);
    
    return filePath;
  }
  
  /**
   * 处理输入指示器
   */
  async handleTypingIndicator(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection || !connection.authenticated) {
      return;
    }
    
    const { roomId, isTyping } = data;
    
    if (!roomId) {
      return;
    }
    
    // 广播输入状态到房间（排除自己）
    this.broadcastToRoom(roomId, {
      type: 'typing_indicator',
      data: {
        roomId,
        userId: connection.userId,
        userName: connection.agentInfo?.name,
        isTyping,
        timestamp: new Date().toISOString()
      }
    }, [clientId]);
  }
  
  /**
   * 处理在线状态更新
   */
  async handlePresenceUpdate(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection) {
      return;
    }
    
    const { status, message } = data;
    
    connection.presence = {
      status: status || 'online',
      message: message || '',
      updatedAt: new Date()
    };
    
    // 通知所有加入的房间
    connection.rooms.forEach(roomId => {
      this.broadcastToRoom(roomId, {
        type: 'presence_update',
        data: {
          userId: connection.userId,
          status: connection.presence.status,
          message: connection.presence.message,
          timestamp: new Date().toISOString()
        }
      }, [clientId]);
    });
    
    this.emit('presence_update', { 
      userId: connection.userId, 
      presence: connection.presence 
    });
  }
  
  /**
   * 处理ping
   */
  async handlePing(clientId, data) {
    const connection = this.connections.get(clientId);
    
    if (!connection) {
      return;
    }
    
    connection.lastActivity = new Date();
    
    // 发送pong响应
    this.sendToClient(clientId, {
      type: 'pong',
      data: {
        timestamp: new Date().toISOString(),
        serverTime: Date.now()
      }
    });
  }
  
  /**
   * 处理连接断开
   */
  handleDisconnection(clientId, code, reason) {
    const connection = this.connections.get(clientId);
    
    if (!connection) {
      return;
    }
    
    console.log(`🔌 连接断开: ${clientId} (代码: ${code}, 原因: ${reason || '无'})`);
    
    // 从所有房间移除
    connection.rooms.forEach(roomId => {
      const room = this.rooms.get(roomId);
      if (room) {
        room.delete(clientId);
        
        // 通知房间成员
        this.broadcastToRoom(roomId, {
          type: 'user_left',
          data: {
            roomId,
            userId: connection.userId,
            clientId,
            reason: 'disconnected',
            timestamp: new Date().toISOString()
          }
        });
        
        // 如果房间为空，删除房间
        if (room.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    });
    
    // 从会话中移除
    if (connection.sessionId && this.sessions.has(connection.sessionId)) {
      this.sessions.get(connection.sessionId).delete(clientId);
    }
    
    // 从用户映射中移除
    if (connection.userId) {
      this.users.delete(connection.userId);
    }
    
    // 移除连接
    this.connections.delete(clientId);
    this.stats.activeConnections--;
    
    this.emit('client_disconnected', { 
      clientId, 
      userId: connection.userId,
      code, 
      reason 
    });
  }
  
  /**
   * 处理连接错误
   */
  handleConnectionError(clientId, error) {
    console.error(`❌ 连接错误 (客户端 ${clientId}): ${error.message}`);
    
    this.emit('client_error', { clientId, error });
  }
  
  /**
   * 发送消息到客户端
   */
  sendToClient(clientId, message) {
    const connection = this.connections.get(clientId);
    
    if (!connection || !connection.ws || connection.ws.readyState !== WebSocket.OPEN) {
      console.warn(`⚠️ 无法发送消息到客户端 ${clientId}: 连接不可用`);
      return false;
    }
    
    try {
      const jsonMessage = JSON.stringify(message);
      connection.ws.send(jsonMessage);
      
      this.stats.messagesSent++;
      this.stats.bytesTransferred += jsonMessage.length;
      
      return true;
    } catch (error) {
      console.error(`❌ 发送消息到客户端 ${clientId} 失败: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 广播消息到房间
   */
  broadcastToRoom(roomId, message, excludeClientIds = []) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      console.warn(`⚠️ 房间 ${roomId} 不存在`);
      return 0;
    }
    
    let sentCount = 0;
    
    for (const clientId of room) {
      if (excludeClientIds.includes(clientId)) {
        continue;
      }
      
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    }
    
    return sentCount;
  }
  
  /**
   * 广播消息到会话
   */
  broadcastToSession(sessionId, message, excludeClientIds = []) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      console.warn(`⚠️ 会话 ${sessionId} 不存在`);
      return 0;
    }
    
    let sentCount = 0;
    
    for (const clientId of session) {
      if (excludeClientIds.includes(clientId)) {
        continue;
      }
      
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    }
    
    return sentCount;
  }
  
  /**
   * 发送离线消息
   */
  async deliverOfflineMessages(userId) {
    if (!this.offlineMessages.has(userId)) {
      return;
    }
    
    const messages = this.offlineMessages.get(userId);
    const connection = this.users.get(userId);
    
    if (!connection) {
      return;
    }
    
    console.log(`📨 投递离线消息给用户 ${userId}: ${messages.length} 条消息`);
    
    for (const message of messages) {
      this.sendToClient(connection.id, message);
    }
    
    // 清空离线消息
    this.offlineMessages.delete(userId);
  }
  
  /**
   * 存储离线消息
   */
  storeOfflineMessage(userId, message) {
    if (!this.offlineMessages.has(userId)) {
      this.offlineMessages.set(userId, []);
    }
    
    this.offlineMessages.get(userId).push(message);
    
    // 限制离线消息数量
    const maxOfflineMessages = 100;
    if (this.offlineMessages.get(userId).length > maxOfflineMessages) {
      this.offlineMessages.set(
        userId, 
        this.offlineMessages.get(userId).slice(-maxOfflineMessages)
      );
    }
    
    console.log(`📭 离线消息存储: 用户 ${userId}, 总数: ${this.offlineMessages.get(userId).length}`);
  }
  
  /**
   * 开始心跳检测
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeat();
    }, this.options.pingInterval);
    
    console.log('💓 心跳检测已启动');
  }
  
  /**
   * 检查心跳
   */
  checkHeartbeat() {
    const now = Date.now();
    const timeout = this.options.pingTimeout;
    
    for (const [clientId, connection] of this.connections) {
      const lastActivity = connection.lastActivity.getTime();
      const inactiveTime = now - lastActivity;
      
      if (inactiveTime > timeout) {
        console.log(`💔 心跳超时: 客户端 ${clientId} (${inactiveTime}ms 无活动)`);
        
        // 发送ping检查
        this.sendToClient(clientId, {
          type: 'ping',
          data: {
            timestamp: new Date().toISOString()
          }
        });
        
        // 如果还是无响应，可能断开连接
        setTimeout(() => {
          if (this.connections.has(clientId)) {
            const currentLastActivity = this.connections.get(clientId).lastActivity.getTime();
            if (now - currentLastActivity > timeout * 2) {
              console.log(`🛑 强制断开无响应的客户端: ${clientId}`);
              connection.ws.close(1000, '心跳超时');
            }
          }
        }, 5000);
      }
    }
  }
  
  /**
   * 获取连接统计
   */
  getConnectionStats() {
    return {
      ...this.stats,
      rooms: this.rooms.size,
      sessions: this.sessions.size,
      users: this.users.size,
      fileTransfers: this.fileTransfers.size
    };
  }
  
  /**
   * 获取房间信息
   */
  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }
    
    const members = Array.from(room).map(clientId => {
      const conn = this.connections.get(clientId);
      return {
        clientId,
        userId: conn?.userId,
        authenticated: conn?.authenticated,
        agentInfo: conn?.agentInfo,
        joinedAt: conn?.connectedAt
      };
    });
    
    return {
      roomId,
      memberCount: members.length,
      members,
      createdAt: this.getRoomCreationTime(roomId)
    };
  }
  
  /**
   * 获取房间创建时间（简化实现）
   */
  getRoomCreationTime(roomId) {
    // 实际实现应该记录房间创建时间
    return new Date();
  }
  
  /**
   * 停止服务器
   */
  async stop() {
    console.log('🛑 停止通信管理器...');
    
    // 停止心跳
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // 关闭所有连接
    for (const [clientId, connection] of this.connections) {
      try {
        connection.ws.close(1000, '服务器关闭');
      } catch (error) {
        console.error(`关闭客户端 ${clientId} 时出错: ${error.message}`);
      }
    }
    
    // 关闭WebSocket服务器
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('✅ 通信管理器已停止');
  }
}

module.exports = CommunicationManager;