import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Container,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  LinearProgress,
} from '@mui/material'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import FlagIcon from '@mui/icons-material/Flag'

// Types
interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'review' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee?: string
  deadline?: string
  tags: string[]
}

interface Column {
  id: string
  title: string
  taskIds: string[]
}

interface BoardData {
  tasks: { [key: string]: Task }
  columns: { [key: string]: Column }
  columnOrder: string[]
}

// Priority colors
const priorityColors: Record<string, string> = {
  low: '#4caf50',
  medium: '#2196f3',
  high: '#ff9800',
  critical: '#f44336',
}

// Status labels
const statusLabels: Record<string, string> = {
  todo: '待办',
  in_progress: '进行中',
  review: '审核中',
  completed: '已完成',
}

// Sample data
const initialData: BoardData = {
  tasks: {
    'task-1': {
      id: 'task-1',
      title: '设计数据库架构',
      description: '设计系统数据库架构，包含用户、项目、任务表',
      status: 'todo',
      priority: 'high',
      assignee: '张三',
      deadline: '2026-04-01',
      tags: ['数据库', '架构'],
    },
    'task-2': {
      id: 'task-2',
      title: '实现用户认证API',
      description: '开发登录、注册、Token验证接口',
      status: 'in_progress',
      priority: 'critical',
      assignee: '李四',
      deadline: '2026-03-30',
      tags: ['API', '后端'],
    },
    'task-3': {
      id: 'task-3',
      title: '前端组件开发',
      description: '开发项目列表、任务卡片等UI组件',
      status: 'todo',
      priority: 'medium',
      assignee: '王五',
      tags: ['前端', 'UI'],
    },
    'task-4': {
      id: 'task-4',
      title: '代码审查',
      description: '审查最新提交的代码',
      status: 'review',
      priority: 'low',
      assignee: '赵六',
      tags: ['审查'],
    },
    'task-5': {
      id: 'task-5',
      title: '编写API文档',
      description: '编写RESTful API接口文档',
      status: 'completed',
      priority: 'medium',
      assignee: '张三',
      tags: ['文档'],
    },
    'task-6': {
      id: 'task-6',
      title: '性能优化',
      description: '优化数据库查询和缓存机制',
      status: 'todo',
      priority: 'high',
      tags: ['性能'],
    },
  },
  columns: {
    todo: {
      id: 'todo',
      title: '待办',
      taskIds: ['task-1', 'task-3', 'task-6'],
    },
    in_progress: {
      id: 'in_progress',
      title: '进行中',
      taskIds: ['task-2'],
    },
    review: {
      id: 'review',
      title: '审核中',
      taskIds: ['task-4'],
    },
    completed: {
      id: 'completed',
      title: '已完成',
      taskIds: ['task-5'],
    },
  },
  columnOrder: ['todo', 'in_progress', 'review', 'completed'],
}

