'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  PlayArrow as ValidateIcon,
} from '@mui/icons-material';

import { ValidationResult, ComprehensiveRuleSet } from '@/types/rules';
import { useRuleValidation } from '@/features/rules/hooks/useRuleValidation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface RuleValidationPanelProps {
  ruleSet?: ComprehensiveRuleSet;
  onRefresh?: () => void;
}

export default function RuleValidationPanel({
  ruleSet,
  onRefresh,
}: RuleValidationPanelProps) {
  const {
    validationResult,
    loading,
    error,
    validateRuleSet,
    validatePCACompliance,
  } = useRuleValidation();

  const [validating, setValidating] = useState(false);

  const handleValidate = async () => {
    if (!ruleSet) return;
    
    setValidating(true);
    try {
      await validateRuleSet(ruleSet);
      onRefresh?.();
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setValidating(false);
    }
  };

  const handlePCAValidation = async () => {
    if (!ruleSet) return;
    
    setValidating(true);
    try {
      await validatePCACompliance(ruleSet);
      onRefresh?.();
    } catch (err) {
      console.error('PCA validation failed:', err);
    } finally {
      setValidating(false);
    }
  };

  const getValidationSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getValidationIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <SuccessIcon color="success" />;
      default:
        return <SuccessIcon />;
    }
  };

  const renderValidationSummary = () => {
    if (!validationResult) return null;

    const errorCount = validationResult.errors?.filter(e => e.severity === 'error').length || 0;
    const warningCount = validationResult.errors?.filter(e => e.severity === 'warning').length || 0;
    const infoCount = validationResult.errors?.filter(e => e.severity === 'info').length || 0;

    return (
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 150 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
            <Typography variant="h6" color="error">
              {errorCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              エラー
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: 1, minWidth: 150 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
            <Typography variant="h6" color="warning.main">
              {warningCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              警告
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: 1, minWidth: 150 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
            <Typography variant="h6" color="success.main">
              {infoCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              情報
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  };

  const renderValidationDetails = () => {
    if (!validationResult || !validationResult.errors || validationResult.errors.length === 0) {
      return (
        <Alert severity="success" icon={<SuccessIcon />}>
          <Typography variant="subtitle2">
            検証完了
          </Typography>
          すべてのルールが正常に検証されました。
        </Alert>
      );
    }

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          検証結果詳細
        </Typography>
        <List>
          {validationResult.errors.map((error, index) => (
            <ListItem key={index} divider>
              <ListItemIcon>
                {getValidationIcon(error.severity)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">
                      {error.message}
                    </Typography>
                    <Chip
                      label={error.severity}
                      size="small"
                      color={getValidationSeverityColor(error.severity)}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    {error.field && (
                      <Typography variant="caption" color="text.secondary">
                        フィールド: {error.field}
                      </Typography>
                    )}
                    {error.code && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        エラーコード: {error.code}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const renderSuggestions = () => {
    if (!validationResult || !validationResult.suggestions || validationResult.suggestions.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          改善提案
        </Typography>
        <List>
          {validationResult.suggestions.map((suggestion, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <SuccessIcon color="info" />
              </ListItemIcon>
              <ListItemText primary={suggestion} />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  if (loading) {
    return <LoadingSpinner message="検証結果を読み込み中..." />;
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            ルール検証
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ルールセットの整合性とPCA準拠性を検証します
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={validating}
          >
            更新
          </Button>
          <Button
            variant="outlined"
            startIcon={<ValidateIcon />}
            onClick={handlePCAValidation}
            disabled={validating || !ruleSet}
          >
            PCA検証
          </Button>
          <Button
            variant="contained"
            startIcon={<ValidateIcon />}
            onClick={handleValidate}
            disabled={validating || !ruleSet}
          >
            {validating ? '検証中...' : '検証実行'}
          </Button>
        </Box>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 検証中の表示 */}
      {validating && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            ルールセットを検証しています...
          </Typography>
        </Box>
      )}

      {/* ルールセット情報 */}
      {ruleSet && (
        <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
          <Typography variant="subtitle2" gutterBottom>
            ルールセット情報
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="caption" color="text.secondary">
                バージョン
              </Typography>
              <Typography variant="body2">
                {ruleSet.version || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="caption" color="text.secondary">
                総ルール数
              </Typography>
              <Typography variant="body2">
                {ruleSet.statistics?.totalRules || 0}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="caption" color="text.secondary">
                有効ルール数
              </Typography>
              <Typography variant="body2">
                {ruleSet.statistics?.activeRules || 0}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="caption" color="text.secondary">
                検証状態
              </Typography>
              <Chip
                label={ruleSet.validationStatus || 'unknown'}
                size="small"
                color={
                  ruleSet.validationStatus === 'valid' ? 'success' :
                  ruleSet.validationStatus === 'warning' ? 'warning' : 'error'
                }
              />
            </Box>
          </Box>
        </Paper>
      )}

      {/* 検証結果 */}
      {validationResult && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            検証結果
          </Typography>
          
          {renderValidationSummary()}
          
          <Divider sx={{ my: 2 }} />
          
          {renderValidationDetails()}
          
          {renderSuggestions()}
        </Paper>
      )}

      {/* 初期状態 */}
      {!validationResult && !validating && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            ルール検証を実行してください
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            「検証実行」ボタンをクリックしてルールセットの整合性を確認できます。
          </Typography>
          <Button
            variant="contained"
            startIcon={<ValidateIcon />}
            onClick={handleValidate}
            disabled={!ruleSet}
            size="large"
          >
            検証実行
          </Button>
        </Paper>
      )}
    </Box>
  );
}