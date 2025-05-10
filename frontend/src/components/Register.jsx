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
  Grid,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, MarkChatRead as ChatIcon } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { useTheme } from '@mui/material/styles';
import { Google } from '@mui/icons-material';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, googleLogin } = useContext(AuthContext);
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();
  const navigate = useNavigate();

  const particlesInit = useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const success = await googleLogin();
    if (success) {
      navigate('/chat');
    } else {
      setError('Google login failed');
    }
    setLoading(false);
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

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { username, email, password, password2, first_name, last_name } = formData;

    if (!username || !email || !password || !password2) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (password !== password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const success = await register(formData);
    if (success) {
      navigate('/chat');
    } else {
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor:
        theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 32, 38, 0.7)',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        backgroundColor:
          theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 32, 38, 0.9)',
      },
      '&.Mui-focused': {
        backgroundColor:
          theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 1)' : 'rgba(30, 32, 38, 1)',
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}33`,
      },
    },
  };

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
      }}
    >
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

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: '100%',
              borderRadius: theme.shape.borderRadius,
              background: theme.palette.background.paper,
              backdropFilter: 'blur(8px)',
              boxShadow: theme.shadows[8],
              border: `1px solid ${
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(30, 32, 38, 0.4)'
              }`,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: theme.shadows[16],
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
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
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="first_name"
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={loading}
                    sx={textFieldStyle}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="last_name"
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={loading}
                    sx={textFieldStyle}
                  />
                </Grid>
              </Grid>

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                sx={textFieldStyle}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                sx={textFieldStyle}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                sx={textFieldStyle}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password2"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="password2"
                autoComplete="new-password"
                value={formData.password2}
                onChange={handleChange}
                disabled={loading}
                sx={textFieldStyle}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
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
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 20px ${theme.palette.secondary.main}44`,
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                onClick={handleGoogleLogin}
                disabled={loading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.primary,
                  backgroundColor:
                    theme.palette.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(30,32,38,0.7)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    backgroundColor:
                      theme.palette.mode === 'light'
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(30,32,38,0.9)',
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 4px 10px ${theme.palette.primary.main}33`,
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign up with Google'}
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
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
                    Already have an account? Sign In
                  </Typography>
                </Link>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default Register;
