'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  CardActions,
  Divider,
  Tooltip,
  Alert,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

import { ConditionBlock, LogicalOperator } from '@/types/rules';

interface RuleConditionBuilderProps {
  conditions: ConditionBlock[];
  onChange: (conditions: ConditionBlock[]) => void;
}

const CONDITION_TYPES = {
  expenseType: {
    label: '経費種別',
    description: '領収書の経費種別（駐車場代、交通費など）',
    icon: '💰',
    color: '#4CAF50',
    examples: ['駐車場代', '交通費', 'ガソリン代', '通信費'],
  },
  merchant: {
    label: '取引先',
    description: '支払先の会社名や店舗名',
    icon: '🏪',
    color: '#2196F3',
    examples: ['JR東日本', 'セブンイレブン', 'ENEOS', 'NTT'],
  },
  keyword: {
    label: '摘要キーワード',
    description: '領収書の摘要や説明に含まれる言葉',
    icon: '🔍',
    color: '#FF9800',
    examples: ['電車代', '駐車場', 'ガソリン', '会議'],
  },
  amount: {
    label: '金額範囲',
    description: '支払金額の範囲',
    icon: '💴',
    color: '#9C27B0',
    examples: ['1000円以上', '5000円以下', '1000-5000円'],
  },
  receiptContent: {
    label: '領収書内容',
    description: '領収書全体の内容パターン',
    icon: '📄',
    color: '#607D8B',
    examples: ['.*駐車場.*', '.*交通費.*'],
  },
} as const;

