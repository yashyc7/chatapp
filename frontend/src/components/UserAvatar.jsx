// src/components/UserAvatar.jsx
import React, { useState, useCallback } from 'react';
import { Avatar, Skeleton } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

const UserAvatar = ({ user, size = 40, sx = {} }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  if (!user?.photo_url || imageError) {
    return (
      <Avatar sx={{ ...sx, width: size, height: size }}>
        {user?.username?.charAt(0).toUpperCase() || <PersonIcon />}
      </Avatar>
    );
  }

  return (
    <>
      {!imageLoaded && (
        <Skeleton variant="circular" width={size} height={size} sx={{ position: 'absolute' }} />
      )}
      <Avatar
        src={user.photo_url}
        alt={user.username}
        sx={{
          ...sx,
          width: size,
          height: size,
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </>
  );
};

export default UserAvatar;
