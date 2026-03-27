import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Box,
  Typography,
  Collapse,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Folder as ProjectIcon,
  Assignment as TaskIcon,
  Code as CodeIcon,
  Chat as ChatIcon,
  SmartToy as AIIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  Group as TeamIcon,
  Timeline as TimelineIcon,
  Storage as StorageIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'

interface SidebarItem {
  id: string
  text: string
  icon: React.ReactNode
  path: string
  children?: SidebarItem[]
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen)
  const drawerWidth = useSelector((state: RootState) => state.ui.drawerWidth)
  
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({
    projects: true,
    tasks: true,
    ai: true,
  })
  
  const handleItemClick = (item: SidebarItem) => {
    if (item.children) {
      setOpenItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))
    } else {
      navigate(item.path)
    }
  }
  
  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      text: '仪表板',
      icon: <DashboardIcon />,
      path: '/',
    },
    {
      id: 'projects',
      text: '项目管理',
      icon: <ProjectIcon />,
      path: '/projects',
      children: [
        {
          id: 'all-projects',
          text: '所有项目',
          icon: <ProjectIcon />,
          path: '/projects',
        },
        {
          id: 'new-project',
          text: '新建项目',
          icon: <AddIcon />,
          path: '/projects/new',
        },
        {
          id: 'my-projects',
          text: '我的项目',
          icon: <ProjectIcon />,
          path: '/projects/my',
        },
        {
          id: 'shared-projects',
          text: '共享项目',
          icon: <TeamIcon />,
          path: '/projects/shared',
        },
      ],
    },
    {
      id: 'tasks',
      text: '任务管理',
      icon: <TaskIcon />,
      path: '/tasks',
      children: [
        {
          id: 'task-board',
          text: '任务看板',
          icon: <TaskIcon />,
          path: '/tasks/board',
        },
        {
          id: 'task-list',
          text: '任务列表',
          icon: <TaskIcon />,
          path: '/tasks/list',
        },
        {
          id: 'new-task',
          text: '新建任务',
          icon: <AddIcon />,
          path: '/tasks/new',
        },
        {
          id: 'my-tasks',
          text: '我的任务',
          icon: <TaskIcon />,
          path: '/tasks/my',
        },
      ],
    },
    {
      id: 'code',
      text: '代码编辑',
      icon: <CodeIcon />,
      path: '/code',
    },
    {
      id: 'chat',
      text: '实时聊天',
      icon: <ChatIcon />,
      path: '/chat',
    },
    {
      id: 'ai',
      text: 'AI协作',
      icon: <AIIcon />,
      path: '/ai',
      children: [
        {
          id: 'ai-agents',
          text: 'AI代理',
          icon: <AIIcon />,
          path: '/ai/agents',
        },
        {
          id: 'sessions',
          text: '协作会话',
          icon: <TeamIcon />,
          path: '/ai/sessions',
        },
        {
          id: 'knowledge',
          text: '知识库',
          icon: <StorageIcon />,
          path: '/ai/knowledge',
        },
      ],
    },
    {
      id: 'analytics',
      text: '分析监控',
      icon: <AnalyticsIcon />,
      path: '/analytics',
    },
    {
      id: 'settings',
      text: '系统设置',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ]
  
  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    const isActive = location.pathname === item.path
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openItems[item.id]
    
    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            selected={isActive}
            onClick={() => handleItemClick(item)}
            sx={{
              pl: depth * 2 + 2,
              pr: 2,
              py: 1,
              minHeight: 48,
              justifyContent: 'flex-start',
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'inherit',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isActive ? 'inherit' : 'action.active',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            />
            {hasChildren && (
              <Box sx={{ ml: 1 }}>
                {isOpen ? <ExpandLess /> : <ExpandMore />}
              </Box>
            )}
          </ListItemButton>
        </ListItem>
        
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child) => renderSidebarItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarOpen ? drawerWidth : 0,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: sidebarOpen ? drawerWidth : 0,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />
      
      <Box sx={{ overflow: 'auto', height: 'calc(100% - 64px)' }}>
        <Box sx={{ p: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2,
              textAlign: 'center',
            }}
          >
            {sidebarOpen ? 'AI协作开发系统' : '🤖'}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 1 }} />
        
        <List>
          {sidebarItems.map((item) => renderSidebarItem(item))}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        {/* 快速项目列表 */}
        <Box sx={{ p: 2 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: 'block', mb: 1 }}
          >
            最近项目
          </Typography>
          <List dense>
            <ListItemButton sx={{ borderRadius: 1, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ProjectIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Web应用开发"
                primaryTypographyProps={{ fontSize: 13 }}
              />
            </ListItemButton>
            <ListItemButton sx={{ borderRadius: 1, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ProjectIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="移动端应用"
                primaryTypographyProps={{ fontSize: 13 }}
              />
            </ListItemButton>
            <ListItemButton sx={{ borderRadius: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ProjectIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="API服务重构"
                primaryTypographyProps={{ fontSize: 13 }}
              />
            </ListItemButton>
          </List>
        </Box>
        
        {/* 系统状态 */}
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: 'block', mb: 1 }}
          >
            系统状态
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'success.main',
              }}
            />
            <Typography variant="caption">API服务: 正常</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'success.main',
              }}
            />
            <Typography variant="caption">数据库: 正常</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'success.main',
              }}
            />
            <Typography variant="caption">实时通信: 正常</Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default Sidebar