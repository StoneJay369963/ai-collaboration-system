import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { RootState } from '../store/store'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    username: string
    email: string
    role: 'user' | 'admin'
    createdAt: string
  }
  token: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface RegisterResponse {
  user: {
    id: string
    username: string
    email: string
    role: 'user' | 'admin'
    createdAt: string
  }
  token: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived'
  progress: number
  ownerId: string
  createdAt: string
  updatedAt: string
  deadline?: string
  tags: string[]
  memberCount: number
  aiAgentCount: number
  repositoryUrl?: string
  settings: {
    allowPublicAccess: boolean
    allowGuestComments: boolean
    autoMergeEnabled: boolean
    requireReview: boolean
  }
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  projectId: string
  assignedTo: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  deadline?: string
  estimatedHours?: number
  actualHours?: number
  tags: string[]
  dependencies: string[]
}

export interface AIAgent {
  id: string
  name: string
  type: 'developer' | 'designer' | 'tester' | 'ops' | 'general'
  status: 'online' | 'offline' | 'busy' | 'idle'
  capabilities: string[]
  currentTask: string | null
  completedTasks: number
  successRate: number
  avgResponseTime: number
  joinedAt: string
  lastActiveAt: string
  settings: {
    maxConcurrentTasks: number
    preferredTaskTypes: string[]
    autoAcceptTasks: boolean
    notificationsEnabled: boolean
  }
  metadata: {
    model: string
    version: string
    provider: string
    memory: number
    cpu: number
  }
}

export interface CollaborationSession {
  id: string
  projectId: string
  aiAgents: string[]
  status: 'active' | 'paused' | 'completed'
  startedAt: string
  endedAt?: string
  progress: number
  taskCount: number
  completedTasks: number
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderType: 'user' | 'ai'
  content: string
  timestamp: string
  type: 'text' | 'code' | 'file' | 'system'
  metadata?: Record<string, any>
}

// 创建基础API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['User', 'Project', 'Task', 'AIAgent', 'Session', 'Message'],
  endpoints: (builder) => ({
    // 认证相关
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    getCurrentUser: builder.query<LoginResponse['user'], void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    
    // 项目相关
    getProjects: builder.query<Project[], void>({
      query: () => '/projects',
      providesTags: ['Project'],
    }),
    getProject: builder.query<Project, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation<Project, Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>>({
      query: (project) => ({
        url: '/projects',
        method: 'POST',
        body: project,
      }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<Project, { id: string; updates: Partial<Project> }>({
      query: ({ id, updates }) => ({
        url: `/projects/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Project', id },
        'Project',
      ],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),
    
    // 任务相关
    getProjectTasks: builder.query<Task[], string>({
      query: (projectId) => `/projects/${projectId}/tasks`,
      providesTags: (result, error, projectId) => [
        { type: 'Task', id: projectId },
      ],
    }),
    getTask: builder.query<Task, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),
    createTask: builder.mutation<Task, { projectId: string; task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> }>({
      query: ({ projectId, task }) => ({
        url: `/projects/${projectId}/tasks`,
        method: 'POST',
        body: task,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Task', id: projectId },
      ],
    }),
    updateTask: builder.mutation<Task, { id: string; updates: Partial<Task> }>({
      query: ({ id, updates }) => ({
        url: `/tasks/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
      ],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
    assignTask: builder.mutation<Task, { taskId: string; agentId: string }>({
      query: ({ taskId, agentId }) => ({
        url: `/tasks/${taskId}/assign`,
        method: 'POST',
        body: { agentId },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Task', id: taskId },
      ],
    }),
    
    // AI代理相关
    getAIAgents: builder.query<AIAgent[], void>({
      query: () => '/ai-agents',
      providesTags: ['AIAgent'],
    }),
    getAIAgent: builder.query<AIAgent, string>({
      query: (id) => `/ai-agents/${id}`,
      providesTags: (result, error, id) => [{ type: 'AIAgent', id }],
    }),
    registerAIAgent: builder.mutation<AIAgent, Omit<AIAgent, 'id' | 'joinedAt' | 'lastActiveAt' | 'completedTasks' | 'successRate' | 'avgResponseTime'>>({
      query: (agent) => ({
        url: '/ai-agents/register',
        method: 'POST',
        body: agent,
      }),
      invalidatesTags: ['AIAgent'],
    }),
    updateAIAgent: builder.mutation<AIAgent, { id: string; updates: Partial<AIAgent> }>({
      query: ({ id, updates }) => ({
        url: `/ai-agents/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AIAgent', id },
      ],
    }),
    
    // 协作会话相关
    getSessions: builder.query<CollaborationSession[], string>({
      query: (projectId) => `/projects/${projectId}/sessions`,
      providesTags: ['Session'],
    }),
    getSession: builder.query<CollaborationSession, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Session', id }],
    }),
    createSession: builder.mutation<CollaborationSession, { projectId: string; session: Omit<CollaborationSession, 'id' | 'startedAt' | 'progress' | 'taskCount' | 'completedTasks'> }>({
      query: ({ projectId, session }) => ({
        url: `/projects/${projectId}/sessions`,
        method: 'POST',
        body: session,
      }),
      invalidatesTags: ['Session'],
    }),
    updateSession: builder.mutation<CollaborationSession, { id: string; updates: Partial<CollaborationSession> }>({
      query: ({ id, updates }) => ({
        url: `/sessions/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Session', id },
      ],
    }),
    
    // 消息相关
    getMessages: builder.query<Message[], string>({
      query: (roomId) => `/rooms/${roomId}/messages`,
      providesTags: ['Message'],
    }),
    sendMessage: builder.mutation<Message, { roomId: string; message: Omit<Message, 'id' | 'timestamp'> }>({
      query: ({ roomId, message }) => ({
        url: `/rooms/${roomId}/messages`,
        method: 'POST',
        body: message,
      }),
      invalidatesTags: ['Message'],
    }),
    
    // 系统状态
    getSystemStatus: builder.query<{
      status: 'healthy' | 'degraded' | 'unhealthy'
      services: Array<{
        name: string
        status: 'up' | 'down'
        latency: number
      }>
      stats: {
        totalProjects: number
        activeTasks: number
        onlineAgents: number
        activeSessions: number
      }
    }, void>({
      query: () => '/system/status',
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useAssignTaskMutation,
  useGetAIAgentsQuery,
  useGetAIAgentQuery,
  useRegisterAIAgentMutation,
  useUpdateAIAgentMutation,
  useGetSessionsQuery,
  useGetSessionQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetSystemStatusQuery,
} = api