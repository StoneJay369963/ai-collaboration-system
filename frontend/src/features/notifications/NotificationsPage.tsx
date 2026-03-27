import React, { useState } from 'react'
import {
  Box,
  Typography,
  Container,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Button,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Badge,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
} from '@mui/material'
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'

// Types
interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: string
}

interface NotificationSettings {
  email: boolean
  desktop: boolean
  sound: boolean
  digest: 'realtime' | 'hourly' | 'daily'
}

// Sample data
const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: '任务完成',
    message: 'AI Agent 已完成代码审查任务',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    action: '查看详情',
  },
  {
    id: '2',
    type: 'warning',
    title: '资源警告',
    message: 'CPU使用率已达到75%，请关注',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: '3',
    type: 'error',
    title: '部署失败',
    message: '项目部署到生产环境失败',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: true,
    action: '查看日志',
  },
  {
    id: '4',
    type: 'info',
    title: '新成员加入',
    message: '张三加入了项目团队',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
  },
  {
    id: '5',
    type: 'success',
    title: '构建成功',
    message: 'CI/CD流水线构建成功',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    read: true,
  },
  {
    id: '6',
    type: 'info',
    title: '会议提醒',
    message: '项目评审会议将在30分钟后开始',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: false,
    action: '加入会议',
  },
]

const typeIcons = {
  success: <CheckCircleIcon color="success" />,
  error: <ErrorIcon color="error" />,
  warning: <WarningIcon color="warning" />,
  info: <InfoIcon color="info" />,
}

const typeColors = {
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#1976d2',
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    desktop: true,
    sound: false,
    digest: 'realtime',
  })

  const filteredNotifications = notifications.filter((n) => {
    const matchesFilter = filter === 'all' || !n.read
    const matchesSearch =
      searchQuery === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 1000 / 60)
    const hours = Math.floor(diff / 1000 / 60 / 60)
    const days = Math.floor(diff / 1000 / 60 / 60 / 24)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              通知中心
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {unreadCount > 0 ? `您有 ${unreadCount} 条未读通知` : '暂无未读通知'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsOpen(true)}
            >
              设置
            </Button>
          </Stack>
        </Box>

        {/* Search and Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="搜索通知..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <ToggleButtonGroup
              value={filter}
              exclusive
              onChange={(_, value) => value && setFilter(value)}
              size="small"
            >
              <ToggleButton value="all">全部</ToggleButton>
              <ToggleButton value="unread">
                未读
                {unreadCount > 0 && (
                  <Badge
                    badgeContent={unreadCount}
                    color="error"
                    sx={{ ml: 1 }}
                  />
                )}
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Paper>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            全部标为已读
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            onClick={handleClearAll}
            color="error"
            disabled={notifications.length === 0}
          >
            清空通知
          </Button>
        </Box>

        {/* Notification List */}
        <Paper>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                暂无通知
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.read
                        ? 'transparent'
                        : 'rgba(25, 118, 210, 0.05)',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      py: 2,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          backgroundColor: `${typeColors[notification.type]}15`,
                        }}
                      >
                        {typeIcons[notification.type]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: notification.read ? 400 : 600,
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: 'primary.main',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="span"
                          >
                            {notification.message}
                          </Typography>
                          <Box
                            component="span"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(notification.timestamp)}
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        {!notification.read && (
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="标记为已读"
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        )}
                        {notification.action && (
                          <Button size="small" variant="outlined">
                            {notification.action}
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(notification.id)}
                          title="删除"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {/* Load More */}
        {filteredNotifications.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />}>
              加载更多
            </Button>
          </Box>
        )}

        {/* Settings Dialog */}
        <Dialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>通知设置</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.email}
                    onChange={(e) =>
                      setSettings({ ...settings, email: e.target.checked })
                    }
                  />
                }
                label="邮件通知"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.desktop}
                    onChange={(e) =>
                      setSettings({ ...settings, desktop: e.target.checked })
                    }
                  />
                }
                label="桌面通知"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sound}
                    onChange={(e) =>
                      setSettings({ ...settings, sound: e.target.checked })
                    }
                  />
                }
                label="声音提醒"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.digest !== 'realtime'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        digest: e.target.checked ? 'daily' : 'realtime',
                      })
                    }
                  }
                label="通知汇总"
              />
              {settings.digest !== 'realtime' && (
                <Typography variant="body2" color="text.secondary">
                  将以{' '}
                  <Chip
                    label={
                      settings.digest === 'hourly'
                        ? '每小时'
                        : '每天'
                    }
                    size="small"
                  />{' '}
                  为周期汇总发送通知
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsOpen(false)}>关闭</Button>
            <Button variant="contained" onClick={() => setSettingsOpen(false)}>
              保存设置
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

export default NotificationsPage