import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  IconButton, 
  Paper, 
  Typography, 
  Avatar,
  CircularProgress
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import MessageBubble from './MessageBubble';

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
      const response = await axios.get(`http://localhost:8000/api/messages/?conversation_id=${conversationId}`);
      setMessages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await axios.post('http://localhost:8000/api/messages/mark_as_read/', {
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
      const response = await axios.post('http://localhost:8000/api/messages/', {
        conversation_id: conversationId,
        content: newMessage
      });
      
      // Also send via WebSocket for real-time delivery
      if (socket && socket.readyState === WebSocket.OPEN) {
        const otherUser = conversation.participants.find(p => p.id !== user.id);
        socket.send(JSON.stringify({
          type: 'chat_message',
          message: newMessage,
          conversation_id: parseInt(conversationId),
          recipient_id: otherUser.id
        }));
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <Typography variant="body1">Select a conversation to start chatting</Typography>
      </Box>
    );
  }

  const otherUser = conversation.participants.find(p => p.id !== user.id);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ mr: 2 }}>
          {otherUser?.username.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="h6">{otherUser?.username}</Typography>
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          mb: 2
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="textSecondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isOwnMessage={message.sender.id === user.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Paper>
      
      <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          sx={{ mr: 1 }}
        />
        <IconButton 
          color="primary" 
          type="submit" 
          disabled={!newMessage.trim()}
          sx={{ p: '10px' }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export default ChatWindow;