import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import API_BASE_URL from '../config';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, reconnecting
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second
  
  // Store message handlers for different conversations
  const messageHandlersRef = useRef(new Map());
  
  // Connection management
  const connect = useCallback(() => {
    if (!user?.id || socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = API_BASE_URL.replace(/^https?:\/\//, '');
    const wsUrl = `${protocol}//${host}/ws/chat/${user.id}/`;
    
    try {
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chat_message') {
            const message = data.message;
            const conversationId = message.conversation_id;
            
            // Route message to the appropriate conversation handler
            const handlers = messageHandlersRef.current.get(conversationId);
            if (handlers) {
              handlers.forEach(handler => handler(message));
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newSocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      socketRef.current = newSocket;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  }, [user?.id]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectAttemptsRef.current++;
    setConnectionStatus('reconnecting');
    
    const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        connect();
      } else {
        setConnectionStatus('failed');
        console.error('Max reconnection attempts reached');
      }
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'User logout');
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Register/unregister message handlers for conversations
  const registerMessageHandler = useCallback((conversationId, handler) => {
    if (!messageHandlersRef.current.has(conversationId)) {
      messageHandlersRef.current.set(conversationId, new Set());
    }
    messageHandlersRef.current.get(conversationId).add(handler);
    
    // Return cleanup function
    return () => {
      const handlers = messageHandlersRef.current.get(conversationId);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlersRef.current.delete(conversationId);
        }
      }
    };
  }, []);

  // Connect when user is available
  useEffect(() => {
    if (user?.id) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value = {
    isConnected,
    connectionStatus,
    sendMessage,
    registerMessageHandler,
    connect,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
