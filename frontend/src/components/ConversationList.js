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
  Box
} from '@mui/material';
import { Person as PersonIcon, Add as AddIcon } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

function ConversationList({ conversations, onSelect, selectedConversation }) {
  const { user } = useContext(AuthContext);

  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants || !user) {
      return {};
    }
    return conversation.participants.find(p => p && p.id !== user.id) || {};
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
      <ListItem 
        component={Link}
        to="/chat/users"
        sx={{ textDecoration: 'none', color: 'inherit' }}
      >
        <Button 
          fullWidth 
          variant="outlined" 
          startIcon={<AddIcon />}
          sx={{ borderRadius: 2, py: 1 }}
        >
          New Conversation
        </Button>
      </ListItem>
      <Divider />
      
      {conversations && conversations.length > 0 ? (
        conversations.map((conversation) => {
          if (!conversation) return null;
          
          const otherUser = getOtherParticipant(conversation);
          const lastMessage = conversation.last_message;
          const hasUnread = conversation.unread_count > 0;
          const isSelected = selectedConversation && selectedConversation.id === conversation.id;
          
          return (
            <React.Fragment key={conversation.id}>
              <ListItem 
                alignItems="flex-start"
                button
                selected={isSelected}
                onClick={() => onSelect(conversation)}
                sx={{
                  backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  },
                }}
              >
                <ListItemAvatar>
                  <Badge color="primary" variant="dot" invisible={!hasUnread}>
                    <Avatar>
                      {otherUser.username ? otherUser.username.charAt(0).toUpperCase() : <PersonIcon />}
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
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {lastMessage ? (
                          lastMessage.sender && lastMessage.sender.id === user?.id ? 'You: ' : ''
                        ) : ''}
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
                            mt: 0.5
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