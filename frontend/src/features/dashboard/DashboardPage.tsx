import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Assignment as TaskIcon,
  Folder as ProjectIcon,
  SmartToy as AIIcon,
  Timeline as TimelineIcon,
  Code as CodeIcon,
  Chat as ChatIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  
  // 模拟数据
  const stats = {
    totalProjects: 12,
    activeTasks: 45,
    onlineAgents: 8,
    completedToday: 18,
  }
  
  const projects = [
    { id: '1', name: 'Web应用开发', progress: 75, status: 'active', tasks: 24, members: 5 },
    { id: '2', name: '移动端应用', progress: 30, status: 'active', tasks: 18, members: 3 },
    { id: '3', name: 'API服务重构', progress: 90, status: 'completed', tasks: 32, members: 6 },
    { id: '4', name: '数据库优化', progress: 15, status: 'planning', tasks: 8, members: 2 },
  ]
  
  const recentTasks = [
    { id: '1', title: '实现用户认证系统', project: 'Web应用开发', status: 'completed', priority: 'high', assignedTo: 'AI Dev' },
    { id: '2', title: '设计UI组件库', project: '移动端应用', status: 'in_progress', priority: 'medium', assignedTo: 'AI Designer' },
    { id: '3', title: '优化数据库查询', project: 'API服务重构', status: 'review', priority: 'critical', assignedTo: 'AI Ops' },
    { id: '4', title: '编写API文档', project: 'Web应用开发', status: 'todo', priority: 'low', assignedTo: null },
  ]
  
  const aiAgents = [
    { id: '1', name: 'AI Dev', type: 'developer', status: 'online', tasks: 5, successRate: 92 },
    { id: '2', name: 'AI Designer', type: 'designer', status: 'online', tasks: 3, successRate: 88 },
    { id: '3', name: 'AI Tester', type: 'tester', status: 'busy', tasks: 8, successRate: 95 },
    { id: '4', name: 'AI Ops', type: 'ops', status: 'idle', tasks: 0, successRate: 90 },
  ]
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'active': return 'primary'
      case 'in_progress': return 'warning'
      case 'review': return 'info'
      case 'todo': return 'default'
      case 'planning': return 'secondary'
      default: return 'default'
    }
  }
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }
  
  const getAITypeColor = (type: string) => {
    switch (type) {
      case 'developer': return '#4CAF50'
      case 'designer': return '#9C27B0'
      case 'tester': return '#FF9800'
      case 'ops': return '#607D8B'
      default: return '#795548'
    }
  }

  return (
    <Box>
      {/* 欢迎标题 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          欢迎回来！👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          今日有 {stats.activeTasks} 个活跃任务，{stats.onlineAgents} 个AI代理在线
        </Typography>
      </Box>
      
      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  bgcolor: 'primary.light', 
                  color: 'primary.contrastText',
                  mr: 2 
                }}>
                  <ProjectIcon />
                </Box>
                <Box>
                  <Typography variant="h4">{stats.totalProjects}</Typography>
                  <Typography variant="body2" color="text.secondary">总项目数</Typography>
                </Box>
              </Box>
              <Button 
                variant="text" 
                size="small" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/projects/new')}
              >
                新建项目
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  bgcolor: 'success.light', 
                  color: 'success.contrastText',
                  mr: 2 
                }}>
                  <TaskIcon />
                </Box>
                <Box>
                  <Typography variant="h4">{stats.activeTasks}</Typography>
                  <Typography variant="body2" color="text.secondary">活跃任务</Typography>
                </Box>
              </Box>
              <Button 
                variant="text" 
                size="small" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/tasks/new')}
              >
                新建任务
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  bgcolor: 'warning.light', 
                  color: 'warning.contrastText',
                  mr: 2 
                }}>
                  <AIIcon />
                </Box>
                <Box>
                  <Typography variant="h4">{stats.onlineAgents}</Typography>
                  <Typography variant="body2" color="text.secondary">在线AI代理</Typography>
                </Box>
              </Box>
              <Button 
                variant="text" 
                size="small" 
                onClick={() => navigate('/ai/agents')}
              >
                查看所有代理
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  bgcolor: 'info.light', 
                  color: 'info.contrastText',
                  mr: 2 
                }}>
                  <CheckCircleIcon />
                </Box>
                <Box>
                  <Typography variant="h4">{stats.completedToday}</Typography>
                  <Typography variant="body2" color="text.secondary">今日完成</Typography>
                </Box>
              </Box>
              <Button 
                variant="text" 
                size="small" 
                onClick={() => navigate('/tasks?status=completed')}
              >
                查看已完成
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* 主要内容区域 */}
      <Grid container spacing={3}>
        {/* 项目进度 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="项目进度"
              action={
                <IconButton onClick={() => navigate('/projects')}>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              <List>
                {projects.map((project) => (
                  <React.Fragment key={project.id}>
                    <ListItem
                      sx={{ px: 0 }}
                      secondaryAction={
                        <Button 
                          size="small"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          查看
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <ProjectIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ mr: 2 }}>
                              {project.name}
                            </Typography>
                            <Chip
                              label={project.status}
                              size="small"
                              color={getStatusColor(project.status) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={project.progress} 
                                sx={{ flexGrow: 1, mr: 2 }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                {project.progress}%
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                <TaskIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                {project.tasks} 任务
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                👥 {project.members} 成员
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* AI代理状态 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="AI代理状态"
              action={
                <IconButton onClick={() => navigate('/ai/agents')}>
                  <RefreshIcon />
                </IconButton>
              }
            />
            <CardContent>
              <List>
                {aiAgents.map((agent) => (
                  <ListItem key={agent.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getAITypeColor(agent.type) }}>
                        {agent.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2">
                            {agent.name}
                          </Typography>
                          <Chip
                            label={agent.status}
                            size="small"
                            color={
                              agent.status === 'online' ? 'success' :
                              agent.status === 'busy' ? 'warning' :
                              agent.status === 'idle' ? 'default' : 'error'
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                            📋 {agent.tasks} 任务
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ✅ {agent.successRate}% 成功率
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
          
          {/* 快速操作 */}
          <Card sx={{ mt: 3 }}>
            <CardHeader title="快速操作" />
            <CardContent>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CodeIcon />}
                    onClick={() => navigate('/code')}
                    sx={{ mb: 1 }}
                  >
                    代码编辑
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ChatIcon />}
                    onClick={() => navigate('/chat')}
                    sx={{ mb: 1 }}
                  >
                    实时聊天
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TimelineIcon />}
                    onClick={() => navigate('/analytics')}
                    sx={{ mb: 1 }}
                  >
                    分析报表
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AIIcon />}
                    onClick={() => navigate('/ai/sessions')}
                    sx={{ mb: 1 }}
                  >
                    协作会话
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 最近任务 */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="最近任务"
              action={
                <Button 
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/tasks/new')}
                >
                  新建任务
                </Button>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                {recentTasks.map((task) => (
                  <Grid item xs={12} sm={6} md={3} key={task.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Chip
                            label={task.priority}
                            size="small"
                            color={getPriorityColor(task.priority) as any}
                          />
                          <Chip
                            label={task.status}
                            size="small"
                            color={getStatusColor(task.status) as any}
                          />
                        </Box>
                        <Typography variant="subtitle2" gutterBottom>
                          {task.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          📁 {task.project}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          🤖 {task.assignedTo || '未分配'}
                        </Typography>
                        <Box sx={{ mt: 2, textAlign: 'right' }}>
                          <Button 
                            size="small"
                            onClick={() => navigate(`/tasks/${task.id}`)}
                          >
                            查看详情
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 系统状态 */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="系统状态"
              subheader="所有服务运行正常"
              action={
                <Button 
                  startIcon={<TrendingUpIcon />}
                  onClick={() => navigate('/analytics')}
                >
                  详细分析
                </Button>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6">API服务</Typography>
                    <Typography variant="body2" color="text.secondary">正常</Typography>
                    <Typography variant="caption" color="text.secondary">响应时间 120ms</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6">数据库</Typography>
                    <Typography variant="body2" color="text.secondary">正常</Typography>
                    <Typography variant="caption" color="text.secondary">连接数 24/100</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6">实时通信</Typography>
                    <Typography variant="body2" color="text.secondary">正常</Typography>
                    <Typography variant="caption" color="text.secondary">在线连接 8</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* 底部信息 */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          AI协作开发系统 v2.0 | 最后更新: 今天 20:36
        </Typography>
      </Box>
    </Box>
  )
}

export default DashboardPage