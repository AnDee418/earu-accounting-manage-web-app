'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Chip,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  readOnly?: boolean;
  color?: string;
  helperText?: string;
  maxTags?: number;
}

/**
 * タグ入力コンポーネント
 * 
 * 経費種別・取引先・摘要キーワード用のタグ入力フィールド
 * オートコンプリート機能と例示データの表示を実装
 */
export default function TagInput({
  values = [],
  onChange,
  placeholder = 'タグを入力...',
  suggestions = [],
  readOnly = false,
  color = '#2196F3',
  helperText,
  maxTags = 10,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 入力値に基づいて候補をフィルタリング
  useEffect(() => {
    if (inputValue.trim() && suggestions.length > 0) {
      const filtered = suggestions.filter(
        suggestion => 
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          !values.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, [inputValue, suggestions, values]);

  // タグ追加
  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !values.includes(trimmedTag) &&
      values.length < maxTags
    ) {
      const newValues = [...values, trimmedTag];
      // デバッグ用ログ（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        console.log('TagInput addTag:', { tag: trimmedTag, newValues });
      }
      onChange(newValues);
      setInputValue('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, [values, onChange, maxTags]);

  // タグ削除
  const removeTag = useCallback((indexToRemove: number) => {
    if (readOnly) return;
    onChange(values.filter((_, index) => index !== indexToRemove));
  }, [values, onChange, readOnly]);

  // キーボード操作
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (readOnly) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (selectedSuggestionIndex >= 0 && filteredSuggestions[selectedSuggestionIndex]) {
          addTag(filteredSuggestions[selectedSuggestionIndex]);
        } else if (inputValue.trim()) {
          addTag(inputValue);
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (showSuggestions && filteredSuggestions.length > 0) {
          setSelectedSuggestionIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (showSuggestions && filteredSuggestions.length > 0) {
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;

      case 'Backspace':
        if (!inputValue && values.length > 0) {
          removeTag(values.length - 1);
        }
        break;

      case 'Tab':
        if (showSuggestions && selectedSuggestionIndex >= 0) {
          event.preventDefault();
          addTag(filteredSuggestions[selectedSuggestionIndex]);
        }
        break;
    }
  };

  // 候補選択
  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  // フォーカス管理
  const handleInputFocus = () => {
    if (inputValue.trim() && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // 少し遅延させて候補クリックを可能にする
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* タグ表示エリア */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 0.5, 
        mb: 1,
        minHeight: values.length > 0 ? 'auto' : '32px',
      }}>
        {values.map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            onDelete={readOnly ? undefined : () => removeTag(index)}
            deleteIcon={<CloseIcon sx={{ fontSize: '0.8rem' }} />}
            size="small"
            sx={{
              height: '24px',
              fontSize: '0.75rem',
              backgroundColor: `${color}15`,
              color: color,
              border: `1px solid ${color}40`,
              '& .MuiChip-label': {
                px: 1,
              },
              '& .MuiChip-deleteIcon': {
                color: `${color}80`,
                fontSize: '0.8rem',
                '&:hover': {
                  color: color,
                },
              },
            }}
          />
        ))}
      </Box>

      {/* 入力フィールド */}
      {!readOnly && values.length < maxTags && (
        <TextField
          ref={inputRef}
          fullWidth
          size="small"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          helperText={helperText}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AddIcon sx={{ color: `${color}60`, fontSize: '1.2rem' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: `${color}40`,
              },
              '&:hover fieldset': {
                borderColor: `${color}60`,
              },
              '&.Mui-focused fieldset': {
                borderColor: color,
              },
            },
          }}
        />
      )}

      {/* 候補リスト */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <Paper
          ref={suggestionsRef}
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: '200px',
            overflow: 'auto',
            mt: 0.5,
          }}
        >
          <List dense>
            {filteredSuggestions.map((suggestion, index) => (
              <ListItem
                key={index}
                component="li"
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: index === selectedSuggestionIndex ? `${color}15` : 'transparent',
                  '&:hover': {
                    backgroundColor: `${color}10`,
                  },
                }}
              >
                <ListItemText
                  primary={suggestion}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* 制限表示 */}
      {values.length >= maxTags && (
        <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
          最大{maxTags}個まで追加できます
        </Typography>
      )}

      {/* 空状態のヒント */}
      {values.length === 0 && readOnly && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          条件が設定されていません
        </Typography>
      )}
    </Box>
  );
}