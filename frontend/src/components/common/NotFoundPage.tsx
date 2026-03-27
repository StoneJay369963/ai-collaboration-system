import React from 'react'
import { Box, Typography, Button, Container } from '@mui/material'
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '6rem', sm: '8rem', md: '10rem' },
            fontWeight: 'bold',
            color: 'text.secondary',
            mb: 2,
          }}
        >
          404
        </Typography>
        
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            fontWeight: 'bold',
            mb: 2,
          }}
        >
          页面未找到
        </Typography>
        
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600 }}
        >
          抱歉，您访问的页面不存在或已被移动。
          请检查URL是否正确，或者返回首页。
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ minWidth: 150 }}
          >
            返回首页
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ minWidth: 150 }}
          >
            返回上一页
          </Button>
        </Box>
        
        {/* 错误信息建议 */}
        <Box sx={{ mt: 6, p: 3, bgcolor: 'background.default', borderRadius: 2, maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            🤔 您可以尝试：
          </Typography>
          <Box component="ul" sx={{ textAlign: 'left', pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              检查URL是否正确
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              使用搜索功能查找内容
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              联系管理员寻求帮助
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              查看系统文档
            </Typography>
          </Box>
        </Box>
        
        {/* 系统状态 */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="caption" color="text.secondary">
            AI协作开发系统 v2.0 • 错误代码: 404_NOT_FOUND • 时间: {new Date().toLocaleString('zh-CN')}
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

export default NotFoundPage