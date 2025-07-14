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
import { useTheme } from '@mui/material/styles';
import UserAvatar from './UserAvatar';

function ConversationList({ conversations, onSelect, selectedConversation, loading }) {
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  const getOtherParticipant = conversation => {
    if (!conversation || !conversation.participants) {
      return {};
    }
    return conversation.participants.find(p => p && p.id !== user.id) || {};
  };

  const formatTime = timestamp => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <List sx={{ p: 0, width: '100%' }}>
      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={64}
              sx={{ my: 1, mx: 2, borderRadius: 2 }}
            />
          ))
        : conversations.map(conversation => {
            if (!conversation) return null;

            const otherUser = getOtherParticipant(conversation);
            const lastMessage = conversation.last_message;
            const hasUnread = conversation.unread_count > 0;
            const isSelected = selectedConversation && selectedConversation.id === conversation.id;
            const lastMessageText = lastMessage
              ? lastMessage.sender && lastMessage.sender.id === user?.id
                ? 'You: ' + lastMessage.content
                : lastMessage.content
              : 'No messages yet';
            const lastMessageTime = lastMessage ? formatTime(lastMessage.timestamp) : '';

            return (
              <ListItem
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                selected={isSelected}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  mx: 1,
                  boxShadow: isSelected ? 4 : 0,
                  background: isSelected
                    ? `linear-gradient(90deg, ${theme.palette.primary.light}11 0%, ${theme.palette.secondary.light}22 100%)`
                    : theme.palette.background.paper,
                  border: isSelected
                    ? `2px solid ${theme.palette.primary.main}33`
                    : `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    boxShadow: 2,
                  },
                }}
              >
                <ListItemAvatar>
                  <Badge color="primary" variant="dot" invisible={!hasUnread}>
                    <UserAvatar user={otherUser} sx={{ width: 40, height: 40 }} />
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      component="span"
                      variant="body1"
                      fontWeight={hasUnread ? 'bold' : 'normal'}
                      color={isSelected ? 'primary.main' : 'text.primary'}
                    >
                      {otherUser?.username}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                      sx={{ maxWidth: 180 }}
                    >
                      {lastMessageText}
                    </Typography>
                  }
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 60, textAlign: 'right' }}
                >
                  {lastMessageTime}
                </Typography>
              </ListItem>
            );
          })}
    </List>
  );
}

export default ConversationList;
