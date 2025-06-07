import React, { useState, useEffect, useRef, useContext } from 'react';
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
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import API_BASE_URL, { API_URLS } from '../config';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';

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

function ChatWindow({ conversation, onConversationUpdate }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef(null);
  const { id: conversationId } = useParams();
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  useEffect(() => {
    if (conversationId && user?.id) {
      fetchMessages(1, true);
      markMessagesAsRead();
      setupWebSocket();
    }

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [conversationId, user?.id]);

  const setupWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = API_BASE_URL.replace(/^https?:\/\//, '');
    const wsUrl = `${protocol}//${host}/ws/chat/${user.id}/`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('WebSocket connection established');
    };

    newSocket.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        const receivedMessage = data.message;

        // Ensure the message belongs to current conversation
        if (parseInt(receivedMessage.conversation_id) === parseInt(conversationId)) {
          setMessages(prevMessages => {
            // Check if message already exists to prevent duplicates
            if (!prevMessages.some(m => m.id === receivedMessage.id)) {
              // Add new message while maintaining chronological order
              const updatedMessages = [
                ...prevMessages,
                {
                  ...receivedMessage,
                  sender: { id: receivedMessage.sender_id },
                },
              ];

              // Sort messages to maintain order (just in case)
              return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            }
            return prevMessages;
          });

          // Scroll to bottom for new messages
          setTimeout(() => {
            containerRef.current?.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }, 100);
        }
      }
    };

    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    newSocket.onerror = error => {
      console.error('WebSocket error:', error);
    };

    setSocket(newSocket);
  };

  const fetchMessages = async (pageToFetch = 1, scrollToBottom = false) => {
    try {
      if (!conversationId) return;

      const container = containerRef.current;
      const previousScrollHeight = container?.scrollHeight;

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

      setTimeout(() => {
        if (scrollToBottom) {
          container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        } else if (pageToFetch > 1 && container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - previousScrollHeight;
        }
      }, 100);
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
        containerRef.current?.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 10);

      // Send message to backend
      const [restResponse] = await Promise.all([
        axios.post(API_URLS.messages, {
          conversation_id: conversationId,
          content: messageContent,
        }),
        socket?.readyState === WebSocket.OPEN 
          ? new Promise(resolve => {
              const otherUser = conversation.participants?.find(p => p?.id !== user?.id);
              if (otherUser) {
                socket.send(
                  JSON.stringify({
                    type: 'chat_message',
                    message: messageContent,
                    conversation_id: conversationId,
                    recipient_id: otherUser.id,
                  })
                );
              }
              resolve();
            })
          : Promise.resolve()
      ]);

      // Update conversation list
      onConversationUpdate?.();

    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally show error toast/notification
    }
  };

  const handleScroll = e => {
    if (e.currentTarget.scrollTop === 0 && hasMore && !loadingMore) {
      setLoadingMore(true);
      fetchMessages(page + 1);
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

  const groupedMessages = groupMessagesByDate(messages);

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
        {/* ...existing header content... */}
      </Box>

      {/* Messages Container */}
      <Box
        ref={containerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
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
        {loading && !messages.length ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {loadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {Object.keys(groupedMessages).map(date => (
              <Box key={date}>
                <Typography variant="caption" align="center" display="block" sx={{ my: 2 }}>
                  {format(new Date(date), 'MMMM d, yyyy')}
                </Typography>
                {groupedMessages[date].map(message => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender?.id === user?.id}
                  />
                ))}
              </Box>
            ))}
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
              setNewMessage('');
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
            }
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
