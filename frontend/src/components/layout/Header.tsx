import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import {
  toggleSidebar,
  toggleThemeMode,
  markAllNotificationsAsRead,
  removeNotification,
} from '../../store/slices/uiSlice'
import { logout } from '../../store/slices/authSlice'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const themeMode = useSelector((state: RootState) => state.ui.themeMode)
  const notifications = useSelector((state: RootState) => state.ui.notifications)
  const user = useSelector((state: RootState) => state.auth.user)
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [notificationAnchorEl, setNotificationAnchorEl] = React.useState<null | HTMLElement>(null)
  
  const unreadNotifications = notifications.filter(n => !n.read).length
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  
  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget)
  }
  
  const handleMenuClose = () => {
    setAnchorEl(null)
  }
  
  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null)
  }
  
  const handleToggleTheme = () => {
    dispatch(toggleThemeMode())
  }
  
  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
    handleMenuClose()
  }
  
  const handleProfileClick = () => {
    navigate('/profile')
    handleMenuClose()
  }
  
  const handleSettingsClick = () => {
    navigate('/settings')
    handleMenuClose()
  }
  
  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead())
  }
  
  const handleNotificationClick = (notificationId: string) => {
    dispatch(removeNotification(notificationId))
    handleNotificationMenuClose()
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={() => dispatch(toggleSidebar())}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          🤖 AI协作开发系统
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 主题切换按钮 */}
          <IconButton
            color="inherit"
            onClick={handleToggleTheme}
            title={themeMode === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          >
            {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
          
          {/* 通知按钮 */}
          <IconButton
            color="inherit"
            onClick={handleNotificationMenuOpen}
            title="通知"
          >
            <Badge badgeContent={unreadNotifications} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          {/* 用户菜单 */}
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleProfileMenuOpen}
            title="用户菜单"
          >
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
              src={user?.avatar}
            >
              {user?.username?.charAt(0).toUpperCase() || <PersonIcon />}
            </Avatar>
          </IconButton>
        </Box>
      </Toolbar>
      
      {/* 通知菜单 */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">通知</Typography>
            {unreadNotifications > 0 && (
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer' }}
                onClick={handleMarkAllAsRead}
              >
                全部标记为已读
              </Typography>
            )}
          </Box>
          
          {notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              暂无通知
            </Typography>
          ) : (
            <Box>
              {notifications.slice(0, 10).map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  sx={{
                    py: 1.5,
                    borderLeft: notification.read ? 'none' : '3px solid',
                    borderLeftColor: `${notification.type}.main`,
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  }}
                >
                  <Box sx={{ ml: notification.read ? 0 : 1, width: '100%' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: notification.read ? 'normal' : 'bold',
                        color: notification.read ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: notification.read ? 'text.secondary' : 'text.primary',
                        whiteSpace: 'normal',
                        lineHeight: 1.4,
                        mt: 0.5,
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      {new Date(notification.timestamp).toLocaleString('zh-CN')}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Box>
          )}
          
          {notifications.length > 10 && (
            <Box sx={{ textAlign: 'center', pt: 1 }}>
              <Typography variant="body2" color="primary">
                查看更多...
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>
      
      {/* 用户菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { width: 200 },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {user?.username}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleProfileClick}>
          <PersonIcon sx={{ mr: 2, fontSize: 20 }} />
          个人资料
        </MenuItem>
        <MenuItem onClick={handleSettingsClick}>
          <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
          设置
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
          退出登录
        </MenuItem>
      </Menu>
    </AppBar>
  )
}

export default Header