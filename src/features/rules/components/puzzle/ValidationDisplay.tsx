'use client';

import React from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Typography,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import { ValidationResult, ValidationError, ValidationWarning } from '@/types/rules';

interface ValidationDisplayProps {
  validationResult: ValidationResult | null;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * バリデーション結果表示コンポーネント
 * 
 * Requirements: 設計書のValidation Rules
 * - エラー状態の視覚的表示
 * - 具体的なエラーメッセージ表示
 */
export default function ValidationDisplay({
  validationResult,
  showDetails = true,
  compact = false,
  className,
}: ValidationDisplayProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (!validationResult) {
    return null;
  }

  const { isValid, errors, warnings, suggestions } = validationResult;
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasSuggestions = suggestions.length > 0;

  // 何も表示するものがない場合
  if (!hasErrors && !hasWarnings && !hasSuggestions && isValid) {
    if (compact) return null;
    
    return (
      <Alert severity="success" className={className} sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon fontSize="small" />
          <Typography variant="body2">
            すべての条件が正しく設定されています
          </Typography>
        </Box>
      </Alert>
    );
  }

  // メインのアラート表示
  const severity = hasErrors ? 'error' : hasWarnings ? 'warning' : 'info';
  const title = hasErrors 
    ? `入力エラー (${errors.length}件)` 
    : hasWarnings 
      ? `警告 (${warnings.length}件)` 
      : '情報';

  return (
    <Box className={className}>
      <Alert 
        severity={severity}
        sx={{ mb: 1 }}
        action={
          showDetails && (hasErrors || hasWarnings || hasSuggestions) ? (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ color: 'inherit' }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          ) : undefined
        }
      >
        <AlertTitle>{title}</AlertTitle>
        
        {/* コンパクト表示の場合は最初のエラーのみ */}
        {compact && hasErrors && (
          <Typography variant="body2">
            {errors[0].message}
            {errors.length > 1 && ` (他${errors.length - 1}件)`}
          </Typography>
        )}
        
        {/* 通常表示の場合は概要 */}
        {!compact && (
          <Typography variant="body2">
            {hasErrors && `${errors.length}件のエラーがあります。`}
            {hasWarnings && `${warnings.length}件の警告があります。`}
            {hasSuggestions && `${suggestions.length}件の改善提案があります。`}
            {showDetails && ' 詳細を確認してください。'}
          </Typography>
        )}
      </Alert>

      {/* 詳細表示 */}
      {showDetails && !compact && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 1 }}>
            {/* エラー一覧 */}
            {hasErrors && (
              <ValidationSection
                title="エラー"
                items={errors}
                severity="error"
                icon={<ErrorIcon />}
              />
            )}

            {/* 警告一覧 */}
            {hasWarnings && (
              <ValidationSection
                title="警告"
                items={warnings}
                severity="warning"
                icon={<WarningIcon />}
              />
            )}

            {/* 提案一覧 */}
            {hasSuggestions && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="info" fontSize="small" />
                  改善提案
                </Typography>
                <List dense>
                  {suggestions.map((suggestion, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <InfoIcon color="info" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={suggestion}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

/**
 * バリデーション項目セクション
 */
interface ValidationSectionProps {
  title: string;
  items: (ValidationError | ValidationWarning)[];
  severity: 'error' | 'warning';
  icon: React.ReactNode;
}

function ValidationSection({ title, items, severity, icon }: ValidationSectionProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        {title} ({items.length}件)
      </Typography>
      <List dense>
        {items.map((item, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              {severity === 'error' ? (
                <ErrorIcon color="error" fontSize="small" />
              ) : (
                <WarningIcon color="warning" fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2">
                    {item.message}
                  </Typography>
                  {item.context?.conditionType && (
                    <Chip
                      label={item.context.conditionLabel || item.context.conditionType}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                  )}
                </Box>
              }
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

/**
 * 条件ブロック用のインラインバリデーション表示
 */
interface InlineValidationDisplayProps {
  validationResult: ValidationResult | null;
  conditionId?: string;
  compact?: boolean;
}

export function InlineValidationDisplay({
  validationResult,
  compact = true,
}: InlineValidationDisplayProps) {
  if (!validationResult) return null;

  const { errors, warnings } = validationResult;
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  if (!hasErrors && !hasWarnings) return null;

  // 最初のエラーまたは警告を表示
  const firstIssue = hasErrors ? errors[0] : warnings[0];
  const severity = hasErrors ? 'error' : 'warning';

  return (
    <Alert 
      severity={severity} 
      sx={{ 
        mt: 1,
        fontSize: '0.75rem',
        py: 0.5,
        '& .MuiAlert-message': {
          fontSize: '0.75rem',
        }
      }}
    >
      <Typography variant="caption">
        {firstIssue.message}
        {(errors.length + warnings.length > 1) && (
          <span style={{ opacity: 0.7 }}>
            {` (他${errors.length + warnings.length - 1}件)`}
          </span>
        )}
      </Typography>
    </Alert>
  );
}

/**
 * バリデーション状態インジケーター
 */
interface ValidationIndicatorProps {
  validationResult: ValidationResult | null;
  size?: 'small' | 'medium';
}

export function ValidationIndicator({ validationResult, size = 'small' }: ValidationIndicatorProps) {
  if (!validationResult) return null;

  const { isValid, errors, warnings } = validationResult;
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  if (isValid && !hasWarnings) {
    return (
      <Tooltip title="バリデーション成功">
        <CheckCircleIcon 
          color="success" 
          fontSize={size} 
          sx={{ opacity: 0.7 }}
        />
      </Tooltip>
    );
  }

  if (hasErrors) {
    return (
      <Tooltip title={`${errors.length}件のエラー`}>
        <ErrorIcon 
          color="error" 
          fontSize={size}
        />
      </Tooltip>
    );
  }

  if (hasWarnings) {
    return (
      <Tooltip title={`${warnings.length}件の警告`}>
        <WarningIcon 
          color="warning" 
          fontSize={size}
        />
      </Tooltip>
    );
  }

  return null;
}

