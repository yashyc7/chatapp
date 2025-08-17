import React, { useContext, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  List as MuiList,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Badge,
  Button,
  Skeleton,
  Box,
} from '@mui/material';
import { Person as PersonIcon, Add as AddIcon } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import UserAvatar from './UserAvatar';
import { FixedSizeList as VirtualList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

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

  // Define helper functions before using them in useMemo
  const getLastMessageText = useCallback(
    conversation => {
      const lastMessage = conversation.last_message;
      if (!lastMessage) return 'No messages yet';

      if (lastMessage.sender && lastMessage.sender.id === user?.id) {
        return 'You: ' + lastMessage.content;
      }
      return lastMessage.content;
    },
    [user?.id]
  );

  const getLastMessageTime = useCallback(
    conversation => {
      const lastMessage = conversation.last_message;
      return lastMessage ? formatTime(lastMessage.timestamp) : '';
    },
    [formatTime]
  );

  // Memoize conversation data to prevent unnecessary re-renders
  const conversationData = useMemo(() => {
    return conversations.map(conv => ({
      ...conv,
      otherParticipant: getOtherParticipant(conv),
      lastMessageText: getLastMessageText(conv),
      lastMessageTime: getLastMessageTime(conv),
      hasUnread: conv.unread_count > 0,
      isSelected: selectedConversation?.id === conv.id,
    }));
  }, [conversations, selectedConversation, user?.id, getLastMessageText, getLastMessageTime]);

  const ConversationItem = useCallback(
    ({ index, style, data }) => {
      const conversation = data[index];
      if (!conversation) return null;

      const otherUser = conversation.otherParticipant;
      const hasUnread = conversation.hasUnread;
      const isSelected = conversation.isSelected;
      const lastMessageText = conversation.lastMessageText;
      const lastMessageTime = conversation.lastMessageTime;

      return (
        <div style={style}>
          <ListItem
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
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                  }}
                >
                  {lastMessageText}
                </Typography>
              }
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1, minWidth: 'fit-content' }}
            >
              {lastMessageTime}
            </Typography>
          </ListItem>
        </div>
      );
    },
    [onSelect, theme]
  );

  if (loading) {
    return (
      <MuiList sx={{ p: 0, width: '100%' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={64}
            sx={{ my: 1, mx: 2, borderRadius: 2 }}
          />
        ))}
      </MuiList>
    );
  }

  // Use virtual scrolling for better performance with many conversations
  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <AutoSizer>
        {({ height, width }) => (
          <VirtualList
            height={height}
            width={width}
            itemCount={conversationData.length}
            itemSize={80}
            itemData={conversationData}
            style={{
              // Prevent horizontal overflow
              overflowX: 'hidden',
            }}
          >
            {ConversationItem}
          </VirtualList>
        )}
      </AutoSizer>
    </Box>
  );
}

export default ConversationList;
