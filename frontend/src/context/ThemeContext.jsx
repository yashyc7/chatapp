import React, { createContext, useMemo, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const ThemeContext = createContext();

const drawerWidth = 240;

const lightTheme = {
  palette: {
    mode: 'light',
    primary: { main: '#1976d2', light: '#63a4ff', dark: '#004ba0' },
    secondary: { main: '#03a9f4', light: '#67daff', dark: '#007ac1' },
    background: { default: '#f5f5f5', paper: 'rgba(255,255,255,0.9)' },
    appBar: { main: '#ffffff', contrastText: '#1976d2' },
    drawer: { main: '#f5f5f5', contrastText: '#1976d2' },
    avatar: { main: '#1976d2', contrastText: '#fff' },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          color: '#1976d2',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.9)',
          color: '#222',
        },
      },
    },
    MuiBox: {
      styleOverrides: {
        root: {
          background: '#f5f5f5',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          background: '#ffffff',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: drawerWidth,
          border: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          background: '#1976d2',
          color: '#fff',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '0',
        },
      },
    },
  },
};

const darkTheme = {
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9', light: '#e3f2fd', dark: '#1976d2' },
    secondary: { main: '#03a9f4', light: '#67daff', dark: '#007ac1' },
    background: { default: '#181a20', paper: 'rgba(30,32,38,0.95)' },
    appBar: { main: '#23272f', contrastText: '#90caf9' },
    drawer: { main: '#23272f', contrastText: '#90caf9' },
    avatar: { main: '#90caf9', contrastText: '#23272f' },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#23272f',
          color: '#90caf9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(30,32,38,0.95)',
          color: '#e3f2fd',
        },
      },
    },
    MuiBox: {
      styleOverrides: {
        root: {
          background: '#181a20',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          background: '#23272f',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#23272f',
          color: '#90caf9',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          background: '#90caf9',
          color: '#23272f',
        },
      },
    },
  },
};

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const theme = useMemo(() => createTheme(mode === 'dark' ? darkTheme : lightTheme), [mode]);

  const toggleTheme = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
