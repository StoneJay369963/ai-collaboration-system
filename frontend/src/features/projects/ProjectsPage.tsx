import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Chip,
  LinearProgress,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Fab,
  Paper,
  Divider,
  Avatar,
  AvatarGroup,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Folder as ProjectIcon,
  Group as GroupIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

interface Project {
  id: string
  name: string
  description: string
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived'
  progress: number
  owner: string
  createdAt: string
  deadline?: string
  tags: string[]
  memberCount: number
  aiAgentCount: number
  priority: 'low' | 'medium' | 'high'
}

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null)
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null)
  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    tags: [] as string[],
  })
  
  // 模拟项目数据
  const projects: Project[] = [
    {
      id: '1',
      name: 'Web应用开发',
      description: '构建现代化的Web应用，包含前端React和后端Node.js服务',
      status: 'active',
      progress: 75,
      owner: '张三',
      createdAt: '2026-03-20',
      deadline: '2026-04-30',
      tags: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
      memberCount: 5,
      aiAgentCount: 3,
      priority: 'high',
    },
    {
      id: '2',
      name: '移动端应用',
      description: '开发跨平台的移动应用，支持iOS和Android',
      status: 'active',
      progress: 30,
      owner: '李四',
      createdAt: '2026-03-15',
      deadline: '2026-05-15',
      tags: ['React Native', 'Redux', 'Firebase'],
      memberCount: 3,
      aiAgentCount: 2,
      priority: 'medium',
    },
    {
      id: '3',
      name: 'API服务重构',
      description: '重构现有的API服务，提高性能和可维护性',
      status: 'completed',
      progress: 100,
      owner: '王五',
      createdAt: '2026-03-01',
      deadline: '2026-03-25',
      tags: ['Express.js', 'Docker', 'PostgreSQL', 'Redis'],
      memberCount: 6,
      aiAgentCount: 4,
      priority: 'high',
    },
    {
      id: '4',
      name: '数据库优化',
      description: '优化数据库查询性能，增加缓存层',
      status: 'planning',
      progress: 15,
      owner: '赵六',
      createdAt: '2026-03-26',
      tags: ['MySQL', 'Redis', 'Performance'],
      memberCount: 2,
      aiAgentCount: 1,
      priority: 'medium',
    },
    {
      id: '5',
      name: 'UI组件库',
      description: '开发企业内部使用的UI组件库',
      status: 'active',
      progress: 60,
      owner: '钱七',
      createdAt: '2026-03-10',
      deadline: '2026-04-20',
      tags: ['Storybook', 'Design System', 'TypeScript'],
      memberCount: 4,
      aiAgentCount: 2,
      priority: 'low',
    },
    {
      id: '6',
      name: '文档系统',
      description: '建立技术文档和知识库系统',
      status: 'paused',
      progress: 40,
      owner: '孙八',
      createdAt: '2026-03-05',
      tags: ['VuePress', 'Markdown', 'Search'],
      memberCount: 3,
      aiAgentCount: 1,
      priority: 'low',
    },
  ]
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'planning': return 'info'
      case 'paused': return 'warning'
      case 'completed': return 'primary'
      case 'archived': return 'default'
      default: return 'default'
    }
  }
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'default'
    }
  }
  
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget)
  }
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null)
  }
  
  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget)
  }
  
  const handleSortClose = () => {
    setSortAnchorEl(null)
  }
  
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'grid' | 'list' | null,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode)
    }
  }
  
  const filteredProjects = projects.filter(project => {
    // 搜索过滤
    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !project.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false
    }
    
    // 状态过滤
    if (activeFilters.status.length > 0 && !activeFilters.status.includes(project.status)) {
      return false
    }
    
    // 优先级过滤
    if (activeFilters.priority.length > 0 && !activeFilters.priority.includes(project.priority)) {
      return false
    }
    
    return true
  })

  return (
    <Container maxWidth="xl">
      {/* 页面标题和操作栏 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            项目管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/new')}
            size="large"
          >
            新建项目
          </Button>
        </Box>
        
        {/* 搜索和过滤栏 */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="搜索项目名称、描述或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  startIcon={<FilterIcon />}
                  onClick={handleFilterClick}
                  variant="outlined"
                >
                  筛选
                </Button>
                <Button
                  startIcon={<SortIcon />}
                  onClick={handleSortClick}
                  variant="outlined"
                >
                  排序
                </Button>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size="small"
                >
                  <ToggleButton value="grid">
                    <Tooltip title="网格视图">
                      <GridViewIcon />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="list">
                    <Tooltip title="列表视图">
                      <ListViewIcon />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
          </Grid>
          
          {/* 活动过滤器 */}
          {(activeFilters.status.length > 0 || activeFilters.priority.length > 0) && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {activeFilters.status.map(status => (
                <Chip
                  key={status}
                  label={`状态: ${status}`}
                  size="small"
                  onDelete={() => setActiveFilters(prev => ({
                    ...prev,
                    status: prev.status.filter(s => s !== status)
                  }))}
                />
              ))}
              {activeFilters.priority.map(priority => (
                <Chip
                  key={priority}
                  label={`优先级: ${priority}`}
                  size="small"
                  onDelete={() => setActiveFilters(prev => ({
                    ...prev,
                    priority: prev.priority.filter(p => p !== priority)
                  }))}
                />
              ))}
              <Button
                size="small"
                onClick={() => setActiveFilters({ status: [], priority: [], tags: [] })}
              >
                清除所有
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* 项目统计 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">
              {projects.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              总项目数
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {projects.filter(p => p.status === 'active').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              活跃项目
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {projects.reduce((sum, p) => sum + p.memberCount, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              团队成员
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {projects.reduce((sum, p) => sum + p.aiAgentCount, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI代理数
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* 项目列表/网格 */}
      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <ProjectIcon />
                    </Avatar>
                  }
                  action={
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  }
                  title={
                    <Typography variant="h6" noWrap>
                      {project.name}
                    </Typography>
                  }
                  subheader={`创建者: ${project.owner} • ${project.createdAt}`}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
                    {project.description}
                  </Typography>
                  
                  {/* 进度条 */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        完成进度
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={project.progress} 
                      color={project.progress === 100 ? 'primary' : 'primary'}
                    />
                  </Box>
                  
                  {/* 标签 */}
                  <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {project.tags.slice(0, 3).map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                    {project.tags.length > 3 && (
                      <Chip label={`+${project.tags.length - 3}`} size="small" />
                    )}
                  </Box>
                  
                  {/* 状态和优先级 */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={project.status}
                      size="small"
                      color={getStatusColor(project.status) as any}
                    />
                    <Chip
                      label={project.priority}
                      size="small"
                      color={getPriorityColor(project.priority) as any}
                    />
                  </Box>
                  
                  {/* 统计信息 */}
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <GroupIcon fontSize="small" color="action" />
                        <Typography variant="caption" display="block">
                          {project.memberCount}人
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <TrendingUpIcon fontSize="small" color="action" />
                        <Typography variant="caption" display="block">
                          {project.aiAgentCount}AI
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="caption" display="block">
                          {project.deadline ? '有期限' : '无期限'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    fullWidth
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    进入项目
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // 列表视图
        <Paper>
          {filteredProjects.map((project, index) => (
            <React.Fragment key={project.id}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <ProjectIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ mr: 2 }}>
                      {project.name}
                    </Typography>
                    <Chip
                      label={project.status}
                      size="small"
                      color={getStatusColor(project.status) as any}
                    />
                    <Chip
                      label={project.priority}
                      size="small"
                      color={getPriorityColor(project.priority) as any}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {project.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      <GroupIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                      {project.memberCount} 成员
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <TrendingUpIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                      {project.aiAgentCount} AI代理
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <ProjectIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                      {project.owner}
                    </Typography>
                    {project.deadline && (
                      <Typography variant="caption" color="text.secondary">
                        <TimeIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                        截止: {project.deadline}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ minWidth: 200, textAlign: 'right' }}>
                  <Box sx={{ mb: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={project.progress} 
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {project.progress}% 完成
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    查看详情
                  </Button>
                </Box>
              </Box>
              {index < filteredProjects.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Paper>
      )}
      
      {/* 空状态 */}
      {filteredProjects.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ProjectIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            未找到项目
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            尝试调整筛选条件或创建新项目
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/new')}
          >
            创建第一个项目
          </Button>
        </Box>
      )}
      
      {/* 悬浮操作按钮 */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        onClick={() => navigate('/projects/new')}
      >
        <AddIcon />
      </Fab>
      
      {/* 筛选菜单 */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem disabled>状态筛选</MenuItem>
        {['planning', 'active', 'paused', 'completed', 'archived'].map((status) => (
          <MenuItem
            key={status}
            onClick={() => setActiveFilters(prev => ({
              ...prev,
              status: prev.status.includes(status)
                ? prev.status.filter(s => s !== status)
                : [...prev.status, status]
            }))}
          >
            <CheckCircleIcon
              sx={{ 
                mr: 2, 
                fontSize: 20, 
                color: activeFilters.status.includes(status) ? 'primary.main' : 'transparent' 
              }}
            />
            {status}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem disabled>优先级筛选</MenuItem>
        {['low', 'medium', 'high'].map((priority) => (
          <MenuItem
            key={priority}
            onClick={() => setActiveFilters(prev => ({
              ...prev,
              priority: prev.priority.includes(priority)
                ? prev.priority.filter(p => p !== priority)
                : [...prev.priority, priority]
            }))}
          >
            <CheckCircleIcon
              sx={{ 
                mr: 2, 
                fontSize: 20, 
                color: activeFilters.priority.includes(priority) ? 'primary.main' : 'transparent' 
              }}
            />
            {priority}
          </MenuItem>
        ))}
      </Menu>
      
      {/* 排序菜单 */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
      >
        <MenuItem onClick={handleSortClose}>按创建时间（最新）</MenuItem>
        <MenuItem onClick={handleSortClose}>按截止日期</MenuItem>
        <MenuItem onClick={handleSortClose}>按进度</MenuItem>
        <MenuItem onClick={handleSortClose}>按优先级</MenuItem>
        <MenuItem onClick={handleSortClose}>按名称（A-Z）</MenuItem>
      </Menu>
    </Container>
  )
}

export default ProjectsPage