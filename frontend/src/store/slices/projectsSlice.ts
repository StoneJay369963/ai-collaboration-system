import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface Project {
  id: string
  name: string
  description: string
  status: 'planning' | 'active' | 'completed' | 'archived'
  progress: number
  createdAt: string
  updatedAt: string
  ownerId: string
  members: string[]
  tags: string[]
}

interface ProjectsState {
  items: Project[]
  currentProject: Project | null
  loading: boolean
  error: string | null
  filters: {
    status: string | null
    search: string
    tags: string[]
  }
}

const initialState: ProjectsState = {
  items: [],
  currentProject: null,
  loading: false,
  error: null,
  filters: {
    status: null,
    search: '',
    tags: [],
  },
}

export const fetchProjects = createAsyncThunk('projects/fetchProjects', async () => {
  // Mock data - replace with actual API call
  return [
    {
      id: '1',
      name: 'AI协作平台',
      description: '多AI协同开发系统',
      status: 'active' as const,
      progress: 75,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: '1',
      members: ['1', '2'],
      tags: ['AI', '协作'],
    },
  ]
})

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (data: Partial<Project>) => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Project
  }
)

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<ProjectsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取项目失败'
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
  },
})

export const { setCurrentProject, setFilters, clearError } = projectsSlice.actions
export default projectsSlice.reducer
