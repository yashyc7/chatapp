import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  TextField,
  IconButton,
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
import debounce from 'lodash.debounce';

const groupMessagesByDate = messages => {
  return messages.reduce((groups, message) => {
    const date = format(new Date(message.timestamp), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});
};

const createFlatMessageList = groupedMessages => {
  const flatList = [];
  Object.keys(groupedMessages).forEach(date => {
    flatList.push({ type: 'date', date, id: `date-${date}` });
    groupedMessages[date].forEach(message => {
      flatList.push({ type: 'message', message, id: message.id });
    });
  });
  return flatList;
};

const MessageItem = ({ index, style, data }) => {
  const { items, user } = data;
  const item = items[index];

  if (item.type === 'date') {
    return (
      <div style={style}>
        <Typography variant="caption" align="center" sx={{ my: 2, color: 'text.secondary' }}>
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
  const cacheRef = useRef({}); // { conversationId: { pageNumber: [messages] } }
  const wsRef = useRef(null); // single websocket instance
  const reconnectTimeoutRef = useRef(null);
  const { id: conversationId } = useParams();
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  const flatMessageList = useMemo(() => {
    const groupedMessages = groupMessagesByDate(messages);
    return createFlatMessageList(groupedMessages);
  }, [messages]);

  const listData = useMemo(
    () => ({
      items: flatMessageList,
      user,
    }),
    [flatMessageList, user]
  );

  const scrollToBottom = useCallback(() => {
    if (listRef.current && flatMessageList.length > 0) {
      listRef.current.scrollToItem(flatMessageList.length - 1, 'end');
    }
  }, [flatMessageList.length]);

  const fetchMessages = useCallback(
    async (pageToFetch = 1, scrollToBottomAfter = false) => {
      if (!conversationId) return;

      try {
        // Check cache first
        const conversationCache = cacheRef.current[conversationId] || {};
        if (conversationCache[pageToFetch]) {
          // Prepend cached page if not already in messages
          setMessages(prev => {
            // Avoid duplicates by message ID
            const cachedMessages = conversationCache[pageToFetch];
            const newMessages = cachedMessages.filter(m => !prev.some(pm => pm.id === m.id));
            return [...newMessages, ...prev].sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );
          });
          return;
        }

        pageToFetch === 1 ? setLoading(true) : setLoadingMore(true);

        const response = await axios.get(
          `${API_URLS.messages}?conversation_id=${conversationId}&page=${pageToFetch}`
        );
        const data = response.data;

        // Sort ascending by timestamp
        const sortedMessages = data.results.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Cache the page
        cacheRef.current[conversationId] = {
          ...(cacheRef.current[conversationId] || {}),
          [pageToFetch]: sortedMessages,
        };

        setMessages(prev => {
          if (pageToFetch === 1) return sortedMessages;
          // Merge new page messages at the top (older messages)
          const combined = [...sortedMessages, ...prev];
          // Deduplicate by message id
          const unique = [];
          const ids = new Set();
          combined.forEach(msg => {
            if (!ids.has(msg.id)) {
              ids.add(msg.id);
              unique.push(msg);
            }
          });
          return unique.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });

        setHasMore(Boolean(data.next));
        setPage(pageToFetch);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        if (scrollToBottomAfter) setTimeout(scrollToBottom, 100);
      }
    },
    [conversationId, scrollToBottom]
  );

  const markMessagesAsRead = useCallback(async () => {
    try {
      if (!conversationId) return;
      await axios.post(API_URLS.markAsRead, { conversation_id: conversationId });
      onConversationUpdate?.();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [conversationId, onConversationUpdate]);

  // WebSocket setup and reuse
  const setupWebSocket = useCallback(() => {
    if (!user?.id) return;

    if (wsRef.current) {
      // Already connected
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = API_BASE_URL.replace(/^https?:\/\//, '');
    const wsUrl = `${protocol}//${host}/ws/chat/${user.id}/`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        const receivedMessage = data.message;
        // Only update if message belongs to current conversation
        if (parseInt(receivedMessage.conversation_id) === parseInt(conversationId)) {
          setMessages(prev => {
            if (prev.some(m => m.id === receivedMessage.id)) return prev;
            return [
              ...prev,
              {
                ...receivedMessage,
                sender: { id: receivedMessage.sender_id },
              },
            ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          });
          setTimeout(scrollToBottom, 100);
        }
      }
    };

    ws.onclose = () => {
      console.warn('WebSocket closed. Attempting to reconnect in 2s...');
      wsRef.current = null;
      reconnectTimeoutRef.current = setTimeout(() => {
        setupWebSocket();
      }, 2000);
    };

    ws.onerror = err => {
      console.error('WebSocket error', err);
      ws.close();
    };
  }, [conversationId, scrollToBottom, user?.id]);

  // Cleanup websocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Reload messages and mark read when conversation changes
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    setMessages([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    cacheRef.current[conversationId] = cacheRef.current[conversationId] || {};

    fetchMessages(1, true);
    markMessagesAsRead();
    setupWebSocket();
  }, [conversationId, user?.id, fetchMessages, markMessagesAsRead, setupWebSocket]);

  const handleSendMessage = async e => {
    e.preventDefault();
    const messageContent = newMessage.trim();
    if (!messageContent) return;
    setNewMessage('');

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      timestamp: new Date().toISOString(),
      sender: { id: user?.id },
      is_read: false,
      conversation_id: conversationId,
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 10);

    try {
      const [restResponse] = await Promise.all([
        axios.post(API_URLS.messages, {
          conversation_id: conversationId,
          content: messageContent,
        }),
        wsRef.current?.readyState === WebSocket.OPEN
          ? new Promise(resolve => {
              const otherUser = conversation.participants?.find(p => p?.id !== user?.id);
              if (otherUser) {
                wsRef.current.send(
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
          : Promise.resolve(),
      ]);
      onConversationUpdate?.();
    } catch (err) {
      console.error('Send failed', err);
    }
  };

  const handleItemsRendered = useMemo(
    () =>
      debounce(({ visibleStartIndex }) => {
        if (visibleStartIndex === 0 && hasMore && !loadingMore) {
          fetchMessages(page + 1);
        }
      }, 300),
    [hasMore, loadingMore, page, fetchMessages]
  );

  if (!conversation) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '70vh',
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {otherParticipant && (
          <>
            <Avatar sx={{ mr: 2 }}>{otherParticipant.username?.charAt(0).toUpperCase()}</Avatar>
            <Typography variant="h6">{otherParticipant.username}</Typography>
          </>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        {loading && !messages.length ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              height: '100%',
              alignItems: 'center',
            }}
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
                  itemSize={100}
                  itemData={listData}
                  onItemsRendered={handleItemsRendered}
                  style={{ paddingLeft: 16, paddingRight: 16 }}
                >
                  {MessageItem}
                </List>
              )}
            </AutoSizer>
          </>
        )}
      </Box>

      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
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
          sx={{ mr: 1 }}
        />
        <IconButton color="primary" type="submit" disabled={!newMessage.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export default ChatWindow;
