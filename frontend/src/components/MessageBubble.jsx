import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { format } from 'date-fns';

function MessageBubble({ message, isOwnMessage }) {
  const formatTime = timestamp => {
    return format(new Date(timestamp), 'h:mm a');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 2,
        opacity: 1,
        transform: 'translateX(0)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        // Using CSS classes instead of keyframes for better stability
        '&.message-enter': {
          opacity: 0,
          transform: isOwnMessage ? 'translateX(20px)' : 'translateX(-20px)',
        },
      }}
      className="message-bubble"
    >
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '70%',
          backgroundColor: isOwnMessage ? 'rgba(3, 169, 244, 0.15)' : 'rgba(255, 255, 255, 0.9)',
          borderRadius: isOwnMessage ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
          boxShadow: isOwnMessage
            ? '0 2px 10px rgba(3, 169, 244, 0.2)'
            : '0 2px 10px rgba(0, 0, 0, 0.05)',
          border: isOwnMessage
            ? '1px solid rgba(3, 169, 244, 0.2)'
            : '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            wordBreak: 'break-word',
            color: isOwnMessage ? 'primary.dark' : 'text.primary',
          }}
        >
          {message.content}
        </Typography>
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{
            display: 'block',
            textAlign: 'right',
            mt: 0.5,
            fontSize: '0.7rem',
            opacity: 0.8,
          }}
        >
          {formatTime(message.timestamp)}
          {isOwnMessage && (
            <span style={{ marginLeft: '4px' }}>{message.is_read ? '✓✓' : '✓'}</span>
          )}
        </Typography>
      </Paper>
    </Box>
  );
}

export default MessageBubble;
