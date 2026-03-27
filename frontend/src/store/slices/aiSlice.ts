import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface AIAgent {
  id: string
  name: string
  role: string
  avatar: string
  status: 'idle' | 'working' | 'error'
  capabilities: string[]
  currentTask: string | null
  performance: {
    tasksCompleted: number
    successRate: number
    averageResponseTime: number
  }
}

export interface Session {
  id: string
  name: string
  agentIds: string[]
  status: 'active' | 'paused' | 'completed'
  createdAt: string
  messages: Array<{
    id: string
    agentId: string
    content: string
    timestamp: string
    type: 'message' | 'action' | 'system'
  }>
}

interface AIState {
  agents: AIAgent[]
  sessions: Session[]
  currentSession: Session | null
  loading: boolean
  error: string | null
}

const initialState: AIState = {
  agents: [
    {
      id: '1',
      name: 'CodeMaster',
      role: '代码专家',
      avatar: '/avatars/ai-1.png',
      status: 'idle',
      capabilities: ['coding', 'review', 'debug'],
      currentTask: null,
      performance: {
        tasksCompleted: 156,
        successRate: 0.94,
        averageResponseTime: 1200,
      },
    },
    {
      id: '2',
      name: 'ArchiThink',
      role: '架构师',
      avatar: '/avatars/ai-2.png',
      status: 'idle',
      capabilities: ['architecture', 'design', 'planning'],
      currentTask: null,
      performance: {
        tasksCompleted: 89,
        successRate: 0.91,
        averageResponseTime: 2100,
      },
    },
  ],
  sessions: [],
  currentSession: null,
  loading: false,
  error: null,
}

export const fetchAgents = createAsyncThunk('ai/fetchAgents', async () => {
  return initialState.agents
})

export const createSession = createAsyncThunk(
  'ai/createSession',
  async (data: { name: string; agentIds: string[] }) => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      agentIds: data.agentIds,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      messages: [],
    } as Session
  }
)

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<Session | null>) => {
      state.currentSession = action.payload
    },
    addMessage: (state, action: PayloadAction<{ sessionId: string; message: Session['messages'][0] }>) => {
      const session = state.sessions.find(s => s.id === action.payload.sessionId)
      if (session) {
        session.messages.push(action.payload.message)
      }
    },
    updateAgentStatus: (state, action: PayloadAction<{ id: string; status: AIAgent['status'] }>) => {
      const agent = state.agents.find(a => a.id === action.payload.id)
      if (agent) {
        agent.status = action.payload.status
      }
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.agents = action.payload
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.sessions.push(action.payload)
        state.currentSession = action.payload
      })
  },
})

export const { setCurrentSession, addMessage, updateAgentStatus, clearError } = aiSlice.actions
export default aiSlice.reducer
