import React, { useState, useContext, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Fade,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExitToApp as LogoutIcon,
  MarkChatRead as MarkChatReadIcon,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import NotificationBadge from './NotificationBadge';

import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import UserList from './UserList';
import axios from 'axios';
import { API_URLS } from '../config';
import UserAvatar from './UserAvatar';

const drawerWidth = 300;

function ChatLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const { mode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(API_URLS.conversations);
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);

      if (error.response && error.response.status === 401) {
        console.log('Authentication error, redirecting to login');
        logout();
        navigate('/login');
      }

      setLoading(false);
    }
  };

  const handleNotificationSelect = async conversationId => {
    try {
      let conversation = conversations.find(c => c.id === conversationId);

      if (!conversation) {
        // Fetch from API if not already loaded
        const response = await axios.get(`${API_URLS.conversations}${conversationId}/`);
        conversation = response.data;
        setConversations(prev => [...prev, conversation]);
      }

      setSelectedConversation(conversation);
      navigate(`/chat/conversation/${conversationId}`);
    } catch (error) {
      console.error('Error selecting conversation from notification:', error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleConversationSelect = conversation => {
    setSelectedConversation(conversation);
    navigate(`/chat/conversation/${conversation.id}`);
  };

  const handleStartNewConversation = async userId => {
    try {
      const response = await axios.post(API_URLS.startConversation, {
        user_id: userId,
      });

      if (!conversations.find(conv => conv.id === response.data.id)) {
        setConversations([...conversations, response.data]);
      }

      setSelectedConversation(response.data);
      navigate(`/chat/conversation/${response.data.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.paper,
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          color: 'white',
          borderRadius: '0 0 16px 16px',
          mb: 1,
        }}
      >
        <MarkChatReadIcon sx={{ mr: 1, fontSize: 28 }} />
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          ChatterBox
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <ConversationList
          conversations={conversations}
          onSelect={handleConversationSelect}
          selectedConversation={selectedConversation}
        />
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #181a20 0%, #23272f 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
          color: 'text.primary',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
          >
            {selectedConversation && selectedConversation.participants && user
              ? (() => {
                  const otherUser = selectedConversation.participants.find(
                    p => p && p.id !== user.id
                  );
                  return otherUser?.username ? (
                    <>
                      <UserAvatar user={otherUser} />
                      <span style={{ marginLeft: 8 }}>{otherUser.username}</span>
                    </>
                  ) : (
                    'Chat'
                  );
                })()
              : 'Select a conversation'}
          </Typography>
          <NotificationBadge onSelectConversation={handleNotificationSelect} />
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ ml: 1 }}
            aria-label="toggle theme"
          >
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user?.username}
            </Typography>
            <UserAvatar user={user} sx={{ mr: 2 }} />
            <IconButton
              color="primary"
              onClick={handleLogout}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: theme.palette.error.main,
                  transform: 'rotate(90deg)',
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRadius: '0 16px 16px 0',
              background: theme.palette.background.paper,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRadius: '0 16px 16px 0',
              border: 'none',
              background: theme.palette.background.paper,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <Toolbar />
        <Fade in={true} timeout={800}>
          <Box>
            <Routes>
              <Route
                path="/"
                element={
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '70vh',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <MarkChatReadIcon sx={{ fontSize: 80, color: 'primary.main', opacity: 0.7 }} />
                    <Typography variant="h5" color="textSecondary">
                      Select a conversation or start a new one
                    </Typography>
                  </Box>
                }
              />
              <Route
                path="/users"
                element={<UserList onStartConversation={handleStartNewConversation} />}
              />
              <Route
                path="/conversation/:id"
                element={
                  <ChatWindow
                    conversation={selectedConversation}
                    onConversationUpdate={fetchConversations}
                  />
                }
              />
            </Routes>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}

export default ChatLayout;
