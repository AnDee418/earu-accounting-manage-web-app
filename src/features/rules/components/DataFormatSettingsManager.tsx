'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  RestoreFromTrash as ResetIcon,
} from '@mui/icons-material';

import { DataFormatSettings } from '@/types/rules';
import { useDataFormatSettings } from '@/features/rules/hooks/useDataFormatSettings';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface DataFormatSettingsManagerProps {
  onRefresh?: () => void;
}

export default function DataFormatSettingsManager({ 
  onRefresh 
}: DataFormatSettingsManagerProps) {
  const {
    settings,
    loading,
    error,
    updateSettings,
    resetToDefaults,
    fetchSettings,
  } = useDataFormatSettings();

  const [formData, setFormData] = useState<Partial<DataFormatSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  }, [settings]);

  const handleFieldChange = (field: keyof DataFormatSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleFixedValueChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      fixedValues: {
        ...prev.fixedValues,
        [field]: value,
      } as DataFormatSettings['fixedValues'],
    }));
    setHasChanges(true);
  };

  const handleValidationChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        [field]: value,
      } as DataFormatSettings['validation'],
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(formData);
      setHasChanges(false);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefaults();
      setResetConfirmOpen(false);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  const handleRefresh = () => {
    fetchSettings();
    setHasChanges(false);
  };

  if (loading) {
    return <LoadingSpinner message="データフォーマット設定を読み込み中..." />;
  }

  if (!formData.fixedValues || !formData.validation) {
    return null;
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            データフォーマット設定
          </Typography>
          <Typography variant="body2" color="text.secondary">
            PCA会計ソフトウェアとの連携に必要なデータフォーマットを設定します
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={saving}
          >
            更新
          </Button>
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={() => setResetConfirmOpen(true)}
            disabled={saving}
            color="warning"
          >
            初期化
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </Box>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 変更通知 */}
      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          設定に変更があります。「保存」ボタンをクリックして変更を保存してください。
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 基本フォーマット設定 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            基本フォーマット設定
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
                label="日付フォーマット"
                value={formData.dateFormat || ''}
                onChange={(e) => handleFieldChange('dateFormat', e.target.value)}
                helperText="PCA形式: YYYYMMDD"
                placeholder="YYYYMMDD"
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
                label="摘要フォーマットテンプレート"
                value={formData.descriptionTemplate || ''}
                onChange={(e) => handleFieldChange('descriptionTemplate', e.target.value)}
                helperText="例: [{category} {merchant}]"
                placeholder="[{category} {merchant}]"
              />
            </Box>
          </Box>
        </Paper>

        {/* 固定値設定 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            固定値設定
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                fullWidth
                label="入力プログラム区分"
                value={formData.fixedValues?.programClassification || ''}
                onChange={(e) => handleFixedValueChange('programClassification', e.target.value)}
                helperText="PCA固定値: 2"
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <FormControl fullWidth>
                <InputLabel>税額処理</InputLabel>
                <Select
                  value={formData.fixedValues?.taxAmountHandling || 'blank'}
                  onChange={(e) => handleFixedValueChange('taxAmountHandling', e.target.value)}
                  label="税額処理"
                >
                  <MenuItem value="blank">空欄（内税計算）</MenuItem>
                  <MenuItem value="calculated">計算値</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <FormControl fullWidth>
                <InputLabel>金額タイプ</InputLabel>
                <Select
                  value={formData.fixedValues?.amountType || 'tax_inclusive'}
                  onChange={(e) => handleFixedValueChange('amountType', e.target.value)}
                  label="金額タイプ"
                >
                  <MenuItem value="tax_inclusive">税込金額</MenuItem>
                  <MenuItem value="tax_exclusive">税抜金額</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>

        {/* 検証ルール設定 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            検証ルール設定
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
                type="number"
                label="金額最大桁数"
                value={formData.validation?.maxAmountDigits || 10}
                onChange={(e) => handleValidationChange('maxAmountDigits', parseInt(e.target.value))}
                helperText="金額フィールドの最大桁数"
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
                label="許可通貨"
                value={formData.validation?.allowedCurrencies?.join(', ') || 'JPY'}
                onChange={(e) => handleValidationChange('allowedCurrencies', e.target.value.split(',').map(s => s.trim()))}
                helperText="カンマ区切りで入力（例: JPY, USD）"
              />
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              必須フィールド
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {formData.validation?.requiredFields?.map((field) => (
                <Chip
                  key={field}
                  label={field}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )) || []}
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              PCA出力時に必須となるフィールドです
            </Typography>
          </Box>
        </Paper>

        {/* 設定状態 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            設定状態
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive || false}
                    onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                  />
                }
                label="設定を有効にする"
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <Typography variant="body2" color="text.secondary">
                最終更新: {formData.updatedAt ? new Date(formData.updatedAt).toLocaleString('ja-JP') : '未設定'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                作成者: {formData.createdBy || '未設定'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* 初期化確認ダイアログ */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="設定初期化の確認"
        message="データフォーマット設定を初期値にリセットしてもよろしいですか？現在の設定は失われます。"
        confirmText="初期化"
        cancelText="キャンセル"
      />
    </Box>
  );
}