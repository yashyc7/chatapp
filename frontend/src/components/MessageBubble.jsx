import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';

const MessageBubble = ({ message, isOwnMessage }) => {
  const theme = useTheme();
  const messageTime = format(new Date(message.timestamp), 'h:mm a');

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 2,
        px: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          backgroundColor: isOwnMessage ? 'primary.main' : 'background.paper',
          color: isOwnMessage ? 'white' : 'text.primary',
          borderRadius: 3,
          px: 2,
          py: 1.5,
          position: 'relative',
          border: isOwnMessage ? 'none' : `1px solid ${theme.palette.divider}`,
          boxShadow: isOwnMessage ? 2 : 1,
        }}
      >
        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
          {message.content}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 1,
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            {messageTime}
          </Typography>

          {isOwnMessage && (
            <CheckIcon
              sx={{
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.7)',
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MessageBubble;
