'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

interface EmptyStateProps {
  /** ヘルプを表示するコールバック */
  onShowHelp?: () => void;
  /** 条件追加を促すコールバック */
  onAddCondition?: () => void;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 条件ブロックが空の状態を表示するコンポーネント
 * 
 * Requirements: 5.2
 * - 空状態での説明メッセージ実装
 * - 「パズルのピースを組み合わせるように」という説明表示
 */
export default function EmptyState({
  onShowHelp,
  onAddCondition,
  className,
}: EmptyStateProps) {
  return (
    <Paper
      className={className}
      sx={{
        p: 4,
        textAlign: 'center',
        bgcolor: 'grey.50',
        border: '2px dashed',
        borderColor: 'grey.300',
        borderRadius: 2,
        mb: 3,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'primary.50',
        },
      }}
    >
      {/* メインメッセージ */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h5" 
          component="div"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1,
            mb: 2,
            color: 'text.secondary',
          }}
        >
          🧩 パズルのピースを組み合わせるように
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          条件ブロックを追加してルールを作成してください
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          直感的で分かりやすいルール作成を体験できます
        </Typography>
      </Box>

      {/* 説明セクション */}
      <Box sx={{ mb: 3, textAlign: 'left', maxWidth: 500, mx: 'auto' }}>
        <Typography variant="subtitle2" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
          📋 簡単3ステップ
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              1
            </Box>
            <Typography variant="body2">
              <strong>条件を選択:</strong> 経費種別、取引先、金額範囲などから選択
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              2
            </Box>
            <Typography variant="body2">
              <strong>値を入力:</strong> 具体的な条件値を入力（例：駐車場代、1000円以上）
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              3
            </Box>
            <Typography variant="body2">
              <strong>組み合わせ:</strong> AND/ORで複数条件を組み合わせ
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* アクションボタン */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        {onAddCondition && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddCondition}
            sx={{ minWidth: 140 }}
          >
            条件を追加
          </Button>
        )}
        
        {onShowHelp && (
          <Button
            variant="outlined"
            startIcon={<HelpIcon />}
            onClick={onShowHelp}
            sx={{ minWidth: 140 }}
          >
            使い方を見る
          </Button>
        )}
      </Box>

      {/* 追加のヒント */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          💡 ヒント: 条件タイプボタンにマウスを合わせると具体例が表示されます
        </Typography>
      </Box>
    </Paper>
  );
}