'use client';

import React from 'react';
import {
  Box,
  Button,
  Tooltip,
  Typography,
  Paper,
} from '@mui/material';
import { ConditionType } from '@/types/rules';

// 条件タイプの定義（設計書に基づく）
export const CONDITION_TYPES: Record<string, ConditionType> = {
  expenseType: {
    id: 'expenseType',
    label: '経費種別',
    description: '領収書の経費種別（駐車場代、交通費など）',
    icon: '💰',
    color: '#4CAF50',
    examples: ['駐車場代', '交通費', 'ガソリン代', '通信費'],
    inputType: 'tags'
  },
  merchant: {
    id: 'merchant',
    label: '取引先',
    description: '支払先の会社名や店舗名',
    icon: '🏪',
    color: '#2196F3',
    examples: ['JR東日本', 'セブンイレブン', 'ENEOS', 'NTT'],
    inputType: 'tags'
  },
  keyword: {
    id: 'keyword',
    label: '摘要キーワード',
    description: '領収書の摘要や説明に含まれる言葉',
    icon: '🔍',
    color: '#FF9800',
    examples: ['電車代', '駐車場', 'ガソリン', '会議'],
    inputType: 'tags'
  },
  amount: {
    id: 'amount',
    label: '金額範囲',
    description: '支払金額の範囲',
    icon: '💴',
    color: '#9C27B0',
    examples: ['1000円以上', '5000円以下', '1000-5000円'],
    inputType: 'range'
  },
  receiptContent: {
    id: 'receiptContent',
    label: '領収書内容',
    description: '領収書全体の内容パターン',
    icon: '📄',
    color: '#607D8B',
    examples: ['.*駐車場.*', '.*交通費.*'],
    inputType: 'text'
  },
};

interface ConditionPaletteProps {
  onAddCondition: (conditionType: keyof typeof CONDITION_TYPES) => void;
  disabled?: boolean;
  className?: string;
  sx?: any; // MUI sx prop for styling
}

/**
 * 条件タイプ選択パレットコンポーネント
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.3
 * - 各条件タイプ（経費種別、取引先、摘要キーワード、金額範囲、領収書内容）のボタンを実装
 * - 条件タイプごとの色分けとアイコン表示を実装
 * - ツールチップで具体例を表示する機能を実装
 */
export default function ConditionPalette({
  onAddCondition,
  disabled = false,
  className,
  sx,
}: ConditionPaletteProps) {
  
  // ツールチップ内容を生成
  const generateTooltipContent = (conditionType: ConditionType) => (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
        {conditionType.label}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
        {conditionType.description}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
        具体例:
      </Typography>
      {conditionType.examples.map((example, index) => (
        <Typography key={index} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
          • {example}
        </Typography>
      ))}
    </Box>
  );

  return (
    <Paper
      elevation={1}
      className={className}
      sx={{
        p: 1.5,
        bgcolor: 'grey.50',
        borderRadius: 2,
        ...sx,
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.primary', fontSize: '1rem' }}>
        🧩 条件ブロックを追加
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary', fontSize: '0.85rem' }}>
        パズルのピースを選んで条件を組み立てましょう
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
      }}>
        {Object.entries(CONDITION_TYPES).map(([type, config]) => (
          <Tooltip
            key={type}
            title={generateTooltipContent(config)}
            placement="top"
            arrow
            enterDelay={300}
            leaveDelay={200}
          >
            <Button
              variant="outlined"
              disabled={disabled}
              onClick={() => onAddCondition(type as keyof typeof CONDITION_TYPES)}
              startIcon={
                <Box
                  component="span"
                  sx={{
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                  }}
                >
                  {config.icon}
                </Box>
              }
              sx={{
                minWidth: '120px',
                height: '36px',
                borderColor: config.color,
                color: config.color,
                backgroundColor: 'white',
                borderWidth: '2px',
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: `${config.color}15`,
                  borderColor: config.color,
                  borderWidth: '2px',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${config.color}40`,
                },
                '&:active': {
                  transform: 'translateY(0px)',
                },
                '&:disabled': {
                  borderColor: 'grey.300',
                  color: 'grey.400',
                  backgroundColor: 'grey.100',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {config.label}
            </Button>
          </Tooltip>
        ))}
      </Box>

      <Typography variant="caption" sx={{ 
        display: 'block', 
        mt: 2, 
        color: 'text.secondary',
        fontStyle: 'italic',
      }}>
        💡 ヒント: ボタンにマウスを合わせると具体例が表示されます
      </Typography>
    </Paper>
  );
}