import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';

function MessageBubble({ message, isOwnMessage }) {
  const theme = useTheme();

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
          backgroundColor: isOwnMessage
            ? theme.palette.mode === 'light'
              ? 'rgba(3, 169, 244, 0.15)'
              : 'rgba(144, 202, 249, 0.15)'
            : theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.9)'
              : 'rgba(30, 32, 38, 0.9)',
          borderRadius: isOwnMessage ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
          boxShadow: isOwnMessage
            ? `0 2px 10px ${theme.palette.primary.main}33`
            : theme.palette.mode === 'light'
              ? '0 2px 10px rgba(0, 0, 0, 0.05)'
              : '0 2px 10px rgba(0, 0, 0, 0.2)',
          border: isOwnMessage
            ? `1px solid ${theme.palette.primary.main}33`
            : `1px solid ${
                theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)'
              }`,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            wordBreak: 'break-word',
            color: isOwnMessage ? theme.palette.primary.main : theme.palette.text.primary,
          }}
        >
          {message.content}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'right',
            mt: 0.5,
            fontSize: '0.7rem',
            opacity: 0.8,
            color: theme.palette.text.secondary,
          }}
        >
          {formatTime(message.timestamp)}
          {isOwnMessage && (
            <span
              style={{
                marginLeft: '4px',
                color: message.is_read ? theme.palette.primary.main : theme.palette.text.secondary,
              }}
            >
              {message.is_read ? '✓✓' : '✓'}
            </span>
          )}
        </Typography>
      </Paper>
    </Box>
  );
}

export default MessageBubble;
