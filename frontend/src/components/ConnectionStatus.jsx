import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import { 
  Wifi as WifiIcon, 
  WifiOff as WifiOffIcon,
  Sync as SyncIcon,
  Error as ErrorIcon 
} from '@mui/icons-material';
import { useWebSocket } from '../context/WebSocketContext';

const ConnectionStatus = () => {
  const { connectionStatus, isConnected } = useWebSocket();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <WifiIcon />,
          label: 'Connected',
          color: 'success',
          tooltip: 'WebSocket connection is active'
        };
      case 'connecting':
        return {
          icon: <SyncIcon />,
          label: 'Connecting...',
          color: 'warning',
          tooltip: 'Establishing WebSocket connection'
        };
      case 'reconnecting':
        return {
          icon: <SyncIcon />,
          label: 'Reconnecting...',
          color: 'warning',
          tooltip: 'Attempting to reconnect'
        };
      case 'disconnected':
        return {
          icon: <WifiOffIcon />,
          label: 'Disconnected',
          color: 'default',
          tooltip: 'WebSocket connection is closed'
        };
      case 'error':
        return {
          icon: <ErrorIcon />,
          label: 'Connection Error',
          color: 'error',
          tooltip: 'WebSocket connection error'
        };
      case 'failed':
        return {
          icon: <ErrorIcon />,
          label: 'Connection Failed',
          color: 'error',
          tooltip: 'Failed to establish connection after multiple attempts'
        };
      default:
        return {
          icon: <WifiOffIcon />,
          label: 'Unknown',
          color: 'default',
          tooltip: 'Unknown connection status'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip title={config.tooltip} arrow>
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
        sx={{ 
          fontSize: '0.75rem',
          height: '24px',
          '& .MuiChip-icon': {
            fontSize: '16px'
          }
        }}
      />
    </Tooltip>
  );
};

export default ConnectionStatus;
