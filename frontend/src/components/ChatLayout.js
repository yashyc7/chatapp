import React, { useState, useContext, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Box, Drawer, AppBar, Toolbar, Typography, Divider, List, IconButton, Avatar } from '@mui/material';
import { Menu as MenuIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import UserList from './UserList';
import axios from 'axios';
import { API_URLS } from '../config';

const drawerWidth = 300;

function ChatLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {  // Only fetch conversations if user exists
      fetchConversations();
    }
  }, [user]);  // Add user to the dependency array
  const fetchConversations = async () => {
    try {
      // Log the current authorization header for debugging
      console.log('Auth header:', axios.defaults.headers.common['Authorization']);
      
      const response = await axios.get(API_URLS.conversations);
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      
      // Check if it's an authentication error and redirect to login if needed
      if (error.response && error.response.status === 401) {
        console.log('Authentication error, redirecting to login');
        logout();  // Call the logout function from AuthContext
        navigate('/login');
      }
      
      setLoading(false);
    }
  };
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/chat/conversation/${conversation.id}`);
  };
  const handleStartNewConversation = async (userId) => {
    try {
      const response = await axios.post(API_URLS.startConversation, {
        user_id: userId
      });
      
      // Add the new conversation to the list if it's not already there
      if (!conversations.find(conv => conv.id === response.data.id)) {
        setConversations([...conversations, response.data]);
      }
      
      // Select the conversation
      setSelectedConversation(response.data);
      navigate(`/chat/conversation/${response.data.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };
  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Chat App
        </Typography>
      </Toolbar>
      <Divider />
      <ConversationList 
        conversations={conversations} 
        onSelect={handleConversationSelect}
        selectedConversation={selectedConversation}
      />
    </div>
  );
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {selectedConversation ? 
              selectedConversation.participants.find(p => p.id !== user.id)?.username || 'Chat' 
              : 'Select a conversation'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user?.username}
            </Typography>
            <Avatar sx={{ mr: 2 }}>
              {user?.username.charAt(0).toUpperCase()}
            </Avatar>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<Typography>Select a conversation or start a new one</Typography>} />
          <Route path="/users" element={<UserList onStartConversation={handleStartNewConversation} />} />
          <Route path="/conversation/:id" element={
            <ChatWindow 
              conversation={selectedConversation} 
              onConversationUpdate={fetchConversations}
            />
          } />
        </Routes>
      </Box>
    </Box>
  );
}

export default ChatLayout;