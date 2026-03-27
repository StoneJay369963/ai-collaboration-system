import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box } from '@mui/material'
import { RootState } from './store/store'
import { setThemeMode } from './store/slices/uiSlice'
import theme, { darkTheme } from './theme'

// Layout Components
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'

// Pages
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import DashboardPage from './features/dashboard/DashboardPage'
import ProjectsPage from './features/projects/ProjectsPage'
import TasksPage from './features/tasks/TasksPage'
import CodeEditorPage from './features/code/CodeEditorPage'
import ChatPage from './features/chat/ChatPage'
import AIPage from './features/ai/AIPage'
import AnalyticsPage from './features/analytics/AnalyticsPage'
import SettingsPage from './features/settings/SettingsPage'
import ProfilePage from './features/profile/ProfilePage'
import ProjectDetailPage from './features/projects/ProjectDetailPage'
import TaskDetailPage from './features/tasks/TaskDetailPage'
import AIAgentDetailPage from './features/ai/AIAgentDetailPage'
import SessionDetailPage from './features/ai/SessionDetailPage'
import NewProjectPage from './features/projects/NewProjectPage'
import NewTaskPage from './features/tasks/NewTaskPage'
import NotFoundPage from './components/common/NotFoundPage'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const loading = useSelector((state: RootState) => state.auth.loading)
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>加载中...</div>
      </Box>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

const App: React.FC = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const themeMode = useSelector((state: RootState) => state.ui.themeMode)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  
  // 监听系统主题偏好
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      dispatch(setThemeMode(e.matches ? 'dark' : 'light'))
    }
    
    // 如果用户没有手动设置主题，使用系统偏好
    if (!localStorage.getItem('themeMode')) {
      dispatch(setThemeMode(mediaQuery.matches ? 'dark' : 'light'))
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [dispatch])
  
  // 根据路由隐藏布局
  const hideLayout = ['/login', '/register'].includes(location.pathname)
  
  const currentTheme = themeMode === 'dark' ? darkTheme : theme

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {!hideLayout && isAuthenticated && (
          <>
            <Header />
            <Sidebar />
          </>
        )}
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'auto',
            backgroundColor: 'background.default',
          }}
        >
          {!hideLayout && <Box sx={{ height: 64 }} />} {/* Spacer for header */}
          
          <Box sx={{ flexGrow: 1, p: hideLayout ? 0 : 3 }}>
            <Routes>
              {/* 认证路由 */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* 受保护的路由 */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              
              {/* 项目路由 */}
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/new"
                element={
                  <ProtectedRoute>
                    <NewProjectPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/my"
                element={
                  <ProtectedRoute>
                    <ProjectsPage filter="my" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/shared"
                element={
                  <ProtectedRoute>
                    <ProjectsPage filter="shared" />
                  </ProtectedRoute>
                }
              />
              
              {/* 任务路由 */}
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <TasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/new"
                element={
                  <ProtectedRoute>
                    <NewTaskPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/:id"
                element={
                  <ProtectedRoute>
                    <TaskDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/board"
                element={
                  <ProtectedRoute>
                    <TasksPage view="board" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/list"
                element={
                  <ProtectedRoute>
                    <TasksPage view="list" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/my"
                element={
                  <ProtectedRoute>
                    <TasksPage filter="my" />
                  </ProtectedRoute>
                }
              />
              
              {/* 代码编辑路由 */}
              <Route
                path="/code"
                element={
                  <ProtectedRoute>
                    <CodeEditorPage />
                  </ProtectedRoute>
                }
              />
              
              {/* 实时聊天路由 */}
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              
              {/* AI协作路由 */}
              <Route
                path="/ai"
                element={
                  <ProtectedRoute>
                    <AIPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai/agents"
                element={
                  <ProtectedRoute>
                    <AIPage tab="agents" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai/agents/:id"
                element={
                  <ProtectedRoute>
                    <AIAgentDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai/sessions"
                element={
                  <ProtectedRoute>
                    <AIPage tab="sessions" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai/sessions/:id"
                element={
                  <ProtectedRoute>
                    <SessionDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai/knowledge"
                element={
                  <ProtectedRoute>
                    <AIPage tab="knowledge" />
                  </ProtectedRoute>
                }
              />
              
              {/* 分析监控路由 */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              
              {/* 设置路由 */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              
              {/* 个人资料路由 */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              
              {/* 重定向 */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              
              {/* 404页面 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App