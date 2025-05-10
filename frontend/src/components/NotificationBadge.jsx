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
import { useTheme } from '@mui/material/styles';

function NotificationBadge({ onSelectConversation }) {
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const response = await axios.get(API_URLS.unreadMessages);
        const newMessages = response.data;

        // Deduplicate by message ID
        setUnreadMessages(prevMessages => {
          const allMessages = [...prevMessages, ...newMessages];
          const uniqueMessages = [];

          const seenIds = new Set();
          for (const msg of allMessages) {
            if (!seenIds.has(msg.id)) {
              seenIds.add(msg.id);
              uniqueMessages.push(msg);
            }
          }

          return uniqueMessages;
        });
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadMessages();
    const intervalId = setInterval(fetchUnreadMessages, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleOpenMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleNavigateToChat = conversationId => {
    if (onSelectConversation) {
      markMessagesAsRead(conversationId); // Passing conversationId here
      onSelectConversation(conversationId);
    }
    handleCloseMenu();
  };

  const markMessagesAsRead = async conversationId => {
    // Added conversationId parameter
    try {
      await axios.post(API_URLS.markAsRead, {
        conversation_id: conversationId,
      });
      // Remove the marked messages from unreadMessages state
      setUnreadMessages(prev => prev.filter(msg => msg.conversation_id !== conversationId));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpenMenu}
        sx={{
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
        <Badge
          badgeContent={unreadMessages.length}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
              fontWeight: 'bold',
            },
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          elevation: 3,
          sx: {
            maxHeight: 300,
            width: '350px',
            mt: 1,
            backgroundColor: theme.palette.background.paper,
            backgroundImage: 'none',
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${
              theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)'
            }`,
            boxShadow: theme.shadows[8],
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {unreadMessages.length === 0 ? (
          <MenuItem sx={{ py: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ width: '100%', textAlign: 'center' }}
            >
              No unread messages
            </Typography>
          </MenuItem>
        ) : (
          unreadMessages.map(message => (
            <MenuItem
              key={message.id}
              onClick={() => handleNavigateToChat(message.conversation_id)}
              sx={{
                py: 1.5,
                px: 2,
                borderBottom: `1px solid ${
                  theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.05)'
                    : 'rgba(255, 255, 255, 0.1)'
                }`,
                '&:last-child': {
                  borderBottom: 'none',
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  }}
                >
                  {message.sender.username.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" color="text.primary">
                    {message.sender.username}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {message.content}
                  </Typography>
                }
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}

export default NotificationBadge;
