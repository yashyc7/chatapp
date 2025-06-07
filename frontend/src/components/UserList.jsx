import React, { useState, useEffect, useContext } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Paper,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Search as SearchIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { API_URLS } from '../config';
import UserAvatar from './UserAvatar';

function UserList({ onStartConversation }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        u =>
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.first_name && u.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (u.last_name && u.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(API_URLS.users);
      const otherUsers = response.data.filter(u => u.id !== user.id);
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleSearchChange = e => {
    setSearchQuery(e.target.value);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[3],
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 0,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
          }}
        >
          <IconButton component={Link} to="/chat" sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">New Chat</Typography>
        </Box>

        {/* Search Box */}
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search users..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: theme.shape.borderRadius,
                backgroundColor:
                  theme.palette.mode === 'light'
                    ? 'rgba(255, 255, 255, 0.7)'
                    : 'rgba(30, 32, 38, 0.7)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'light'
                      ? 'rgba(255, 255, 255, 0.9)'
                      : 'rgba(30, 32, 38, 0.9)',
                },
                '&.Mui-focused': {
                  backgroundColor:
                    theme.palette.mode === 'light'
                      ? 'rgba(255, 255, 255, 1)'
                      : 'rgba(30, 32, 38, 1)',
                  boxShadow: `0 0 0 2px ${theme.palette.primary.main}33`,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Users List */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.divider,
              borderRadius: '4px',
            },
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List
              sx={{
                width: '100%',
                bgcolor: 'background.paper',
                '.MuiListItem-root': {
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                },
              }}
            >
              {filteredUsers.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary={<Typography color="text.primary">No users found</Typography>}
                    secondary={
                      <Typography color="text.secondary">
                        {searchQuery
                          ? 'Try a different search term'
                          : 'No other users are registered'}
                      </Typography>
                    }
                  />
                </ListItem>
              ) : (
                filteredUsers.map(user => (
                  <React.Fragment key={user.id}>
                    <ListItem
                      alignItems="flex-start"
                      button
                      onClick={() => onStartConversation(user.id)}
                      sx={{
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <UserAvatar user={user} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography color="text.primary">{user.username}</Typography>}
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))
              )}
            </List>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export default UserList;
