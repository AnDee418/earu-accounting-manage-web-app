'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';

import { AccountAssignmentRule } from '@/types/rules';
import { useAccountAssignmentRules } from '@/features/rules/hooks/useAccountAssignmentRules';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RuleFormDialog from './common/RuleFormDialog';
import RuleTestPanel from './common/RuleTestPanel';

interface AccountAssignmentRuleManagerProps {
  onRefresh?: () => void;
}

export default function AccountAssignmentRuleManager({ 
  onRefresh 
}: AccountAssignmentRuleManagerProps) {
  const {
    rules,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    testRule,
    fetchRules,
  } = useAccountAssignmentRules();

  const [selectedRule, setSelectedRule] = useState<AccountAssignmentRule | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testPanelOpen, setTestPanelOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreateRule = () => {
    setSelectedRule(null);
    setFormOpen(true);
  };

  const handleEditRule = (rule: AccountAssignmentRule) => {
    setSelectedRule(rule);
    setFormOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (ruleToDelete) {
      await deleteRule(ruleToDelete);
      setDeleteConfirmOpen(false);
      setRuleToDelete(null);
      onRefresh?.();
    }
  };

  const handleTestRule = (rule: AccountAssignmentRule) => {
    setSelectedRule(rule);
    setTestPanelOpen(true);
  };

  const handleSaveRule = async (ruleData: Partial<AccountAssignmentRule>) => {
    try {
      if (selectedRule) {
        await updateRule(selectedRule.id, ruleData);
      } else {
        await createRule(ruleData as Omit<AccountAssignmentRule, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setFormOpen(false);
      setSelectedRule(null);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="勘定科目割り当てルールを読み込み中..." />;
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            勘定科目割り当てルール
          </Typography>
          <Typography variant="body2" color="text.secondary">
            領収書の内容に基づいて自動的に勘定科目を割り当てるルールを管理します
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateRule}
          sx={{ minWidth: 140 }}
        >
          新規作成
        </Button>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ルール一覧テーブル */}
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ルール名</TableCell>
              <TableCell>条件</TableCell>
              <TableCell>借方科目</TableCell>
              <TableCell>貸方科目</TableCell>
              <TableCell>優先度</TableCell>
              <TableCell>状態</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    勘定科目割り当てルールが登録されていません
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{rule.name}</Typography>
                    {rule.description && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {rule.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      {rule.conditions.expenseTypePatterns && rule.conditions.expenseTypePatterns.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">経費種別:</Typography>
                          <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                            {rule.conditions.expenseTypePatterns.slice(0, 2).map((expenseType) => (
                              <Chip key={expenseType} label={expenseType} size="small" variant="outlined" />
                            ))}
                            {rule.conditions.expenseTypePatterns.length > 2 && (
                              <Chip label={`+${rule.conditions.expenseTypePatterns.length - 2}`} size="small" />
                            )}
                          </Box>
                        </Box>
                      )}
                      {rule.conditions.merchantPatterns && rule.conditions.merchantPatterns.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">取引先パターン:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {rule.conditions.merchantPatterns.slice(0, 2).join(', ')}
                            {rule.conditions.merchantPatterns.length > 2 && '...'}
                          </Typography>
                        </Box>
                      )}
                      {rule.conditions.keywords && rule.conditions.keywords.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">キーワード:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {rule.conditions.keywords.slice(0, 3).join(', ')}
                            {rule.conditions.keywords.length > 3 && '...'}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {rule.assignment.debitAccountCode}
                    </Typography>
                    {rule.assignment.debitSubAccountCode && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        補助: {rule.assignment.debitSubAccountCode}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {rule.assignment.creditAccountCode}
                    </Typography>
                    {rule.assignment.creditSubAccountCode && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        補助: {rule.assignment.creditSubAccountCode}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={rule.priority} 
                      size="small" 
                      color={rule.priority <= 5 ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.isActive ? '有効' : '無効'}
                      size="small"
                      color={rule.isActive ? 'success' : 'default'}
                      variant={rule.isActive ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="テスト実行">
                        <IconButton
                          size="small"
                          onClick={() => handleTestRule(rule)}
                          color="info"
                        >
                          <TestIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="編集">
                        <IconButton
                          size="small"
                          onClick={() => handleEditRule(rule)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="削除">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRule(rule.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ルール作成・編集ダイアログ */}
      <RuleFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedRule(null);
        }}
        onSave={handleSaveRule}
        rule={selectedRule}
        ruleType="account-assignment"
        title={selectedRule ? 'ルール編集' : 'ルール作成'}
        usePuzzleUI={true}
      />

      {/* テストパネル */}
      <RuleTestPanel
        open={testPanelOpen}
        onClose={() => {
          setTestPanelOpen(false);
          setSelectedRule(null);
        }}
        rule={selectedRule}
        ruleType="account-assignment"
        onTest={testRule}
      />

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="ルール削除の確認"
        message="このルールを削除してもよろしいですか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
      />
    </Box>
  );
}