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
import axios from 'axios';
import { API_URLS } from '../config';

function UserList({ onStartConversation }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

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
      const response = await axios.get(`${API_URLS}/api/users/`);
      // Filter out the current user
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
    <Paper elevation={3} sx={{ height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton component={Link} to="/chat" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          New Chat
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search users..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Divider />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {filteredUsers.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No users found"
                secondary={
                  searchQuery ? 'Try a different search term' : 'No other users are registered'
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
                >
                  <ListItemAvatar>
                    <Avatar>{user.username.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username}
                    secondary={
                      <>
                        {user.first_name && user.last_name ? (
                          <Typography component="span" variant="body2" color="text.primary">
                            {`${user.first_name} ${user.last_name}`}
                          </Typography>
                        ) : null}
                        {user.email && (
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            {user.email}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))
          )}
        </List>
      )}
    </Paper>
  );
}

export default UserList;
