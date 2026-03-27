import React from 'react'
import { Box, Typography, Container } from '@mui/material'

const AIAgentDetailPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={ py: 4 }>
        <Typography variant="h4" component="h1" gutterBottom>
          AIAgent Detail
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page is under construction.
        </Typography>
      </Box>
    </Container>
  )
}

export default AIAgentDetailPage
