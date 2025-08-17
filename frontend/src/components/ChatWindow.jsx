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
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNotifications } from '../context/NotificationContext';

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
  const [cursor, setCursor] = useState(null);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  const listRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { id: conversationId } = useParams();
  const { user } = useContext(AuthContext);
  const {
    isConnected,
    sendMessage,
    registerMessageHandler,
    setActiveConversation,
    clearActiveConversation,
  } = useWebSocket();
  const { markConversationAsRead } = useNotifications();
  const theme = useTheme();
  const [lastMessageId, setLastMessageId] = useState(null);

  // Improved scroll to bottom function
  const scrollToBottom = useCallback(
    (smooth = true, force = false) => {
      console.log('=== SCROLL TO BOTTOM CALLED ===');
      console.log('Messages length:', messages.length);
      console.log('List ref:', listRef.current);

      if (listRef.current && messages.length > 0) {
        try {
          console.log('Attempting to scroll to bottom...');

          // Force scroll to the very last item
          const lastIndex = messages.length - 1;
          console.log('Scrolling to index:', lastIndex);

          listRef.current.scrollToItem(lastIndex, 'end');

          // Double-check scroll position
          setTimeout(() => {
            if (listRef.current) {
              console.log('Double-checking scroll position...');
              listRef.current.scrollToItem(lastIndex, 'smart');
            }
          }, 100);
        } catch (error) {
          console.log('Scroll error:', error);
          // Fallback: scroll to bottom of container
          if (messagesEndRef.current) {
            console.log('Using fallback scroll method...');
            messagesEndRef.current.scrollIntoView({
              behavior: smooth ? 'smooth' : 'auto',
              block: 'end',
              inline: 'nearest',
            });
          }
        }
      } else {
        console.log('Cannot scroll: listRef or messages not available');
      }
    },
    [messages.length]
  );

  // Define fetchMessages function
  const fetchMessages = useCallback(
    async (pageToFetch = 1, shouldScrollToBottom = false) => {
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
    },
    [conversationId, scrollToBottom]
  );

  // Define markMessagesAsRead function
  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || hasMarkedAsRead) return;

    try {
      await axios.post(API_URLS.markAsRead, {
        conversation_id: conversationId,
      });
      setHasMarkedAsRead(true);
      onConversationUpdate?.();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [conversationId, hasMarkedAsRead, onConversationUpdate]);

  // NOW define the memoized values that depend on the functions
  const flatMessageList = useMemo(() => {
    const groupedMessages = groupMessagesByDate(messages);
    return createFlatMessageList(groupedMessages);
  }, [messages]);

  const listData = useMemo(
    () => ({
      items: flatMessageList,
      user: user,
    }),
    [flatMessageList, user]
  );

  // Handle scroll to load more messages
  const handleItemsRendered = useCallback(
    ({ visibleStartIndex }) => {
      if (visibleStartIndex === 0 && hasMore && !loadingMore) {
        setLoadingMore(true);
        fetchMessages(page + 1);
      }
    },
    [hasMore, loadingMore, page, fetchMessages]
  );

  // Reset hasMarkedAsRead when conversation changes
  useEffect(() => {
    setHasMarkedAsRead(false);
  }, [conversationId]);

  // Set active conversation and fetch messages ONCE when component mounts or conversation changes
  useEffect(() => {
    if (conversationId && user?.id) {
      console.log('Setting active conversation:', conversationId);
      setActiveConversation(conversationId);

      // Fetch messages only
      fetchMessages(1, true);
    }

    // Cleanup when component unmounts or conversation changes
    return () => {
      console.log('Clearing active conversation:', conversationId);
      clearActiveConversation();
    };
  }, [conversationId, user?.id, setActiveConversation, clearActiveConversation, fetchMessages]);

  // Mark messages as read and mark conversation notifications as read ONCE after messages are loaded
  useEffect(() => {
    if (conversationId && user?.id && messages.length > 0 && !hasMarkedAsRead) {
      console.log('Marking messages as read for conversation:', conversationId);
      markMessagesAsRead();
      markConversationAsRead(conversationId);
    }
  }, [
    conversationId,
    user?.id,
    messages.length,
    hasMarkedAsRead,
    markMessagesAsRead,
    markConversationAsRead,
  ]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]);

  // Register message handler for this conversation
  useEffect(() => {
    if (!conversationId) return;

    console.log('=== REGISTERING MESSAGE HANDLER ===');
    console.log('Conversation ID:', conversationId);

    const cleanup = registerMessageHandler(conversationId, messages => {
      console.log('=== MESSAGE HANDLER TRIGGERED ===');
      console.log('Conversation ID:', conversationId);
      console.log('Received messages:', messages);
      console.log('Current messages state:', messages);
      console.log('User ID:', user?.id);

      // Handle both single message and array of messages
      const messageArray = Array.isArray(messages) ? messages : [messages];

      setMessages(prevMessages => {
        console.log('Previous messages:', prevMessages);

        const newMessages = [...prevMessages];

        messageArray.forEach(message => {
          // Check if message already exists to prevent duplicates
          if (!newMessages.some(m => m.id === message.id)) {
            console.log('Adding new message:', message);

            // Add new message while maintaining chronological order
            newMessages.push({
              ...message,
              sender: { id: message.sender_id },
              // Ensure proper sender identification
              isOwnMessage: message.sender_id === user?.id,
            });
          } else {
            console.log('Message already exists, skipping:', message.id);
          }
        });

        // Sort messages to maintain order
        const sortedMessages = newMessages.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        console.log('Final sorted messages:', sortedMessages);

        return sortedMessages;
      });

      // Force scroll to bottom for new messages
      setTimeout(() => {
        console.log('Scrolling to bottom after new message...');
        scrollToBottom(false, true); // Use force scroll
      }, 200);
    });

    return () => {
      console.log('Cleaning up message handler for conversation:', conversationId);
      cleanup();
    };
  }, [conversationId, registerMessageHandler, user?.id, scrollToBottom]);

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
        isOwnMessage: true,
      };

      setMessages(prev => [...prev, optimisticMessage]);

      // Scroll to bottom immediately after adding message
      setTimeout(() => {
        scrollToBottom(true);
      }, 50);

      // Send message to backend
      const response = await axios.post(API_URLS.messages, {
        conversation_id: conversationId,
        content: messageContent,
      });

      // Update the optimistic message with the real one
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id ? { ...response.data, isOwnMessage: true } : msg
        )
      );

      // Don't send via WebSocket - let backend handle it
      // This prevents the duplicate message issue

      // Update conversation list
      onConversationUpdate?.();
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
    }
  };

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

            {/* Invisible element for scroll fallback */}
            <div ref={messagesEndRef} style={{ height: 1 }} />
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
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
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
              // Ensure text is visible
              color: theme.palette.text.primary,
              '& fieldset': {
                borderColor: theme.palette.divider,
              },
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
              },
            },
            '& .MuiInputBase-input': {
              color: theme.palette.text.primary,
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 1,
              },
            },
          }}
        />
        <IconButton
          color="primary"
          type="submit"
          disabled={!newMessage.trim()}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
            '&:disabled': {
              backgroundColor: theme.palette.action.disabled,
              color: theme.palette.action.disabledBackground,
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export default ChatWindow;
