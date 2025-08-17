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
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  // Store message handlers for different conversations
  const messageHandlersRef = useRef(new Map());

  // Track processed message IDs to prevent duplicates
  const processedMessageIds = useRef(new Set());

  // Track active conversation for better message routing
  const activeConversationRef = useRef(null);

  // Function to set active conversation
  const setActiveConversation = useCallback(conversationId => {
    activeConversationRef.current = conversationId;
    console.log('Active conversation set to:', conversationId);
  }, []);

  // Function to clear active conversation
  const clearActiveConversation = useCallback(() => {
    activeConversationRef.current = null;
    console.log('Active conversation cleared');
  }, []);

  // Simplified message processing - directly route messages
  const processIncomingMessage = useCallback(message => {
    const convId = parseInt(message.conversation_id);
    console.log('=== PROCESSING INCOMING MESSAGE ===');
    console.log('Message:', message);
    console.log('Conversation ID:', convId);
    console.log('Available handlers:', Array.from(messageHandlersRef.current.keys()));

    // Check if we have handlers for this conversation
    const handlers = messageHandlersRef.current.get(convId);

    if (handlers) {
      console.log(`Found ${handlers.size} handlers for conversation ${convId}`);

      // Check for duplicates
      const messageId =
        message.id || `${message.sender_id}_${message.timestamp}_${message.content}`;
      if (processedMessageIds.current.has(messageId)) {
        console.log('Skipping duplicate message:', messageId);
        return;
      }

      // Mark as processed
      processedMessageIds.current.add(messageId);

      // Send to all handlers
      handlers.forEach(handler => {
        try {
          console.log('Calling handler with message:', message);
          handler([message]); // Pass as array to match expected format
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    } else {
      console.warn(`No handlers found for conversation ${convId}`);
      console.log('Available conversations:', Array.from(messageHandlersRef.current.keys()));
    }
  }, []);

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

      // Update onmessage handler
      newSocket.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          console.log('=== WEBSOCKET MESSAGE RECEIVED ===');
          console.log('Raw data:', data);

          if (data.type === 'chat_message') {
            const message = data.message;
            console.log('Processing chat message:', message);

            // Only process if not from current user (prevent own message echo)
            if (message.sender_id !== user?.id) {
              console.log('Message is from other user, processing...');
              processIncomingMessage(message);
            } else {
              console.log('Skipping own message from WebSocket:', message);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newSocket.onclose = event => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');

        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      newSocket.onerror = error => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      socketRef.current = newSocket;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  }, [user?.id, processIncomingMessage]);

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

  const sendMessage = useCallback(message => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Register/unregister message handlers for conversations
  const registerMessageHandler = useCallback((conversationId, handler) => {
    console.log('=== REGISTERING HANDLER ===');
    console.log('Conversation ID:', conversationId);
    console.log('Handler function:', handler);

    if (!messageHandlersRef.current.has(conversationId)) {
      messageHandlersRef.current.set(conversationId, new Set());
      console.log(`Created new handler set for conversation ${conversationId}`);
    }

    const handlers = messageHandlersRef.current.get(conversationId);
    handlers.add(handler);

    console.log(
      `Handler registered. Total handlers for conversation ${conversationId}:`,
      handlers.size
    );
    console.log('All registered conversations:', Array.from(messageHandlersRef.current.keys()));

    // Return cleanup function
    return () => {
      console.log('=== CLEANING UP HANDLER ===');
      console.log('Conversation ID:', conversationId);

      if (handlers.has(handler)) {
        handlers.delete(handler);
        console.log(
          `Handler removed. Remaining handlers for conversation ${conversationId}:`,
          handlers.size
        );

        if (handlers.size === 0) {
          messageHandlersRef.current.delete(conversationId);
          console.log(`Removed conversation ${conversationId} from handlers`);
        }
      }

      console.log('Remaining conversations:', Array.from(messageHandlersRef.current.keys()));
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
    setActiveConversation,
    clearActiveConversation,
    connect,
    disconnect,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};
