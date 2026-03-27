import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  themeMode: 'light' | 'dark'
  sidebarOpen: boolean
  currentView: string
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
    timestamp: number
  }>
  modal: {
    isOpen: boolean
    type: string | null
    data: any
  }
  loading: {
    global: boolean
    operations: Record<string, boolean>
  }
}

const initialState: UIState = {
  themeMode: (localStorage.getItem('themeMode') as 'light' | 'dark') || 'light',
  sidebarOpen: true,
  currentView: 'dashboard',
  notifications: [],
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
  loading: {
    global: false,
    operations: {},
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.themeMode = action.payload
      localStorage.setItem('themeMode', action.payload)
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    setCurrentView: (state, action: PayloadAction<string>) => {
      state.currentView = action.payload
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp'>>) => {
      state.notifications.push({
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      })
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data || null,
      }
    },
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        data: null,
      }
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload
    },
    setOperationLoading: (state, action: PayloadAction<{ name: string; loading: boolean }>) => {
      state.loading.operations[action.payload.name] = action.payload.loading
    },
  },
})

export const {
  setThemeMode,
  toggleSidebar,
  setSidebarOpen,
  setCurrentView,
  addNotification,
  removeNotification,
  openModal,
  closeModal,
  setGlobalLoading,
  setOperationLoading,
} = uiSlice.actions

export default uiSlice.reducer
