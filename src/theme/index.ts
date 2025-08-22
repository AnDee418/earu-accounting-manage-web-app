import { createTheme } from '@mui/material/styles';

// モダンなカラーパレット
const colors = {
  // プライマリー - 深みのあるブルー
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  // セカンダリー - エレガントなパープル
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0',
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
  },
  // アクセント - 鮮やかなシアン
  accent: {
    50: '#e0f2f1',
    100: '#b2dfdb',
    200: '#80cbc4',
    300: '#4db6ac',
    400: '#26a69a',
    500: '#009688',
    600: '#00897b',
    700: '#00796b',
    800: '#00695c',
    900: '#004d40',
  },
  // グレーシステム
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  // ダークテーマ用
  dark: {
    50: '#f7f7f7',
    100: '#e1e1e1',
    200: '#cfcfcf',
    300: '#b1b1b1',
    400: '#9e9e9e',
    500: '#7e7e7e',
    600: '#626262',
    700: '#515151',
    800: '#3b3b3b',
    900: '#222222',
  }
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary[600],
      light: colors.primary[400],
      dark: colors.primary[800],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[300],
      dark: colors.secondary[700],
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336',
      light: '#ff7961',
      dark: '#ba000d',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: colors.accent[500],
      light: colors.accent[300],
      dark: colors.accent[700],
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: colors.dark[800],
      secondary: colors.dark[600],
    },
    divider: colors.gray[200],
  },
  typography: {
    fontFamily: [
      '"Inter"',
      '"Segoe UI"',
      '"Noto Sans JP"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
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
      fontWeight: 500,
      letterSpacing: '0.025em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.05)',
    '0px 4px 6px rgba(0, 0, 0, 0.05)',
    '0px 5px 15px rgba(0, 0, 0, 0.08)',
    '0px 10px 24px rgba(0, 0, 0, 0.1)',
    '0px 15px 35px rgba(0, 0, 0, 0.1)',
    '0px 20px 40px rgba(0, 0, 0, 0.1)',
    '0px 25px 50px rgba(0, 0, 0, 0.12)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: 'none',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 20px rgba(0, 0, 0, 0.08)',
          color: colors.dark[800],
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          fontSize: '0.9rem',
          fontWeight: 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          textTransform: 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
          '&:hover': {
            background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`,
            boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
          },
        },
        outlined: {
          borderColor: colors.primary[300],
          color: colors.primary[700],
          '&:hover': {
            borderColor: colors.primary[500],
            background: colors.primary[50],
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
          '&.MuiChip-filled': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 12px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: 'rgba(33, 150, 243, 0.08)',
            transform: 'translateX(4px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
          '&.Mui-selected': {
            background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
            borderLeft: `3px solid ${colors.primary[500]}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${colors.primary[100]} 0%, ${colors.primary[200]} 100%)`,
            },
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0.1) 100%)',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: colors.primary[800],
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            background: 'rgba(33, 150, 243, 0.04)',
            transform: 'scale(1.01)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            },
            '&.Mui-focused': {
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: 'rgba(33, 150, 243, 0.04)',
            },
          },
        },
      },
    },
  },
});

// ダークテーマの定義
export const darkTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    mode: 'dark',
    primary: {
      main: colors.primary[400],
      light: colors.primary[300],
      dark: colors.primary[600],
    },
    secondary: {
      main: colors.secondary[300],
      light: colors.secondary[200],
      dark: colors.secondary[500],
    },
    background: {
      default: '#0a0a0b',
      paper: '#1a1a1b',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  components: {
    ...theme.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1b 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(26, 26, 27, 0.9)',
          backdropFilter: 'blur(20px)',
          border: 'none',
          boxShadow: '0 1px 3px rgba(255, 255, 255, 0.05), 0 1px 20px rgba(255, 255, 255, 0.08)',
          color: '#ffffff',
        },
      },
    },
  },
});