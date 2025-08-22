import React from 'react';
import { CircularProgress, Box, Typography, SxProps, Theme } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
  sx?: SxProps<Theme>;
}

export default function LoadingSpinner({ 
  size = 40, 
  message, 
  fullScreen = false,
  sx 
}: LoadingSpinnerProps) {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      sx={sx}
    >
      <CircularProgress 
        size={size} 
        sx={{
          color: 'primary.main',
        }}
      />
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.6 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.6 },
            },
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="rgba(255, 255, 255, 0.8)"
        backdropFilter="blur(4px)"
        zIndex={9999}
      >
        {content}
      </Box>
    );
  }

  return content;
}
