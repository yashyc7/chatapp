import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Badge,
  Button,
  Skeleton,
} from '@mui/material';
import { Person as PersonIcon, Add as AddIcon } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

function ConversationList({ conversations, onSelect, selectedConversation, loading = false }) {
  const { user } = useContext(AuthContext);

  const getOtherParticipant = conversation => {
    if (!conversation || !conversation.participants || !user) {
      return {};
    }
    return conversation.participants.find(p => p && p.id !== user.id) || {};
  };

  const formatTime = timestamp => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <List
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        p: 0,
        borderRadius: '12px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      <ListItem
        component={Link}
        to="/chat/users"
        sx={{
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.3s ease',
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 2,
            py: 1,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.5)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          New Conversation
        </Button>
      </ListItem>
      <Divider />

      {loading ? (
        // Loading skeletons
        [...Array(5)].map((_, index) => (
          <React.Fragment key={index}>
            <ListItem sx={{ py: 1.5 }}>
              <ListItemAvatar>
                <Skeleton variant="circular" width={40} height={40} />
              </ListItemAvatar>
              <ListItemText
                primary={<Skeleton width="70%" />}
                secondary={<Skeleton width="40%" />}
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))
      ) : conversations && conversations.length > 0 ? (
        conversations.map(conversation => {
          if (!conversation) return null;

          const otherUser = getOtherParticipant(conversation);
          const lastMessage = conversation.last_message;
          const hasUnread = conversation.unread_count > 0;
          const isSelected = selectedConversation && selectedConversation.id === conversation.id;

          return (
            <React.Fragment key={conversation.id}>
              <ListItem
                alignItems="flex-start"
                component="div"
                selected={isSelected}
                onClick={() => onSelect(conversation)}
                sx={{
                  backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  },
                  cursor: 'pointer',
                  borderRadius: '8px',
                  my: 0.5,
                  transition: 'all 0.2s ease-in-out',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <ListItemAvatar>
                  <Badge color="primary" variant="dot" invisible={!hasUnread}>
                    <Avatar
                      sx={{
                        background: 'linear-gradient(45deg, #1976d2 30%, #03a9f4 90%)',
                        boxShadow: '0 2px 10px rgba(3, 169, 244, 0.2)',
                      }}
                    >
                      {otherUser.username ? (
                        otherUser.username.charAt(0).toUpperCase()
                      ) : (
                        <PersonIcon />
                      )}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      component="span"
                      variant="body1"
                      fontWeight={hasUnread ? 'bold' : 'normal'}
                    >
                      {otherUser.username || 'Unknown User'}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{
                          display: 'inline',
                          fontWeight: hasUnread ? 'bold' : 'normal',
                          maxWidth: '70%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lastMessage
                          ? lastMessage.sender && lastMessage.sender.id === user?.id
                            ? 'You: '
                            : ''
                          : ''}
                        {lastMessage ? lastMessage.content : 'No messages yet'}
                      </Typography>
                      {lastMessage && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            textAlign: 'right',
                            mt: 0.5,
                          }}
                        >
                          {formatTime(lastMessage.timestamp)}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          );
        })
      ) : (
        <ListItem>
          <ListItemText primary="No conversations yet" />
        </ListItem>
      )}
    </List>
  );
}

export default ConversationList;
