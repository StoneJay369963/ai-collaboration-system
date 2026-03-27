import React, { useState } from 'react'
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
} from '@mui/material'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import PeopleIcon from '@mui/icons-material/People'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import CodeIcon from '@mui/icons-material/Code'
import StorageIcon from '@mui/icons-material/Storage'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'

// Chart colors
const COLORS = ['#1976d2', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4']

// Sample data
const projectProgressData = [
  { month: '1月', 计划: 40, 完成: 35 },
  { month: '2月', 计划: 60, 完成: 55 },
  { month: '3月', 计划: 75, 完成: 70 },
  { month: '4月', 计划: 85, 完成: 78 },
  { month: '5月', 计划: 92, 完成: 88 },
  { month: '6月', 计划: 100, 完成: 95 },
]

const taskDistributionData = [
  { name: '已完成', value: 45, color: '#4caf50' },
  { name: '进行中', value: 25, color: '#2196f3' },
  { name: '待开始', value: 20, color: '#ff9800' },
  { name: '阻塞', value: 10, color: '#f44336' },
]

const aiAgentUsageData = [
  { name: '代码审查', uses: 120 },
  { name: '文档生成', uses: 85 },
  { name: '测试编写', uses: 70 },
  { name: 'Bug修复', uses: 95 },
  { name: '性能优化', uses: 45 },
]

const teamPerformanceData = [
  { name: '张三', tasks: 28, efficiency: 92 },
  { name: '李四', tasks: 35, efficiency: 88 },
  { name: '王五', tasks: 22, efficiency: 95 },
  { name: '赵六', tasks: 30, efficiency: 85 },
  { name: '钱七', tasks: 25, efficiency: 90 },
]

const activityTrendData = [
  { day: '周一', commits: 45, tasks: 12, reviews: 8 },
  { day: '周二', commits: 52, tasks: 15, reviews: 10 },
  { day: '周三', commits: 38, tasks: 10, reviews: 6 },
  { day: '周四', commits: 65, tasks: 18, reviews: 12 },
  { day: '周五', commits: 48, tasks: 14, reviews: 9 },
  { day: '周六', commits: 20, tasks: 5, reviews: 3 },
  { day: '周日', commits: 15, tasks: 3, reviews: 2 },
]

const resourceUsageData = [
  { name: 'CPU', value: 65 },
  { name: '内存', value: 78 },
  { name: '存储', value: 45 },
  { name: '带宽', value: 32 },
]

interface StatCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
  color: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {change >= 0 ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: '#f44336', mr: 0.5 }} />
            )}
            <Typography
              variant="caption"
              sx={{ color: change >= 0 ? '#4caf50' : '#f44336', fontWeight: 600 }}
            >
              {change >= 0 ? '+' : ''}{change}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              较上周
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('week')
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area')

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
              数据分析
            </Typography>
            <Typography variant="body2" color="text.secondary">
              实时监控项目进展和团队绩效
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>时间范围</InputLabel>
              <Select
                value={timeRange}
                label="时间范围"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="week">本周</MenuItem>
                <MenuItem value="month">本月</MenuItem>
                <MenuItem value="quarter">本季度</MenuItem>
                <MenuItem value="year">本年</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<RefreshIcon />}>
              刷新
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />}>
              导出报告
            </Button>
          </Stack>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="活跃项目"
              value="12"
              change={8}
              icon={<TaskAltIcon />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="团队成员"
              value="24"
              change={12}
              icon={<PeopleIcon />}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="完成任务"
              value="156"
              change={23}
              icon={<CodeIcon />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="资源使用"
              value="78%"
              change={-5}
              icon={<StorageIcon />}
              color="#9c27b0"
            />
          </Grid>
        </Grid>

        {/* Charts Row 1 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Project Progress Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                项目进度趋势
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label="计划" sx={{ backgroundColor: '#1976d220' }} />
                <Chip label="完成" sx={{ backgroundColor: '#4caf5020' }} />
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'line' ? (
                  <LineChart data={projectProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="计划"
                      stroke="#1976d2"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="完成"
                      stroke="#4caf50"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart data={projectProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="计划"
                      stroke="#1976d2"
                      fill="#1976d220"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="完成"
                      stroke="#4caf50"
                      fill="#4caf5020"
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={projectProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="计划" fill="#1976d2" />
                    <Bar dataKey="完成" fill="#4caf50" />
                  </BarChart>
                )}
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <ToggleButtonGroup
                  value={chartType}
                  exclusive
                  onChange={(_, value) => value && setChartType(value)}
                  size="small"
                >
                  <ToggleButton value="line">折线图</ToggleButton>
                  <ToggleButton value="area">面积图</ToggleButton>
                  <ToggleButton value="bar">柱状图</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Paper>
          </Grid>

          {/* Task Distribution Pie Chart */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                任务分布
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={taskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {taskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                {taskDistributionData.map((item) => (
                  <Chip
                    key={item.name}
                    label={item.name}
                    size="small"
                    sx={{ backgroundColor: item.color, color: '#fff' }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Charts Row 2 */}
        <Grid container spacing={3}>
          {/* AI Agent Usage */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                AI Agent 使用统计
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={aiAgentUsageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="uses" fill="#1976d2" radius={[0, 4, 4, 0]}>
                    {aiAgentUsageData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Team Performance */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                团队绩效
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={teamPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#1976d2" />
                  <YAxis yAxisId="right" orientation="right" stroke="#4caf50" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="tasks" name="完成任务数" fill="#1976d2" />
                  <Bar yAxisId="right" dataKey="efficiency" name="效率 %" fill="#4caf50" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Activity Trend */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            每日活动趋势
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="commits"
                stackId="1"
                stroke="#1976d2"
                fill="#1976d220"
                name="代码提交"
              />
              <Area
                type="monotone"
                dataKey="tasks"
                stackId="2"
                stroke="#4caf50"
                fill="#4caf5020"
                name="完成任务"
              />
              <Area
                type="monotone"
                dataKey="reviews"
                stackId="3"
                stroke="#ff9800"
                fill="#ff980020"
                name="代码审查"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>

        {/* Resource Usage */}
        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                系统资源使用
              </Typography>
              <Grid container spacing={3}>
                {resourceUsageData.map((item) => (
                  <Grid item xs={12} sm={6} md={3} key={item.name}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle2">{item.name}</Typography>
                        <Typography variant="h6" sx={{ color: '#1976d2' }}>
                          {item.value}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e0e0',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${item.value}%`,
                            backgroundColor:
                              item.value > 80
                                ? '#f44336'
                                : item.value > 60
                                ? '#ff9800'
                                : '#4caf50',
                            borderRadius: 4,
                            transition: 'width 0.3s',
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default AnalyticsPage