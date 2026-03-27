import React from 'react'
import { Box, Typography, Container } from '@mui/material'

const NewTaskPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={ py: 4 }>
        <Typography variant="h4" component="h1" gutterBottom>
           New Task
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page is under construction.
        </Typography>
      </Box>
    </Container>
  )
}

export default NewTaskPage
