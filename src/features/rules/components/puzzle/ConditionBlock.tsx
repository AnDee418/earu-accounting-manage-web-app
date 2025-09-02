'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
} from '@mui/icons-material';

import { ConditionBlock as ConditionBlockType } from '@/types/rules';
import { CONDITION_TYPES } from './ConditionPalette';
import { ConditionInput } from './inputs';
import LogicalConnector from './LogicalConnector';
import { InlineValidationDisplay, ValidationIndicator } from './ValidationDisplay';
import { useConditionValidation } from '../../hooks/usePuzzleValidation';

interface ConditionBlockProps {
  condition: ConditionBlockType;
  index: number;
  isLast: boolean;
  onUpdate: (id: string, updates: Partial<ConditionBlockType>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

/**
 * 条件ブロックカードコンポーネント
 * 
 * Requirements: 1.2, 1.3, 4.3
 * - 条件タイプごとの色分けされたカードデザインを実装
 * - アイコン、タイトル、説明文の表示を実装
 * - 削除ボタンの実装
 */
export default function ConditionBlock({
  condition,
  index,
  isLast,
  onUpdate,
  onDelete,
  readOnly = false,
}: ConditionBlockProps) {
  const conditionType = CONDITION_TYPES[condition.type];
  
  // リアルタイムバリデーション
  const { validationResult, hasErrors, hasWarnings } = useConditionValidation(condition, {
    autoValidate: !readOnly,
    debounceDelay: 300,
  });
  
  if (!conditionType) {
    return (
      <Alert severity="error">
        不明な条件タイプ: {condition.type}
      </Alert>
    );
  }

  // ドラッグ関連の処理は SortableConditionBlock で管理

  // 削除ハンドラー
  const handleDelete = () => {
    if (readOnly) return;
    onDelete(condition.id);
  };

  // エラー状態の判定（UIState + バリデーション結果）
  const hasError = condition.uiState?.hasError || hasErrors;
  const hasWarning = hasWarnings;
  const isDragging = condition.uiState?.isDragging || false;

  // 条件値更新時にバリデーション状態も更新
  const handleConditionUpdate = (id: string, updates: Partial<ConditionBlockType>) => {
    // バリデーション結果をuiStateに反映
    if (validationResult && !readOnly) {
      updates.uiState = {
        ...updates.uiState,
        hasError: !validationResult.isValid,
        errorMessage: validationResult.errors[0]?.message,
      };
    }
    onUpdate(id, updates);
  };

  return (
    <Paper
      elevation={isDragging ? 6 : 1}
      sx={{
        position: 'relative',
        borderRadius: '8px',
        border: `2px solid ${
          hasError 
            ? '#f44336' 
            : hasWarning 
              ? '#ff9800' 
              : conditionType.color
        }`,
        backgroundColor: hasError 
          ? '#ffebee' 
          : hasWarning 
            ? '#fff3e0' 
            : 'white',
        padding: 1.5,
        minHeight: '80px',
        cursor: 'default',
        transition: 'all 0.2s ease-in-out',
        transform: isDragging ? 'rotate(1deg) scale(1.01)' : 'none',
        boxShadow: isDragging 
          ? `0 6px 20px rgba(0,0,0,0.2)` 
          : hasError 
            ? `0 2px 8px rgba(244, 67, 54, 0.3)`
            : hasWarning
              ? `0 2px 8px rgba(255, 152, 0, 0.3)`
              : `0 2px 8px rgba(0,0,0,0.1)`,
        '&:hover': !readOnly ? {
          boxShadow: `0 4px 16px rgba(0,0,0,0.15)`,
          transform: 'translateY(-1px)',
        } : {},
      }}
    >
      {/* ヘッダー部分 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        mb: 0.5,
      }}>
        {/* ドラッグハンドルは SortableConditionBlock で管理 */}

        {/* アイコン */}
        <Box
          sx={{
            fontSize: '1.2rem',
            padding: 0.8,
            borderRadius: '6px',
            backgroundColor: `${conditionType.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',
            minHeight: '32px',
          }}
        >
          {conditionType.icon}
        </Box>

        {/* タイトルと説明 */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: hasError 
                  ? '#f44336' 
                  : hasWarning 
                    ? '#ff9800' 
                    : conditionType.color,
                fontWeight: 'bold',
                fontSize: '0.9rem',
                mb: 0.2,
                lineHeight: 1.2,
              }}
            >
              {condition.label}
            </Typography>
            {/* バリデーション状態インジケーター */}
            <ValidationIndicator 
              validationResult={validationResult} 
              size="small" 
            />
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.75rem',
              lineHeight: 1.1,
              display: 'block',
            }}
          >
            {condition.description}
          </Typography>
        </Box>

        {/* 削除ボタン */}
        {!readOnly && (
          <Tooltip title="削除">
            <IconButton
              size="small"
              color="error"
              onClick={handleDelete}
              sx={{
                width: 28,
                height: 28,
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.2)',
                },
              }}
            >
              <DeleteIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* 条件値入力エリア */}
      <Box sx={{ 
        mt: 1,
        p: 1,
        backgroundColor: 'white',
        borderRadius: 1,
        border: '1px solid',
        borderColor: hasError 
          ? '#f4433640' 
          : hasWarning 
            ? '#ff980040' 
            : `${conditionType.color}30`,
      }}>
        <ConditionInput
          condition={condition}
          onUpdate={handleConditionUpdate}
          readOnly={readOnly}
        />
      </Box>

      {/* 論理演算子選択エリア（最後のブロック以外） */}
      {!isLast && (
        <Box sx={{ 
          mt: 1,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <LogicalConnector
            operator={condition.operator}
            onChange={(newOperator) => onUpdate(condition.id, { operator: newOperator })}
            position="between"
            disabled={false}
            readOnly={readOnly}
          />
        </Box>
      )}

      {/* バリデーションメッセージ表示 */}
      <InlineValidationDisplay
        validationResult={validationResult}
        conditionId={condition.id}
        compact={true}
      />

      {/* ブロック番号表示（デバッグ用） */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'absolute',
            top: -6,
            left: -6,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: conditionType.color,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 'bold',
          }}
        >
          {index + 1}
        </Box>
      )}
    </Paper>
  );
}