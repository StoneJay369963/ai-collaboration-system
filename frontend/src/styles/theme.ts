import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196F3',
      dark: '#1976D2',
      light: '#64B5F6',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF4081',
      dark: '#F50057',
      light: '#FF80AB',
      contrastText: '#fff',
    },
    ai: {
      developer: '#4CAF50',
      designer: '#9C27B0',
      tester: '#FF9800',
      ops: '#607D8B',
    } as any,
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.1)',
    '0px 4px 8px rgba(0,0,0,0.12)',
    '0px 8px 16px rgba(0,0,0,0.14)',
    '0px 16px 32px rgba(0,0,0,0.16)',
    ...Array(20).fill('none'),
  ] as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 8px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '0 12px 12px 0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
})

// 深色主题
export const darkTheme = createTheme({
  ...theme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#64B5F6',
      dark: '#2196F3',
      light: '#90CAF9',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF80AB',
      dark: '#FF4081',
      light: '#FFB2DD',
      contrastText: '#fff',
    },
    ai: {
      developer: '#81C784',
      designer: '#CE93D8',
      tester: '#FFB74D',
      ops: '#90A4AE',
    } as any,
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
})

// 扩展主题类型
declare module '@mui/material/styles' {
  interface Palette {
    ai: {
      developer: string
      designer: string
      tester: string
      ops: string
    }
  }
  interface PaletteOptions {
    ai: {
      developer: string
      designer: string
      tester: string
      ops: string
    }
  }
}