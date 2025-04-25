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
  Grow
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import { API_URLS } from '../config';

function ChatWindow({ conversation, onConversationUpdate }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const { id: conversationId } = useParams();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (conversationId && user) {  // Only proceed if both conversationId and user exist
      fetchMessages();
      markMessagesAsRead();
      setupWebSocket();
    }
  
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URLS.messages}?conversation_id=${conversationId}`);
      setMessages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await axios.post(API_URLS.markAsRead, {
        conversation_id: conversationId
      });
      if (onConversationUpdate) {
        onConversationUpdate();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const setupWebSocket = () => {
    // Check if user exists before accessing its properties
    if (!user) {
      console.error('User is not defined. Cannot set up WebSocket.');
      return;
    }
  
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' ? window.location.host : 'localhost:8000';
    const newSocket = new WebSocket(`${protocol}//${host}/ws/chat/${user.id}/`);
    
    newSocket.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        const message = data.message;
        
        // Only add the message if it belongs to the current conversation
        if (message.conversation_id === parseInt(conversationId)) {
          // Add the message to the list if it's not already there
          setMessages(prevMessages => {
            if (!prevMessages.find(m => m.id === message.id)) {
              const newMessage = {
                ...message,
                sender: { id: message.sender_id }
              };
              return [...prevMessages, newMessage];
            }
            return prevMessages;
          });
          
          // If the message is from the other user, mark it as read
          if (message.sender_id !== user.id) {
            markMessagesAsRead();
          }
        }
      }
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    setSocket(newSocket);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      // Send message via REST API
      const response = await axios.post(API_URLS.messages, {
        conversation_id: conversationId,
        content: newMessage
      });
      
      // Also send via WebSocket for real-time delivery
      if (socket && socket.readyState === WebSocket.OPEN && conversation && conversation.participants) {
        const otherUser = conversation.participants.find(p => p && p.id !== user?.id);
        if (otherUser) {
          socket.send(JSON.stringify({
            type: 'chat_message',
            message: newMessage,
            conversation_id: parseInt(conversationId),
            recipient_id: otherUser.id
          }));
        }
      }
      
      setNewMessage('');
      
      // Update the conversation list to show the latest message
      if (onConversationUpdate) {
        onConversationUpdate();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!conversation) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Fade in={true} timeout={800}>
          <Paper elevation={3} sx={{ 
            p: 4, 
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Typography variant="body1" align="center">
              Select a conversation to start chatting
            </Typography>
          </Paper>
        </Fade>
      </Box>
    );
  }

  // Safely get the other user with null checks
  const getOtherUser = () => {
    if (!conversation || !conversation.participants || !user) {
      return null;
    }
    return conversation.participants.find(p => p && p.id !== user.id) || null;
  };

  const otherParticipant = getOtherUser();

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 95px)',
      pb: 1
    }}>
      <Fade in={true} timeout={500}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 1,
          p: 2,
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Avatar sx={{ 
            mr: 2,
            background: 'linear-gradient(45deg, #1976d2 30%, #03a9f4 90%)',
            boxShadow: '0 2px 10px rgba(3, 169, 244, 0.2)'
          }}>
            {otherParticipant?.username?.charAt(0).toUpperCase() || '?'}
          </Avatar>
          <Typography variant="h6">{otherParticipant?.username || 'Unknown User'}</Typography>
        </Box>
      </Fade>
      
      <Paper 
        elevation={3} 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          mb: 1,
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Fade in={true} timeout={800}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              flexDirection: 'column',
              gap: 2
            }}>
              <Typography variant="body1" color="textSecondary">
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Fade in={true} timeout={500}>
            <Box>
              {messages.map((message, index) => (
                <Grow in={true} key={message.id} timeout={300 + index * 100}>
                  <Box>
                    <MessageBubble 
                      message={message} 
                      isOwnMessage={message.sender && user ? message.sender.id === user.id : false}
                    />
                  </Box>
                </Grow>
              ))}
              <div ref={messagesEndRef} />
            </Box>
          </Fade>
        )}
      </Paper>
      
      <Fade in={true} timeout={800}>
        <Box 
          component="form" 
          onSubmit={handleSendMessage} 
          sx={{ 
            display: 'flex',
            borderRadius: '12px',
            overflow: 'visible',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            p: '6px',
            position: 'relative',
            bottom: 0,
            zIndex: 1,
            mt: 'auto',
            mb: 0
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            multiline
            maxRows={4}
            sx={{ 
              mr: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                minHeight: '56px',
                padding: '8px 14px',
                alignItems: 'center',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                },
                '&.Mui-focused': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                }
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent'
              },
              '& .MuiInputBase-input': {
                overflow: 'auto',
                maxHeight: '120px',
                lineHeight: '1.5',
                padding: '4px 0'
              }
            }}
          />
          <IconButton 
            color="primary" 
            type="submit" 
            disabled={!newMessage.trim()}
            sx={{ 
              alignSelf: 'flex-end',
              p: '10px',
              height: '56px',
              width: '56px',
              background: 'linear-gradient(45deg, #1976d2 30%, #03a9f4 90%)',
              color: 'white',
              borderRadius: '10px',
              m: '4px',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(3, 169, 244, 0.4)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Fade>
    </Box>
  );
}

export default ChatWindow;