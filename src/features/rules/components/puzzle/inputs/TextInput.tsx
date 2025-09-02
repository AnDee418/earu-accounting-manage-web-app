'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  TextFields as TextIcon,
  Code as RegexIcon,
} from '@mui/icons-material';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  readOnly?: boolean;
  color?: string;
  helperText?: string;
  multiline?: boolean;
  maxRows?: number;
}

/**
 * テキスト入力コンポーネント
 * 
 * 領収書内容用のテキスト入力フィールド
 * オートコンプリート機能と例示データの表示を実装
 */
export default function TextInput({
  value = '',
  onChange,
  placeholder = 'テキストを入力...',
  suggestions = [],
  readOnly = false,
  color = '#607D8B',
  helperText,
  multiline = false,
  maxRows = 3,
}: TextInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isRegexMode, setIsRegexMode] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 初期値設定
  useEffect(() => {
    setInputValue(value);
    // 正規表現パターンの検出
    setIsRegexMode(value.includes('.*') || value.includes('^') || value.includes('$') || value.includes('[') || value.includes(']'));
  }, [value]);

  // 入力値に基づいて候補をフィルタリング
  useEffect(() => {
    if (inputValue.trim() && suggestions.length > 0 && !isRegexMode) {
      const filtered = suggestions.filter(
        suggestion => 
          suggestion.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, [inputValue, suggestions, isRegexMode]);

  // 値変更
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onChange(newValue);
    
    // 正規表現パターンの検出
    setIsRegexMode(newValue.includes('.*') || newValue.includes('^') || newValue.includes('$') || newValue.includes('[') || newValue.includes(']'));
  };

  // 候補選択
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // キーボード操作
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (readOnly) return;

    switch (event.key) {
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

      case 'Enter':
        if (showSuggestions && selectedSuggestionIndex >= 0) {
          event.preventDefault();
          handleSuggestionClick(filteredSuggestions[selectedSuggestionIndex]);
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;

      case 'Tab':
        if (showSuggestions && selectedSuggestionIndex >= 0) {
          event.preventDefault();
          handleSuggestionClick(filteredSuggestions[selectedSuggestionIndex]);
        }
        break;
    }
  };

  // フォーカス管理
  const handleInputFocus = () => {
    if (inputValue.trim() && filteredSuggestions.length > 0 && !isRegexMode) {
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

  // 正規表現バリデーション
  const validateRegex = useCallback((pattern: string): boolean => {
    if (!pattern || !isRegexMode) return true;
    
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }, [isRegexMode]);

  const isValidRegex = validateRegex(inputValue);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* モード表示 */}
      {isRegexMode && (
        <Box sx={{ mb: 1 }}>
          <Chip
            icon={<RegexIcon />}
            label="正規表現モード"
            size="small"
            color={isValidRegex ? "success" : "error"}
            variant="outlined"
            sx={{
              fontSize: '0.75rem',
              height: '24px',
            }}
          />
        </Box>
      )}

      {/* 入力フィールド */}
      <TextField
        ref={inputRef}
        fullWidth
        multiline={multiline}
        maxRows={maxRows}
        size="small"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        helperText={
          !isValidRegex 
            ? "正規表現の構文が正しくありません" 
            : helperText
        }
        error={!isValidRegex}
        disabled={readOnly}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {isRegexMode ? (
                <RegexIcon sx={{ color: isValidRegex ? `${color}60` : 'error.main', fontSize: '1.2rem' }} />
              ) : (
                <TextIcon sx={{ color: `${color}60`, fontSize: '1.2rem' }} />
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: !isValidRegex ? 'error.main' : `${color}40`,
            },
            '&:hover fieldset': {
              borderColor: !isValidRegex ? 'error.main' : `${color}60`,
            },
            '&.Mui-focused fieldset': {
              borderColor: !isValidRegex ? 'error.main' : color,
            },
          },
        }}
      />

      {/* 候補リスト */}
      {showSuggestions && filteredSuggestions.length > 0 && !isRegexMode && (
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
                    fontFamily: isRegexMode ? 'monospace' : 'inherit',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* 正規表現ヘルプ */}
      {isRegexMode && isValidRegex && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          💡 正規表現例: .*駐車場.* (駐車場を含む), ^交通費 (交通費で始まる), 会議$ (会議で終わる)
        </Typography>
      )}

      {/* 空状態のヒント */}
      {!inputValue && readOnly && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          テキスト条件が設定されていません
        </Typography>
      )}

      {/* 候補表示ヒント */}
      {!isRegexMode && suggestions.length > 0 && !readOnly && !inputValue && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          💡 入力すると候補が表示されます: {suggestions.slice(0, 2).join('、')}など
        </Typography>
      )}
    </Box>
  );
}