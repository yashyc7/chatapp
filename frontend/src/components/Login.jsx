import React, { useState, useContext, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { MarkChatRead as ChatIcon, Brightness4, Brightness7 } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { useTheme } from '@mui/material/styles';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { mode, toggleTheme } = useContext(ThemeContext);
  const theme = useTheme();
  const navigate = useNavigate();

  const particlesInit = useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const success = await login(username, password);
    if (success) {
      navigate('/chat');
    } else {
      setError('Invalid username or password');
      setLoading(false);
    }
  };

  const particlesOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: 'transparent' },
      particles: {
        number: { value: 60 },
        color: { value: theme.palette.primary.main },
        shape: { type: 'circle' },
        opacity: { value: 0.5 },
        size: { value: 3 },
        move: {
          enable: true,
          speed: 1,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false,
        },
        links: {
          enable: true,
          distance: 150,
          color: theme.palette.secondary.main,
          opacity: 0.4,
          width: 1,
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'repulse',
          },
        },
        modes: {
          repulse: {
            distance: 100,
            duration: 0.4,
          },
        },
      },
    }),
    [theme.palette.primary.main, theme.palette.secondary.main]
  );

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
        overflow: 'hidden',
        background: theme.palette.background.default,
        transition: 'background 0.3s',
      }}
    >
      {/* Particles Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
        options={particlesOptions}
      />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: theme.shape.borderRadius,
            background: theme.palette.background.paper,
            backdropFilter: 'blur(8px)',
            boxShadow: theme.shadows[8],
            border: `1px solid ${
              theme.palette.mode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(30,32,38,0.4)'
            }`,
            transition: 'all 0.3s ease-in-out',
            position: 'relative',
            '&:hover': {
              boxShadow: theme.shadows[16],
            },
          }}
        >
          {/* Theme Toggle Button */}
          <IconButton
            onClick={toggleTheme}
            color="inherit"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: theme.palette.action.hover,
              borderRadius: '50%',
              zIndex: 2,
              '&:hover': {
                background: theme.palette.action.selected,
              },
            }}
            aria-label="toggle theme"
          >
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
              mt: 1,
            }}
          >
            <ChatIcon
              sx={{
                fontSize: 40,
                mr: 1,
                color: theme.palette.primary.main,
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ChatterBox
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%', borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor:
                    theme.palette.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(30,32,38,0.7)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    backgroundColor:
                      theme.palette.mode === 'light'
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(30,32,38,0.9)',
                  },
                  '&.Mui-focused': {
                    backgroundColor:
                      theme.palette.mode === 'light' ? 'rgba(255,255,255,1)' : 'rgba(30,32,38,1)',
                    boxShadow:
                      theme.palette.mode === 'light'
                        ? '0 0 0 2px rgba(25, 118, 210, 0.2)'
                        : '0 0 0 2px rgba(144,202,249,0.2)',
                  },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor:
                    theme.palette.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(30,32,38,0.7)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    backgroundColor:
                      theme.palette.mode === 'light'
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(30,32,38,0.9)',
                  },
                  '&.Mui-focused': {
                    backgroundColor:
                      theme.palette.mode === 'light' ? 'rgba(255,255,255,1)' : 'rgba(30,32,38,1)',
                    boxShadow:
                      theme.palette.mode === 'light'
                        ? '0 0 0 2px rgba(25, 118, 210, 0.2)'
                        : '0 0 0 2px rgba(144,202,249,0.2)',
                  },
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
                color: theme.palette.getContrastText(theme.palette.primary.main),
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 20px ${theme.palette.secondary.main}44`,
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      color: theme.palette.secondary.main,
                    },
                  }}
                >
                  Don't have an account? Sign Up
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
