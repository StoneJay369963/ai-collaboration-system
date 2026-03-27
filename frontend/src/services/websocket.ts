import { io, Socket } from 'socket.io-client'
import { store } from '../store/store'
import { setAgents, updateAgent, addSession, updateSession } from '../store/slices/aiAgentSlice'
import { updateProject } from '../store/slices/projectSlice'
import { updateTask, moveTask, addComment, addAttachment } from '../store/slices/taskSlice'
import { addNotification } from '../store/slices/uiSlice'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export interface WebSocketServiceConfig {
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

class WebSocketService {
  private socket: Socket | null = null
  private token: string | null = null
  private config: Required<WebSocketServiceConfig>
  private reconnectAttempts = 0
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  constructor(config: WebSocketServiceConfig = {}) {
    this.config = {
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config,
    }
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.token = token
      
      // 如果已连接，先断开
      if (this.socket) {
        this.disconnect()
      }

      this.socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false, // 我们手动处理重连
      })

      this.setupEventHandlers()

      this.socket.on('connect', () => {
        console.log('WebSocket连接成功')
        this.reconnectAttempts = 0
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket连接错误:', error)
        reject(error)
      })

      setTimeout(() => {
        if (!this.socket?.connected) {
          reject(new Error('连接超时'))
        }
      }, 10000)
    })
  }

  private setupEventHandlers() {
    if (!this.socket) return

    // 基础事件
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket断开连接:', reason)
      this.handleDisconnect()
    })

    this.socket.on('error', (error) => {
      console.error('WebSocket错误:', error)
    })

    // 应用事件
    this.socket.on('agent_update', this.handleAgentUpdate.bind(this))
    this.socket.on('project_update', this.handleProjectUpdate.bind(this))
    this.socket.on('task_update', this.handleTaskUpdate.bind(this))
    this.socket.on('task_moved', this.handleTaskMoved.bind(this))
    this.socket.on('session_update', this.handleSessionUpdate.bind(this))
    this.socket.on('new_session', this.handleNewSession.bind(this))
    this.socket.on('new_message', this.handleNewMessage.bind(this))
    this.socket.on('new_comment', this.handleNewComment.bind(this))
    this.socket.on('new_attachment', this.handleNewAttachment.bind(this))
    this.socket.on('notification', this.handleNotification.bind(this))
    this.socket.on('system_alert', this.handleSystemAlert.bind(this))

    // 自定义监听器
    this.setupCustomListeners()
  }

  private setupCustomListeners() {
    const listenerTypes = [
      'agent_update',
      'project_update',
      'task_update',
      'task_moved',
      'session_update',
      'new_session',
      'new_message',
      'new_comment',
      'new_attachment',
      'notification',
      'system_alert',
    ]

    listenerTypes.forEach(type => {
      this.socket?.on(type, (data: any) => {
        const listeners = this.listeners.get(type)
        if (listeners) {
          listeners.forEach(listener => listener(data))
        }
      })
    })
  }

  private handleDisconnect() {
    if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`)
      
      setTimeout(() => {
        if (this.token) {
          this.connect(this.token).catch(error => {
            console.error('重连失败:', error)
          })
        }
      }, this.config.reconnectInterval)
    }
  }

  // 事件处理函数
  private handleAgentUpdate(data: any) {
    store.dispatch(updateAgent({ id: data.id, updates: data }))
  }

  private handleProjectUpdate(data: any) {
    store.dispatch(updateProject({ id: data.id, updates: data }))
  }

  private handleTaskUpdate(data: any) {
    store.dispatch(updateTask({ id: data.id, updates: data }))
  }

  private handleTaskMoved(data: any) {
    store.dispatch(moveTask(data))
  }

  private handleSessionUpdate(data: any) {
    store.dispatch(updateSession({ id: data.id, updates: data }))
  }

  private handleNewSession(data: any) {
    store.dispatch(addSession(data))
  }

  private handleNewMessage(data: any) {
    // 消息会在聊天组件中处理
  }

  private handleNewComment(data: any) {
    store.dispatch(addComment(data))
  }

  private handleNewAttachment(data: any) {
    store.dispatch(addAttachment(data))
  }

  private handleNotification(data: any) {
    store.dispatch(addNotification({
      type: data.type || 'info',
      title: data.title,
      message: data.message,
    }))
  }

  private handleSystemAlert(data: any) {
    store.dispatch(addNotification({
      type: 'warning',
      title: '系统警报',
      message: data.message,
    }))
  }

  // 公共方法
  joinRoom(roomId: string) {
    this.socket?.emit('join_room', { roomId })
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave_room', { roomId })
  }

  sendMessage(type: string, data: any) {
    this.socket?.emit(type, {
      ...data,
      timestamp: new Date().toISOString(),
    })
  }

  subscribe(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)?.add(callback)
  }

  unsubscribe(type: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.delete(callback)
      if (listeners.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.listeners.clear()
    }
  }

  isConnected(): boolean {
    return !!this.socket?.connected
  }

  // 特定的应用方法
  sendChatMessage(roomId: string, content: string, metadata?: any) {
    this.sendMessage('chat_message', {
      roomId,
      content,
      metadata,
    })
  }

  sendTaskUpdate(taskId: string, updates: any) {
    this.sendMessage('task_update', {
      taskId,
      updates,
    })
  }

  sendAgentCommand(agentId: string, command: string, params: any) {
    this.sendMessage('agent_command', {
      agentId,
      command,
      params,
    })
  }

  requestStatusUpdate() {
    this.sendMessage('status_request', {})
  }
}

// 创建单例实例
export const webSocketService = new WebSocketService()

// 自定义Hook
export const useWebSocket = () => {
  return webSocketService
}