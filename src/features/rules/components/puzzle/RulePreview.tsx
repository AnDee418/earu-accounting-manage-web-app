'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  Visibility as PreviewIcon,
  CheckCircle as ValidIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { ConditionBlock, AmountRange } from '@/types/rules';
import { CONDITION_TYPES } from './ConditionPalette';
import {
  formatConditionValues,
  getOperatorLabel,
  getOperatorColor,
  generateNaturalLanguage,
  checkCompletionStatus,
} from '../../utils/naturalLanguageGenerator';

interface RulePreviewProps {
  conditions: ConditionBlock[];
  className?: string;
  sx?: any;
}

/**
 * 自然言語プレビューコンポーネント
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 * - 条件ブロックから自然言語への変換ロジックを実装
 * - リアルタイムでのプレビュー更新機能を実装
 * - 複雑な条件組み合わせの読みやすい表示を実装
 */
export default function RulePreview({
  conditions,
  className,
  sx,
}: RulePreviewProps) {
  
  // 自然言語の生成
  const naturalLanguage = useMemo(() => {
    // デバッグ用ログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log('RulePreview conditions:', conditions);
    }
    return generateNaturalLanguage(conditions);
  }, [conditions]);

  // 詳細な条件表示
  const detailedConditions = useMemo(() => {
    return conditions.map((condition, index) => {
      const typeConfig = CONDITION_TYPES[condition.type];
      const values = formatConditionValues(condition);
      const hasValues = condition.values && 
        ((Array.isArray(condition.values) && condition.values.length > 0) ||
         (typeof condition.values === 'object' && 
          (condition.values as AmountRange).min !== undefined || 
          (condition.values as AmountRange).max !== undefined));

      return {
        ...condition,
        typeConfig,
        formattedValues: values,
        hasValues,
        isLast: index === conditions.length - 1,
      };
    });
  }, [conditions]);

  // 条件の完成度チェック
  const completionStatus = useMemo(() => {
    return checkCompletionStatus(conditions);
  }, [conditions]);

  return (
    <Paper
      elevation={1}
      className={className}
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        ...sx,
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <PreviewIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
        <Typography variant="subtitle1" sx={{ flex: 1, fontSize: '1rem' }}>
          ルールプレビュー
        </Typography>
        
        {/* 完成度インジケーター */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {completionStatus.isComplete ? (
            <ValidIcon sx={{ color: 'success.main', fontSize: '1.2rem' }} />
          ) : (
            <WarningIcon sx={{ color: 'warning.main', fontSize: '1.2rem' }} />
          )}
          <Typography variant="caption" color="text.secondary">
            {completionStatus.completed}/{completionStatus.total} 完了
          </Typography>
        </Box>
      </Box>

      {/* 自然言語プレビュー */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          📝 ルールの読み方
        </Typography>
        <Paper
          sx={{
            p: 2,
            bgcolor: conditions.length > 0 ? 'primary.50' : 'grey.50',
            border: '1px solid',
            borderColor: conditions.length > 0 ? 'primary.200' : 'grey.200',
            borderRadius: 1,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'medium',
              color: conditions.length > 0 ? 'primary.dark' : 'text.secondary',
              lineHeight: 1.6,
            }}
          >
            {naturalLanguage}
          </Typography>
        </Paper>
      </Box>

      {/* 詳細な条件表示 */}
      {conditions.length > 0 && (
        <>
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
            🔍 条件の詳細
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {detailedConditions.map((condition, index) => (
              <Box key={condition.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {/* 条件番号 */}
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: condition.typeConfig?.color || 'grey.400',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {index + 1}
                  </Box>

                  {/* 条件アイコンとタイプ */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '1.2rem' }}>
                      {condition.typeConfig?.icon}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {condition.typeConfig?.label}
                    </Typography>
                  </Box>

                  {/* 条件値 */}
                  <Chip
                    label={condition.formattedValues}
                    size="small"
                    variant={condition.hasValues ? 'filled' : 'outlined'}
                    color={condition.hasValues ? 'primary' : 'default'}
                    sx={{
                      maxWidth: '200px',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />

                  {/* 論理演算子 */}
                  {!condition.isLast && (
                    <Chip
                      label={getOperatorLabel(condition.operator)}
                      size="small"
                      sx={{
                        bgcolor: `${getOperatorColor(condition.operator)}20`,
                        color: getOperatorColor(condition.operator),
                        fontWeight: 'bold',
                        borderColor: getOperatorColor(condition.operator),
                        border: '1px solid',
                      }}
                    />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* 空状態のメッセージ */}
      {conditions.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            条件ブロックを追加すると、ここにルールの読み方が表示されます
          </Typography>
        </Box>
      )}

      {/* 使用例の表示 */}
      {conditions.length > 0 && completionStatus.isComplete && (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'success.dark' }}>
              ✅ このルールの適用例
            </Typography>
            <Typography variant="body2" color="success.dark">
              上記の条件を満たす領収書が自動的に処理されます。
              条件を変更すると、リアルタイムでプレビューが更新されます。
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
}