'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  InputAdornment,
  FormHelperText,
} from '@mui/material';
import {
  CurrencyYen as YenIcon,
} from '@mui/icons-material';

import { AmountRange } from '@/types/rules';

interface AmountRangeInputProps {
  value: AmountRange;
  onChange: (value: AmountRange) => void;
  readOnly?: boolean;
  color?: string;
}

/**
 * 金額範囲入力コンポーネント
 * 
 * 金額範囲用の最小・最大金額入力フィールドを実装
 */
export default function AmountRangeInput({
  value = { min: undefined, max: undefined, currency: 'JPY' },
  onChange,
  readOnly = false,
  color = '#9C27B0',
}: AmountRangeInputProps) {
  const [minValue, setMinValue] = useState<string>(value.min?.toString() || '');
  const [maxValue, setMaxValue] = useState<string>(value.max?.toString() || '');
  const [error, setError] = useState<string>('');

  // 初期値設定
  useEffect(() => {
    setMinValue(value.min?.toString() || '');
    setMaxValue(value.max?.toString() || '');
  }, [value.min, value.max]);

  // バリデーション
  const validateRange = useCallback((min?: number, max?: number): string => {
    if (min !== undefined && min < 0) {
      return '最小金額は0以上で入力してください';
    }
    if (max !== undefined && max < 0) {
      return '最大金額は0以上で入力してください';
    }
    if (min !== undefined && max !== undefined && min >= max) {
      return '最小金額は最大金額より小さくしてください';
    }
    if (min !== undefined && max !== undefined && min === max) {
      return '最小金額と最大金額が同じです。範囲を指定してください';
    }
    if (min !== undefined && min > 1000000000) {
      return '最小金額は1,000,000,000円以下で入力してください';
    }
    if (max !== undefined && max > 1000000000) {
      return '最大金額は1,000,000,000円以下で入力してください';
    }
    return '';
  }, []);

  // 値更新
  const updateValue = useCallback((newMin?: number, newMax?: number) => {
    const errorMessage = validateRange(newMin, newMax);
    setError(errorMessage);

    const newValue: AmountRange = {
      min: newMin,
      max: newMax,
      currency: 'JPY',
    };

    onChange(newValue);
  }, [onChange, validateRange]);

  // 最小金額変更
  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setMinValue(inputValue);

    if (inputValue === '') {
      updateValue(undefined, value.max);
    } else {
      const numValue = parseInt(inputValue.replace(/[^\d]/g, ''), 10);
      if (!isNaN(numValue)) {
        updateValue(numValue, value.max);
      }
    }
  };

  // 最大金額変更
  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setMaxValue(inputValue);

    if (inputValue === '') {
      updateValue(value.min, undefined);
    } else {
      const numValue = parseInt(inputValue.replace(/[^\d]/g, ''), 10);
      if (!isNaN(numValue)) {
        updateValue(value.min, numValue);
      }
    }
  };

  // 数値フォーマット
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ja-JP');
  };

  // フォーカス時の処理（カンマを除去）
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    const rawValue = target.value.replace(/[^\d]/g, '');
    target.value = rawValue;
  };

  // ブラー時の処理（フォーマット適用）
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const target = event.target as HTMLInputElement;
    const rawValue = target.value.replace(/[^\d]/g, '');
    
    if (rawValue) {
      const numValue = parseInt(rawValue, 10);
      if (!isNaN(numValue)) {
        target.value = formatNumber(numValue);
        if (type === 'min') {
          setMinValue(formatNumber(numValue));
        } else {
          setMaxValue(formatNumber(numValue));
        }
      }
    }
  };

  // 範囲表示テキスト生成
  const getRangeText = (): string => {
    if (value.min !== undefined && value.max !== undefined) {
      return `${formatNumber(value.min)}円 〜 ${formatNumber(value.max)}円`;
    } else if (value.min !== undefined) {
      return `${formatNumber(value.min)}円以上`;
    } else if (value.max !== undefined) {
      return `${formatNumber(value.max)}円以下`;
    }
    return '金額範囲が設定されていません';
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* 範囲表示 */}
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 1, 
          color: value.min !== undefined || value.max !== undefined ? color : 'text.secondary',
          fontWeight: value.min !== undefined || value.max !== undefined ? 'bold' : 'normal',
        }}
      >
        {getRangeText()}
      </Typography>

      {/* 入力フィールド */}
      {!readOnly && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* 最小金額 */}
          <TextField
            size="small"
            label="最小金額"
            value={minValue}
            onChange={handleMinChange}
            onFocus={handleFocus}
            onBlur={(e) => handleBlur(e as React.FocusEvent<HTMLInputElement>, 'min')}
            placeholder="0"
            error={!!error}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <YenIcon sx={{ color: error ? '#f44336' : `${color}60`, fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary">
                    円
                  </Typography>
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: error ? '#f44336' : `${color}40`,
                },
                '&:hover fieldset': {
                  borderColor: error ? '#f44336' : `${color}60`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: error ? '#f44336' : color,
                },
              },
            }}
          />

          {/* 区切り文字 */}
          <Typography variant="body1" color="text.secondary" sx={{ mx: 1 }}>
            〜
          </Typography>

          {/* 最大金額 */}
          <TextField
            size="small"
            label="最大金額"
            value={maxValue}
            onChange={handleMaxChange}
            onFocus={handleFocus}
            onBlur={(e) => handleBlur(e as React.FocusEvent<HTMLInputElement>, 'max')}
            placeholder="∞"
            error={!!error}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <YenIcon sx={{ color: error ? '#f44336' : `${color}60`, fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary">
                    円
                  </Typography>
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: error ? '#f44336' : `${color}40`,
                },
                '&:hover fieldset': {
                  borderColor: error ? '#f44336' : `${color}60`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: error ? '#f44336' : color,
                },
              },
            }}
          />
        </Box>
      )}

      {/* エラーメッセージ */}
      {error && (
        <FormHelperText error sx={{ mt: 1 }}>
          {error}
        </FormHelperText>
      )}

      {/* ヘルプテキスト */}
      {!error && !readOnly && (
        <FormHelperText sx={{ mt: 1 }}>
          どちらか一方だけでも設定できます（例: 1000円以上、5000円以下）
        </FormHelperText>
      )}

      {/* 読み取り専用時の空状態 */}
      {readOnly && value.min === undefined && value.max === undefined && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          金額範囲が設定されていません
        </Typography>
      )}
    </Box>
  );
}