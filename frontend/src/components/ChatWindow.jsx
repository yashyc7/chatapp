import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Avatar,
  CircularProgress,
  Fade,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import API_BASE_URL, { API_URLS } from '../config';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import { useWebSocket } from '../context/WebSocketContext';

const groupMessagesByDate = messages => {
  return messages.reduce((groups, message) => {
    const date = format(new Date(message.timestamp), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
};

// Create flat list of items including date separators
const createFlatMessageList = groupedMessages => {
  const flatList = [];

  Object.keys(groupedMessages).forEach(date => {
    // Add date separator
    flatList.push({
      type: 'date',
      date: date,
      id: `date-${date}`,
    });

    // Add messages for this date
    groupedMessages[date].forEach(message => {
      flatList.push({
        type: 'message',
        message: message,
        id: message.id,
      });
    });
  });

  return flatList;
};

// Message item component for virtualization
const MessageItem = ({ index, style, data }) => {
  const { items, user } = data;
  const item = items[index];

  if (item.type === 'date') {
    return (
      <div style={style}>
        <Typography
          variant="caption"
          align="center"
          display="block"
          sx={{ my: 2, color: 'text.secondary' }}
        >
          {format(new Date(item.date), 'MMMM d, yyyy')}
        </Typography>
      </div>
    );
  }

  return (
    <div style={style}>
      <MessageBubble message={item.message} isOwnMessage={item.message.sender?.id === user?.id} />
    </div>
  );
};

function ChatWindow({ conversation, onConversationUpdate }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef(null);
  const { id: conversationId } = useParams();
  const { user } = useContext(AuthContext);
  const { isConnected, sendMessage, registerMessageHandler } = useWebSocket();
  const theme = useTheme();

  // Memoize the flat message list to avoid recalculation
  const flatMessageList = useMemo(() => {
    const groupedMessages = groupMessagesByDate(messages);
    return createFlatMessageList(groupedMessages);
  }, [messages]);

  // Memoize data for virtualized list
  const listData = useMemo(
    () => ({
      items: flatMessageList,
      user: user,
    }),
    [flatMessageList, user]
  );

  // Register message handler for this conversation
  useEffect(() => {
    if (!conversationId) return;

    const cleanup = registerMessageHandler(conversationId, (message) => {
      setMessages(prevMessages => {
        // Check if message already exists to prevent duplicates
        if (!prevMessages.some(m => m.id === message.id)) {
          // Add new message while maintaining chronological order
          const updatedMessages = [
            ...prevMessages,
            {
              ...message,
              sender: { id: message.sender_id },
            },
          ];

          // Sort messages to maintain order
          return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        return prevMessages;
      });

      // Scroll to bottom for new messages
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    });

    return cleanup;
  }, [conversationId, registerMessageHandler]);

  useEffect(() => {
    if (conversationId && user?.id) {
      fetchMessages(1, true);
      markMessagesAsRead();
    }
  }, [conversationId, user?.id]);

  const scrollToBottom = useCallback(() => {
    if (listRef.current && flatMessageList.length > 0) {
      listRef.current.scrollToItem(flatMessageList.length - 1, 'end');
    }
  }, [flatMessageList.length]);

  const fetchMessages = async (pageToFetch = 1, shouldScrollToBottom = false) => {
    try {
      if (!conversationId) return;

      if (pageToFetch === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await axios.get(
        `${API_URLS.messages}?conversation_id=${conversationId}&page=${pageToFetch}`
      );

      const data = response.data;
      const sortedMessages = data.results.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      if (pageToFetch === 1) {
        setMessages(sortedMessages);
      } else {
        setMessages(prev => [...sortedMessages, ...prev]);
      }

      setHasMore(Boolean(data.next));
      setPage(pageToFetch);
      setLoading(false);
      setLoadingMore(false);

      if (shouldScrollToBottom) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await axios.post(API_URLS.markAsRead, {
        conversation_id: conversationId,
      });
      onConversationUpdate?.();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async e => {
    e.preventDefault();
    const messageContent = newMessage.trim();
    if (!messageContent) return;

    // Clear input immediately
    setNewMessage('');

    try {
      // Optimistically add message to UI
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        timestamp: new Date().toISOString(),
        sender: { id: user?.id },
        is_read: false,
      };

      setMessages(prev => [...prev, optimisticMessage]);

      // Scroll to bottom immediately
      setTimeout(() => {
        scrollToBottom();
      }, 10);

      // Send message to backend
      const response = await axios.post(API_URLS.messages, {
        conversation_id: conversationId,
        content: messageContent,
      });

      // Send message via WebSocket if connected
      if (isConnected) {
        const otherUser = conversation.participants?.find(p => p?.id !== user?.id);
        if (otherUser) {
          sendMessage({
            type: 'chat_message',
            message: messageContent,
            conversation_id: conversationId,
            recipient_id: otherUser.id,
          });
        }
      }

      // Update conversation list
      onConversationUpdate?.();
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally show error toast/notification
    }
  };

  // Handle scroll to load more messages
  const handleItemsRendered = useCallback(
    ({ visibleStartIndex }) => {
      if (visibleStartIndex === 0 && hasMore && !loadingMore) {
        setLoadingMore(true);
        fetchMessages(page + 1);
      }
    },
    [hasMore, loadingMore, page]
  );

  if (!conversation) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '70vh',
          flexDirection: 'column',
        }}
      >
        <Fade in>
          <Typography>Select a conversation to start chatting</Typography>
        </Fade>
      </Box>
    );
  }

  const otherParticipant = conversation.participants?.find(p => p?.id !== user?.id) || null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        bgcolor: 'background.default',
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        }}
      >
        {otherParticipant && (
          <>
            <Avatar sx={{ mr: 2 }}>{otherParticipant.username?.charAt(0).toUpperCase()}</Avatar>
            <Typography variant="h6">{otherParticipant.username}</Typography>
          </>
        )}
      </Box>

      {/* Messages Container */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {loading && !messages.length ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {loadingMore && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  p: 2,
                  bgcolor: 'background.default',
                }}
              >
                <CircularProgress size={24} />
              </Box>
            )}
            <AutoSizer>
              {({ height, width }) => (
                <List
                  ref={listRef}
                  height={height}
                  width={width}
                  itemCount={flatMessageList.length}
                  itemSize={100} // Base size, will auto-adjust based on content
                  itemData={listData}
                  onItemsRendered={handleItemsRendered}
                  style={{
                    paddingLeft: 16,
                    paddingRight: 16,
                  }}
                >
                  {MessageItem}
                </List>
              )}
            </AutoSizer>
          </>
        )}
      </Box>

      {/* Message Input */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          multiline
          maxRows={4}
          sx={{
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
        <IconButton color="primary" type="submit" disabled={!newMessage.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export default ChatWindow;
