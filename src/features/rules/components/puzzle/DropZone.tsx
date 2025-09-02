'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box, Typography, Paper } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface DropZoneProps {
  id: string;
  isActive?: boolean;
  isEmpty?: boolean;
  children?: React.ReactNode;
}

/**
 * ドロップゾーンコンポーネント
 * 
 * Requirements: 4.1, 4.2
 * - ドロップゾーンの表示とハイライト機能を実装
 * - ドラッグ中の視覚的フィードバックを実装
 */
export default function DropZone({
  id,
  isActive = false,
  isEmpty = false,
  children,
}: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const isHighlighted = isActive && isOver;

  if (isEmpty) {
    return (
      <Paper
        ref={setNodeRef}
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: isHighlighted ? 'primary.50' : 'grey.50',
          border: '2px dashed',
          borderColor: isHighlighted ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <AddIcon 
          sx={{ 
            fontSize: '3rem',
            color: isHighlighted ? 'primary.main' : 'grey.400',
            transition: 'color 0.2s ease-in-out',
          }} 
        />
        <Typography 
          variant="h6" 
          color={isHighlighted ? 'primary.main' : 'text.secondary'}
          sx={{ transition: 'color 0.2s ease-in-out' }}
        >
          {isHighlighted ? 'ここにドロップ' : '条件ブロックをドラッグしてください'}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
        >
          パレットから条件を追加するか、既存の条件をドラッグして並び替えできます
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: 'relative',
        '&::before': isHighlighted ? {
          content: '""',
          position: 'absolute',
          top: -8,
          left: -8,
          right: -8,
          bottom: -8,
          border: '3px dashed',
          borderColor: 'primary.main',
          borderRadius: 3,
          backgroundColor: 'primary.50',
          opacity: 0.7,
          zIndex: 1,
          animation: 'pulse 1s infinite',
        } : {},
        '@keyframes pulse': {
          '0%': {
            opacity: 0.7,
          },
          '50%': {
            opacity: 0.4,
          },
          '100%': {
            opacity: 0.7,
          },
        },
      }}
    >
      {children}
    </Box>
  );
}