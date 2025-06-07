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
import UserAvatar from './UserAvatar';

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
    if (!newMessage.trim()) return;

    try {
      // Send via REST API
      await axios.post(API_URLS.messages, {
        conversation_id: conversationId,
        content: newMessage.trim(),
      });

      // Also send via WebSocket if available
      if (socket?.readyState === WebSocket.OPEN) {
        const otherUser = conversation.participants?.find(p => p?.id !== user?.id);
        if (otherUser) {
          socket.send(
            JSON.stringify({
              type: 'chat_message',
              message: newMessage.trim(),
              conversation_id: conversationId,
              recipient_id: otherUser.id,
            })
          );
        }
      }

      setNewMessage('');
      onConversationUpdate?.();
    } catch (error) {
      console.error('Error sending message:', error);
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
        height: 'calc(100vh - 95px)',
        pb: 1,
        background: theme.palette.background.default,
        transition: 'background 0.3s',
      }}
    >
      <Fade in>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <UserAvatar user={otherParticipant}/>
          <Typography variant="h6" sx={{ ml: 2 }}>{otherParticipant?.username || 'Unknown'}</Typography>
        </Box>
      </Fade>

      <Paper
        elevation={2}
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          mb: 1,
          backgroundColor: theme.palette.background.paper,
          transition: 'background 0.3s',
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
      </Paper>

      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          boxShadow: theme.shadows[1],
          transition: 'background 0.3s',
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
        />
        <IconButton color="primary" type="submit" disabled={!newMessage.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export default ChatWindow;
