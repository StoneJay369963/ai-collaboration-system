import React, { useState } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  PersonAdd as RegisterIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useRegisterMutation } from '../../services/api'
import { setCredentials, setError, clearError } from '../../store/slices/authSlice'
import { useDispatch } from 'react-redux'

const steps = ['基本信息', '账户设置', '完成注册']

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [register, { isLoading }] = useRegisterMutation()
  
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState({
    // 步骤1: 基本信息
    username: '',
    email: '',
    fullName: '',
    
    // 步骤2: 账户设置
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    if (errorMessage) setErrorMessage('')
  }

  const handleNext = () => {
    // 验证当前步骤
    let isValid = true
    let error = ''
    
    if (activeStep === 0) {
      if (!formData.username.trim()) {
        isValid = false
        error = '请输入用户名'
      } else if (!formData.email.trim()) {
        isValid = false
        error = '请输入邮箱地址'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        isValid = false
        error = '请输入有效的邮箱地址'
      }
    } else if (activeStep === 1) {
      if (!formData.password) {
        isValid = false
        error = '请输入密码'
      } else if (formData.password.length < 8) {
        isValid = false
        error = '密码至少需要8个字符'
      } else if (formData.password !== formData.confirmPassword) {
        isValid = false
        error = '两次输入的密码不一致'
      }
    }
    
    if (!isValid) {
      setErrorMessage(error)
      return
    }
    
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleSubmit = async () => {
    try {
      const { username, email, password, fullName } = formData
      const response = await register({
        username,
        email,
        password,
        ...(fullName && { fullName }),
      }).unwrap()
      
      dispatch(setCredentials(response))
      dispatch(clearError())
      setSuccessMessage('注册成功！正在跳转到首页...')
      
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error: any) {
      setErrorMessage(
        error?.data?.message || '注册失败，请稍后重试'
      )
      dispatch(setError(errorMessage))
      setActiveStep(0) // 返回第一步
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="用户名"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              helperText="用户名是唯一的，用于登录和显示"
            />
            
            <TextField
              fullWidth
              label="邮箱地址"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              helperText="用于登录和接收通知"
            />
            
            <TextField
              fullWidth
              label="姓名（可选）"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              helperText="真实的姓名，用于团队协作"
            />
          </Box>
        )
      
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="密码"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="至少8个字符，包含字母和数字"
            />
            
            <TextField
              fullWidth
              label="确认密码"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>密码要求：</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  ⚪ 至少8个字符
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  ⚪ 包含字母和数字
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  ⚪ 建议使用特殊字符
                </Typography>
              </Box>
            </Box>
          </Box>
        )
      
      case 2:
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              注册信息确认
            </Typography>
            <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>用户名：</strong> {formData.username}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>邮箱：</strong> {formData.email}
              </Typography>
              {formData.fullName && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>姓名：</strong> {formData.fullName}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              点击"完成注册"按钮创建您的账户
            </Typography>
          </Box>
        )
      
      default:
        return null
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={24}
        sx={{
          width: '100%',
          maxWidth: 500,
          p: 4,
          borderRadius: 4,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <RegisterIcon sx={{ fontSize: 40 }} />
            🤖 创建账户
          </Typography>
          <Typography variant="body1" color="text.secondary">
            加入AI协作开发系统，开启智能协作之旅
          </Typography>
        </Box>
        
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <form onSubmit={(e) => e.preventDefault()}>
          {renderStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || isLoading}
              sx={{ minWidth: 100 }}
            >
              上一步
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={isLoading}
                sx={{ minWidth: 100 }}
              >
                {isLoading ? '注册中...' : '完成注册'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                sx={{ minWidth: 100 }}
              >
                下一步
              </Button>
            )}
          </Box>
        </form>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            已有账户？{' '}
            <Link
              component={RouterLink}
              to="/login"
              sx={{ textDecoration: 'none', fontWeight: 'bold' }}
            >
              立即登录
            </Link>
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            <strong>系统功能：</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 0, mb: 2 }}>
            <Typography component="li" variant="caption" color="text.secondary">
              🚀 多AI协同开发
            </Typography>
            <Typography component="li" variant="caption" color="text.secondary">
              📊 实时项目管理
            </Typography>
            <Typography component="li" variant="caption" color="text.secondary">
              💬 智能聊天协作
            </Typography>
            <Typography component="li" variant="caption" color="text.secondary">
              🔧 代码协同编辑
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © 2026 AI协作开发系统 v2.0
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default RegisterPage