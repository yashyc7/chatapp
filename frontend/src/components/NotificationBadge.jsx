import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { API_URLS } from '../config';
import { useNavigate } from 'react-router-dom';

function NotificationBadge({onSelectConversation}) {
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

useEffect(() => {
  const fetchUnreadMessages = async () => {
    try {
      const response = await axios.get(API_URLS.unreadMessages);
        setUnreadMessages(response.data);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  fetchUnreadMessages();
  const interval = setInterval(fetchUnreadMessages, 7777); // Poll every 10 seconds

  return () => clearInterval(interval);
}, []);

  const handleOpenMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleNavigateToChat = (conversationId) => {
    if (onSelectConversation) {
      onSelectConversation(conversationId); // call parent
    }
    handleCloseMenu();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpenMenu}>
        <Badge badgeContent={unreadMessages.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: '350px',
          },
        }}
      >
        {unreadMessages.length === 0 ? (
          <MenuItem>
            <Typography variant="body2" color="textSecondary">
              No unread messages
            </Typography>
          </MenuItem>
        ) : (
          unreadMessages.map(message => (
            <MenuItem
              key={message.id}
              onClick={() => handleNavigateToChat(message.conversation_id)}
            >
              <ListItemAvatar>
                <Avatar>
                  {message.sender.username.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={message.sender.username}
                secondary={message.content}
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}

export default NotificationBadge;