'use client';

import React from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  AccountTree as AndIcon,
  CallSplit as OrIcon,
} from '@mui/icons-material';

import { LogicalOperator } from '@/types/rules';

interface LogicalConnectorProps {
  operator: LogicalOperator;
  onChange: (operator: LogicalOperator) => void;
  position?: 'between' | 'end';
  disabled?: boolean;
  readOnly?: boolean;
}

// 演算子スタイル定義（設計書に基づく）
const ConnectorStyles = {
  AND: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    label: 'AND (すべて満たす)',
    description: '上記の条件をすべて満たす場合',
    lineStyle: 'solid',
    lineWidth: '4px',
    icon: <AndIcon />,
  },
  OR: {
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    label: 'OR (どれか満たす)',
    description: '上記の条件のどれかを満たす場合',
    lineStyle: 'dashed',
    lineWidth: '4px',
    icon: <OrIcon />,
  },
} as const;

/**
 * 論理演算子選択コンポーネント
 * 
 * Requirements: 1.4, 1.5, 4.4
 * - AND/ORの選択ドロップダウンを実装
 * - 演算子ごとの色分け表示（AND=緑、OR=オレンジ）を実装
 * - 「すべて満たす」「どれか満たす」の説明文表示を実装
 */
export default function LogicalConnector({
  operator,
  onChange,
  position = 'between',
  disabled = false,
  readOnly = false,
}: LogicalConnectorProps) {
  const currentStyle = ConnectorStyles[operator];

  // 演算子変更ハンドラー
  const handleOperatorChange = (event: any) => {
    if (readOnly || disabled) return;
    onChange(event.target.value as LogicalOperator);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        my: 2,
        position: 'relative',
      }}
    >
      {/* 視覚的接続線（上部） */}
      <Box
        sx={{
          position: 'absolute',
          top: -16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: currentStyle.lineWidth,
          height: '16px',
          backgroundColor: currentStyle.color,
          borderRadius: currentStyle.lineStyle === 'dashed' ? 0 : '2px',
          ...(currentStyle.lineStyle === 'dashed' && {
            backgroundImage: `repeating-linear-gradient(
              to bottom,
              ${currentStyle.color} 0px,
              ${currentStyle.color} 4px,
              transparent 4px,
              transparent 8px
            )`,
            backgroundColor: 'transparent',
          }),
        }}
      />

      {/* メインコネクター */}
      <Paper
        elevation={1}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.8,
          backgroundColor: currentStyle.backgroundColor,
          border: `2px solid ${currentStyle.color}`,
          borderRadius: '16px',
          minWidth: '140px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* アイコン */}
        <Box
          sx={{
            color: currentStyle.color,
            display: 'flex',
            alignItems: 'center',
            fontSize: '1rem',
          }}
        >
          {currentStyle.icon}
        </Box>

        {/* 演算子選択ドロップダウン */}
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={operator}
            onChange={handleOperatorChange}
            disabled={disabled || readOnly}
            sx={{
              '& .MuiSelect-select': {
                color: currentStyle.color,
                fontWeight: 'bold',
                fontSize: '0.8rem',
                py: 0.3,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: currentStyle.color,
                borderWidth: '1px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: currentStyle.color,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: currentStyle.color,
              },
            }}
          >
            <MenuItem value="AND">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AndIcon sx={{ color: ConnectorStyles.AND.color, fontSize: '1rem' }} />
                <Typography sx={{ color: ConnectorStyles.AND.color, fontWeight: 'bold' }}>
                  AND
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem value="OR">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <OrIcon sx={{ color: ConnectorStyles.OR.color, fontSize: '1rem' }} />
                <Typography sx={{ color: ConnectorStyles.OR.color, fontWeight: 'bold' }}>
                  OR
                </Typography>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* 説明文 */}
        <Tooltip title={currentStyle.description} placement="top" arrow>
          <Typography
            variant="caption"
            sx={{
              color: currentStyle.color,
              fontWeight: 'bold',
              fontSize: '0.7rem',
              whiteSpace: 'nowrap',
              cursor: 'help',
            }}
          >
            {operator === 'AND' ? 'すべて' : 'どれか'}
          </Typography>
        </Tooltip>
      </Paper>

      {/* 視覚的接続線（下部） */}
      {position === 'between' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -16,
            left: '50%',
            transform: 'translateX(-50%)',
            width: currentStyle.lineWidth,
            height: '16px',
            backgroundColor: currentStyle.color,
            borderRadius: currentStyle.lineStyle === 'dashed' ? 0 : '2px',
            ...(currentStyle.lineStyle === 'dashed' && {
              backgroundImage: `repeating-linear-gradient(
                to bottom,
                ${currentStyle.color} 0px,
                ${currentStyle.color} 4px,
                transparent 4px,
                transparent 8px
              )`,
              backgroundColor: 'transparent',
            }),
          }}
        />
      )}

      {/* 演算子の詳細説明（開発用） */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'absolute',
            right: -120,
            top: '50%',
            transform: 'translateY(-50%)',
            p: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            borderRadius: 1,
            fontSize: '0.7rem',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {currentStyle.label}
        </Box>
      )}
    </Box>
  );
}