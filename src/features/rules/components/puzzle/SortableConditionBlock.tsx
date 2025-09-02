'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, IconButton, Tooltip } from '@mui/material';
import { DragIndicator as DragIcon } from '@mui/icons-material';

import { ConditionBlock as ConditionBlockType } from '@/types/rules';
import ConditionBlockComponent from './ConditionBlock';

interface SortableConditionBlockProps {
  condition: ConditionBlockType;
  index: number;
  isLast: boolean;
  onUpdate: (id: string, updates: Partial<ConditionBlockType>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  isDragOverlay?: boolean;
}

/**
 * ソート可能な条件ブロックコンポーネント
 * 
 * Requirements: 4.1, 4.2
 * - 条件ブロックのドラッグ可能化を実装
 * - ドラッグ中の視覚的フィードバックを実装
 */
export default function SortableConditionBlock({
  condition,
  index,
  isLast,
  onUpdate,
  onDelete,
  readOnly = false,
  isDragOverlay = false,
}: SortableConditionBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: condition.id,
    disabled: readOnly,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // ドラッグオーバーレイ用のスタイル
  const overlayStyle = isDragOverlay ? {
    transform: 'rotate(5deg)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    zIndex: 1000,
  } : {};

  return (
    <Box
      ref={setNodeRef}
      style={{ ...style, ...overlayStyle }}
      sx={{
        mb: 2,
        position: 'relative',
        zIndex: isDragging ? 999 : 2,
      }}
      data-condition-block
      data-condition-id={condition.id}
    >
      {/* ドラッグハンドル */}
      {!readOnly && !isDragOverlay && (
        <Box
          {...attributes}
          {...listeners}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            cursor: 'grab',
            '&:active': {
              cursor: 'grabbing',
            },
          }}
        >
          <Tooltip title="ドラッグして順序を変更">
            <IconButton
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'grey.600',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  color: 'primary.main',
                },
              }}
            >
              <DragIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <ConditionBlockComponent
        condition={condition}
        index={index}
        isLast={isLast}
        onUpdate={onUpdate}
        onDelete={onDelete}
        readOnly={readOnly}
      />
    </Box>
  );
}