const TasksPage: React.FC = () => {
  const [data, setData] = useState<BoardData>(initialData)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assignee: '',
    deadline: '',
    tags: '',
  })

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const start = data.columns[source.droppableId]
    const finish = data.columns[destination.droppableId]

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds)
      newTaskIds.splice(source.index, 1)
      newTaskIds.splice(destination.index, 0, draggableId)

      const newColumn = {
        ...start,
        taskIds: newTaskIds,
      }

      const newState = {
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      }

      setData(newState)
      return
    }

    // Moving from one column to another
    const startTaskIds = Array.from(start.taskIds)
    startTaskIds.splice(source.index, 1)
    const newStart = {
      ...start,
      taskIds: startTaskIds,
    }

    const finishTaskIds = Array.from(finish.taskIds)
    finishTaskIds.splice(destination.index, 0, draggableId)
    const newFinish = {
      ...finish,
      taskIds: finishTaskIds,
    }

    // Update task status
    const updatedTask = {
      ...data.tasks[draggableId],
      status: finish.id as Task['status'],
    }

    const newState = {
      ...data,
      tasks: {
        ...data.tasks,
        [draggableId]: updatedTask,
      },
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    }

    setData(newState)
  }

  const handleAddTask = () => {
    const taskId = `task-${Date.now()}`
    const task: Task = {
      id: taskId,
      title: newTask.title,
      description: newTask.description,
      status: 'todo',
      priority: newTask.priority,
      assignee: newTask.assignee || undefined,
      deadline: newTask.deadline || undefined,
      tags: newTask.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }

    const newState = {
      ...data,
      tasks: {
        ...data.tasks,
        [taskId]: task,
      },
      columns: {
        ...data.columns,
        todo: {
          ...data.columns.todo,
          taskIds: [...data.columns.todo.taskIds, taskId],
        },
      },
    }

    setData(newState)
    setDialogOpen(false)
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      assignee: '',
      deadline: '',
      tags: '',
    })
  }

  const getColumnProgress = (columnId: string) => {
    const taskIds = data.columns[columnId].taskIds
    if (taskIds.length === 0) return 0
    const completed = taskIds.filter(
      (id) => data.tasks[id].status === 'completed'
    ).length
    return Math.round((completed / taskIds.length) * 100)
  }

  return (
    <Container maxWidth="xl">
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
              任务看板
            </Typography>
            <Typography variant="body2" color="text.secondary">
              拖拽任务卡片以更改状态
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            新建任务
          </Button>
        </Box>

        {/* Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 2,
              minHeight: '70vh',
            }}
          >
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId]
              const tasks = column.taskIds.map((taskId) => data.tasks[taskId])

              return (
                <Paper
                  key={column.id}
                  sx={{
                    minWidth: 300,
                    maxWidth: 300,
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Column Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {column.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tasks.length} 个任务
                      </Typography>
                    </Box>
                    <Chip
                      label={`${getColumnProgress(columnId)}%`}
                      size="small"
                      sx={{ backgroundColor: '#fff' }}
                    />
                  </Box>

                  {/* Progress Bar */}
                  <LinearProgress
                    variant="determinate"
                    value={getColumnProgress(columnId)}
                    sx={{ mb: 2, borderRadius: 1 }}
                  />

                  {/* Tasks */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          flex: 1,
                          minHeight: 100,
                          backgroundColor: snapshot.isDraggingOver
                            ? 'rgba(0,0,0,0.05)'
                            : 'transparent',
                          borderRadius: 1,
                          transition: 'background-color 0.2s',
                        }}
                      >
                        {tasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Paper
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{
                                  p: 2,
                                  mb: 2,
                                  backgroundColor: '#fff',
                                  borderRadius: 2,
                                  boxShadow: snapshot.isDragging
                                    ? 4
                                    : 1,
                                  transform: snapshot.isDragging
                                    ? 'rotate(3deg)'
                                    : 'none',
                                  transition: 'box-shadow 0.2s, transform 0.2s',
                                  '&:hover': {
                                    boxShadow: 2,
                                  },
                                }}
                              >
                                {/* Priority Flag */}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    mb: 1,
                                  }}
                                >
                                  <FlagIcon
                                    sx={{
                                      fontSize: 18,
                                      color: priorityColors[task.priority],
                                    }}
                                  />
                                  <IconButton size="small">
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Box>

                                {/* Title */}
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  {task.title}
                                </Typography>

                                {/* Description */}
                                {task.description && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      mb: 2,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                    }}
                                  >
                                    {task.description}
                                  </Typography>
                                )}

                                {/* Tags */}
                                {task.tags.length > 0 && (
                                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
                                    {task.tags.map((tag) => (
                                      <Chip
                                        key={tag}
                                        label={tag}
                                        size="small"
                                        sx={{
                                          fontSize: 11,
                                          height: 20,
                                          backgroundColor: '#e3f2fd',
                                        }}
                                      />
                                    ))}
                                  </Box>
                                )}

                                {/* Footer */}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  {task.assignee ? (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                      <Avatar
                                        sx={{
                                          width: 24,
                                          height: 24,
                                          fontSize: 12,
                                          backgroundColor: '#1976d2',
                                        }}
                                      >
                                        {task.assignee[0]}
                                      </Avatar>
                                      <Typography variant="caption">
                                        {task.assignee}
                                      </Typography>
                                    </Stack>
                                  ) : (
                                    <Box />
                                  )}

                                  {task.deadline && (
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      alignItems="center"
                                    >
                                      <CalendarTodayIcon
                                        sx={{ fontSize: 14, color: 'text.secondary' }}
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        {task.deadline}
                                      </Typography>
                                    </Stack>
                                  )}
                                </Box>
                              </Paper>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </Paper>
              )
            })}
          </Box>
        </DragDropContext>

        {/* Add Task Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>新建任务</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="任务标题"
                fullWidth
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <TextField
                label="任务描述"
                fullWidth
                multiline
                rows={3}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>优先级</InputLabel>
                <Select
                  value={newTask.priority}
                  label="优先级"
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                >
                  <MenuItem value="low">低</MenuItem>
                  <MenuItem value="medium">中</MenuItem>
                  <MenuItem value="high">高</MenuItem>
                  <MenuItem value="critical">紧急</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="负责人"
                fullWidth
                value={newTask.assignee}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
              />
              <TextField
                label="截止日期"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              />
              <TextField
                label="标签 (逗号分隔)"
                fullWidth
                placeholder="前端, UI, 紧急"
                value={newTask.tags}
                onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>取消</Button>
            <Button
              variant="contained"
              onClick={handleAddTask}
              disabled={!newTask.title.trim()}
            >
              创建
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

export default TasksPage