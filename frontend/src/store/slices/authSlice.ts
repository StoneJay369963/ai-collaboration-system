import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'

interface User {
  id: string
  username: string
  email: string
  avatar?: string
  role: 'admin' | 'user' | 'guest'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  loading: boolean
  error: string | null
  socket: Socket | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  socket: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    // Mock login - replace with actual API call
    const mockUser: User = {
      id: '1',
      username: 'admin',
      email: credentials.email,
      role: 'admin',
    }
    const mockToken = 'mock-jwt-token'
    localStorage.setItem('token', mockToken)
    return { user: mockUser, token: mockToken }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (data: { username: string; email: string; password: string }) => {
    const mockUser: User = {
      id: '1',
      username: data.username,
      email: data.email,
      role: 'user',
    }
    const mockToken = 'mock-jwt-token'
    localStorage.setItem('token', mockToken)
    return { user: mockUser, token: mockToken }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.token = null
      state.socket = null
      localStorage.removeItem('token')
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    setSocket: (state, action: PayloadAction<Socket | null>) => {
      state.socket = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '登录失败'
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '注册失败'
      })
  },
})

export const { logout, setUser, setSocket, clearError } = authSlice.actions
export default authSlice.reducer
