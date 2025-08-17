import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './WebSocketContext';
import { AuthContext } from './AuthContext';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { isConnected, registerMessageHandler } = useWebSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationSupported, setIsNotificationSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const notificationRef = useRef(null);

  // Check browser notification support
  useEffect(() => {
    if ('Notification' in window) {
      setIsNotificationSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isNotificationSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      } else {
        toast.warning('Notifications are disabled. Enable them in browser settings.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  }, [isNotificationSupported]);

  // Show browser notification
  const showBrowserNotification = useCallback(
    (title, options = {}) => {
      if (permission !== 'granted' || !isNotificationSupported) return;

      try {
        // Close existing notification
        if (notificationRef.current) {
          notificationRef.current.close();
        }

        // Create new notification
        notificationRef.current = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'chat-notification',
          requireInteraction: false,
          silent: false,
          ...options,
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          if (notificationRef.current) {
            notificationRef.current.close();
          }
        }, 5000);

        // Handle notification click
        notificationRef.current.onclick = () => {
          window.focus();
          notificationRef.current?.close();
        };
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    },
    [permission, isNotificationSupported]
  );

  // Handle incoming messages and create notifications
  const handleIncomingMessage = useCallback(
    message => {
      if (!user || message.sender_id === user.id) return;

      const notificationData = {
        id: `msg_${message.id}_${Date.now()}`,
        type: 'message',
        title: 'New Message',
        body: message.content,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        timestamp: new Date().toISOString(),
        read: false,
      };

      // Add to notifications
      setNotifications(prev => [notificationData, ...prev.slice(0, 49)]); // Keep last 50

      // Update unread count
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      toast.info(
        <div>
          <strong>New message from {message.sender?.username || 'User'}</strong>
          <br />
          <span style={{ fontSize: '0.9em', opacity: 0.8 }}>
            {message.content.length > 50
              ? `${message.content.substring(0, 50)}...`
              : message.content}
          </span>
        </div>,
        {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClick: () => {
            // Navigate to conversation
            window.location.href = `/chat/conversation/${message.conversation_id}`;
          },
        }
      );

      // Show browser notification if app is not focused
      if (document.hidden && permission === 'granted') {
        showBrowserNotification(`New message from ${message.sender?.username || 'User'}`, {
          body: message.content,
          data: { conversationId: message.conversation_id },
        });
      }
    },
    [user, permission, showBrowserNotification]
  );

  // Register WebSocket handler for all conversations
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    // Register a global message handler
    const cleanup = registerMessageHandler('global', handleIncomingMessage);

    return cleanup;
  }, [isConnected, user?.id, registerMessageHandler, handleIncomingMessage]);

  // Mark notification as read
  const markAsRead = useCallback(notificationId => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === notificationId ? { ...notif, read: true } : notif))
    );

    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  }, []);

  // Clear notification
  const clearNotification = useCallback(
    notificationId => {
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

      // Update unread count if notification was unread
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    },
    [notifications]
  );

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Get notifications for specific conversation
  const getConversationNotifications = useCallback(
    conversationId => {
      return notifications.filter(n => n.conversationId === conversationId);
    },
    [notifications]
  );

  // Mark conversation notifications as read
  const markConversationAsRead = useCallback(
    conversationId => {
      setNotifications(prev =>
        prev.map(notif =>
          notif.conversationId === conversationId ? { ...notif, read: true } : notif
        )
      );

      // Recalculate unread count
      const newUnreadCount = notifications.filter(
        n => !n.read && n.conversationId !== conversationId
      ).length;
      setUnreadCount(newUnreadCount);
    },
    [notifications]
  );

  const value = {
    notifications,
    unreadCount,
    isNotificationSupported,
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    getConversationNotifications,
    markConversationAsRead,
    showBrowserNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
