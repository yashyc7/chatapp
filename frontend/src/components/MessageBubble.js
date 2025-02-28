import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { format } from 'date-fns';

function MessageBubble({ message, isOwnMessage }) {
  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '70%',
          backgroundColor: isOwnMessage ? '#e3f2fd' : '#f5f5f5',
          borderRadius: 2,
        }}
      >
        <Typography variant="body1">{message.content}</Typography>
        <Typography 
          variant="caption" 
          color="textSecondary"
          sx={{ 
            display: 'block', 
            textAlign: 'right',
            mt: 0.5
          }}
        >
          {formatTime(message.timestamp)}
          {isOwnMessage && (
            <span style={{ marginLeft: '4px' }}>
              {message.is_read ? '✓✓' : '✓'}
            </span>
          )}
        </Typography>
      </Paper>
    </Box>
  );
}

export default MessageBubble;