export default function RuleConditionBuilder({
  conditions,
  onChange,
}: RuleConditionBuilderProps) {
  const [showHelp, setShowHelp] = useState(false);

  const addCondition = useCallback((type: keyof typeof CONDITION_TYPES) => {
    const newCondition: ConditionBlock = {
      id: `condition-${Date.now()}`,
      type,
      operator: 'AND',
      values: type === 'amount' ? { min: undefined, max: undefined } : [],
      label: CONDITION_TYPES[type].label,
      description: CONDITION_TYPES[type].description,
    };

    onChange([...conditions, newCondition]);
  }, [conditions, onChange]);

  const updateCondition = useCallback((id: string, updates: Partial<ConditionBlock>) => {
    const updated = conditions.map(condition =>
      condition.id === id ? { ...condition, ...updates } : condition
    );
    onChange(updated);
  }, [conditions, onChange]);

  const removeCondition = useCallback((id: string) => {
    onChange(conditions.filter(condition => condition.id !== id));
  }, [conditions, onChange]);

  const renderConditionCard = (condition: ConditionBlock, index: number) => {
    const typeConfig = CONDITION_TYPES[condition.type];
    const isLast = index === conditions.length - 1;

    return (
      <Box key={condition.id} sx={{ position: 'relative' }}>
        <Card
          sx={{
            border: `2px solid ${typeConfig.color}`,
            borderRadius: 2,
            position: 'relative',
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  fontSize: '1.5rem',
                  mr: 1,
                  p: 0.5,
                  borderRadius: 1,
                  bgcolor: `${typeConfig.color}20`,
                }}
              >
                {typeConfig.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: typeConfig.color, fontWeight: 'bold' }}>
                  {typeConfig.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {typeConfig.description}
                </Typography>
              </Box>
              <Tooltip title="この条件を削除">
                <IconButton
                  size="small"
                  onClick={() => removeCondition(condition.id)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {renderConditionInput(condition)}
          </CardContent>

          {!isLast && (
            <CardActions sx={{ justifyContent: 'center', py: 1 }}>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={condition.operator}
                  onChange={(e) => updateCondition(condition.id, { operator: e.target.value as LogicalOperator })}
                  sx={{
                    bgcolor: condition.operator === 'AND' ? '#4CAF50' : '#FF9800',
                    color: 'white',
                    fontWeight: 'bold',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSelect-icon': { color: 'white' },
                  }}
                >
                  <MenuItem value="AND">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">AND</Typography>
                      <Typography variant="caption">(すべて満たす)</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="OR">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">OR</Typography>
                      <Typography variant="caption">(どれか満たす)</Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </CardActions>
          )}
        </Card>

        {!isLast && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 40,
                bgcolor: condition.operator === 'AND' ? '#4CAF50' : '#FF9800',
                borderRadius: 2,
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

  const renderConditionInput = (condition: ConditionBlock) => {
    const typeConfig = CONDITION_TYPES[condition.type];

    switch (condition.type) {
      case 'amount':
        const amountValues = condition.values as { min?: number; max?: number };
        return (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              label="最小金額"
              type="number"
              value={amountValues.min || ''}
              onChange={(e) => updateCondition(condition.id, {
                values: { ...amountValues, min: e.target.value ? Number(e.target.value) : undefined }
              })}
              InputProps={{ endAdornment: '円' }}
            />
            <Typography>〜</Typography>
            <TextField
              size="small"
              label="最大金額"
              type="number"
              value={amountValues.max || ''}
              onChange={(e) => updateCondition(condition.id, {
                values: { ...amountValues, max: e.target.value ? Number(e.target.value) : undefined }
              })}
              InputProps={{ endAdornment: '円' }}
            />
          </Box>
        );

      default:
        return (
          <Autocomplete
            multiple
            freeSolo
            size="small"
            options={typeConfig.examples}
            value={condition.values as string[]}
            onChange={(_, newValue) => updateCondition(condition.id, { values: newValue })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  sx={{ bgcolor: `${typeConfig.color}10` }}
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={`例: ${typeConfig.examples.slice(0, 2).join(', ')}`}
                helperText={`複数入力可能。例: ${typeConfig.examples.join(', ')}`}
              />
            )}
          />
        );
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          ルール条件を組み立てる
        </Typography>
        <Tooltip title="使い方を表示">
          <IconButton onClick={() => setShowHelp(!showHelp)}>
            <HelpIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {showHelp && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            📝 ルール条件の組み立て方
          </Typography>
          <Typography variant="body2" component="div">
            <strong>1. 条件ブロックを追加:</strong> 下のボタンから条件の種類を選んで追加<br/>
            <strong>2. 条件を設定:</strong> 各ブロックで具体的な条件を入力<br/>
            <strong>3. 論理演算子を選択:</strong> 
            <Chip size="small" label="AND" sx={{ mx: 0.5, bgcolor: '#4CAF50', color: 'white' }} />
            すべての条件を満たす / 
            <Chip size="small" label="OR" sx={{ mx: 0.5, bgcolor: '#FF9800', color: 'white' }} />
            どれかの条件を満たす
          </Typography>
        </Alert>
      )}

      <Stack spacing={3} sx={{ mb: 3 }}>
        {conditions.map((condition, index) => renderConditionCard(condition, index))}
      </Stack>

      {conditions.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'grey.50',
            border: '2px dashed',
            borderColor: 'grey.300',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            🧩 条件ブロックを追加してルールを作成
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            パズルのピースを組み合わせるように、直感的にルールを作成できます
          </Typography>
        </Paper>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {Object.entries(CONDITION_TYPES).map(([type, config]) => (
          <Button
            key={type}
            variant="outlined"
            startIcon={<span style={{ fontSize: '1.2rem' }}>{config.icon}</span>}
            onClick={() => addCondition(type as keyof typeof CONDITION_TYPES)}
            sx={{
              borderColor: config.color,
              color: config.color,
              '&:hover': {
                bgcolor: `${config.color}10`,
                borderColor: config.color,
              },
            }}
          >
            {config.label}を追加
          </Button>
        ))}
      </Box>

      {conditions.length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            📋 ルールの読み方
          </Typography>
          <Typography variant="body2" component="div">
            {conditions.map((condition, index) => (
              <span key={condition.id}>
                <strong>{CONDITION_TYPES[condition.type].label}</strong>
                {condition.type === 'amount' 
                  ? ` (${(condition.values as any).min || '0'}円〜${(condition.values as any).max || '∞'}円)`
                  : ` (${(condition.values as string[]).join(', ') || '未設定'})`
                }
                {index < conditions.length - 1 && (
                  <Chip
                    size="small"
                    label={condition.operator}
                    sx={{
                      mx: 1,
                      bgcolor: condition.operator === 'AND' ? '#4CAF50' : '#FF9800',
                      color: 'white',
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </span>
            ))}
          </Typography>
        </Box>
      )}
    </Box>
  );
}