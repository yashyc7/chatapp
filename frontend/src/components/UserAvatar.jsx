// src/components/UserAvatar.jsx
import React from 'react';
import { Avatar } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const UserAvatar = ({ user, sx = {} }) => {
    const theme = useTheme();

    return user?.photo_url ? (
        <Avatar
            src={user.photo_url}
            alt={user.username}
            sx={{
                ...sx,
            }}
        />
    ) : (
        <Avatar
            sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                ...sx,
            }}
        >
            {user?.username?.[0]?.toUpperCase() || '?'}
        </Avatar>
    );
};

export default UserAvatar;