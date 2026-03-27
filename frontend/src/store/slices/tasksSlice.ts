import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeId: string | null
  projectId: string
  createdAt: string
  updatedAt: string
  dueDate: string | null
  tags: string[]
}

interface TasksState {
  items: Task[]
  currentTask: Task | null
  loading: boolean
  error: string | null
}

const initialState: TasksState = {
  items: [],
  currentTask: null,
  loading: false,
  error: null,
}

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async (projectId?: string) => {
  // Mock data - replace with actual API call
  return [
    {
      id: '1',
      title: '实现用户认证',
      description: '完成登录注册功能',
      status: 'done' as const,
      priority: 'high' as const,
      assigneeId: '1',
      projectId: projectId || '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: null,
      tags: ['auth', 'frontend'],
    },
  ]
})

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload
    },
    updateTaskStatus: (state, action: PayloadAction<{ id: string; status: Task['status'] }>) => {
      const task = state.items.find(t => t.id === action.payload.id)
      if (task) {
        task.status = action.payload.status
        task.updatedAt = new Date().toISOString()
      }
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取任务失败'
      })
  },
})

export const { setCurrentTask, updateTaskStatus, clearError } = tasksSlice.actions
export default tasksSlice.reducer
