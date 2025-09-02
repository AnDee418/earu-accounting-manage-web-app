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
} from '@mui/icons-material';

import { TaxAssignmentRule } from '@/types/rules';
import { useTaxAssignmentRules } from '@/features/rules/hooks/useTaxAssignmentRules';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RuleFormDialog from './common/RuleFormDialog';
import RuleTestPanel from './common/RuleTestPanel';

interface TaxAssignmentRuleManagerProps {
  onRefresh?: () => void;
}

export default function TaxAssignmentRuleManager({ 
  onRefresh 
}: TaxAssignmentRuleManagerProps) {
  const {
    rules,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    testRule,
    fetchRules,
  } = useTaxAssignmentRules();

  const [selectedRule, setSelectedRule] = useState<TaxAssignmentRule | null>(null);
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

  const handleEditRule = (rule: TaxAssignmentRule) => {
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

  const handleTestRule = (rule: TaxAssignmentRule) => {
    setSelectedRule(rule);
    setTestPanelOpen(true);
  };

  const handleSaveRule = async (ruleData: Partial<TaxAssignmentRule>) => {
    try {
      if (selectedRule) {
        await updateRule(selectedRule.id, ruleData);
      } else {
        await createRule(ruleData as Omit<TaxAssignmentRule, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setFormOpen(false);
      setSelectedRule(null);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const getTaxCodeLabel = (taxCode: string) => {
    const taxCodeMap: Record<string, string> = {
      'Q5': '仕入10%(インボイス)',
      'Q6': '仕入8%(インボイス)',
      'QD': '仕入10%(非インボイス)',
      'QE': '仕入8%(非インボイス)',
      'P0': '対象外',
      '00': '非課税',
    };
    return taxCodeMap[taxCode] || taxCode;
  };

  if (loading) {
    return <LoadingSpinner message="税区分判定ルールを読み込み中..." />;
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            税区分判定ルール
          </Typography>
          <Typography variant="body2" color="text.secondary">
            領収書の内容に基づいて自動的に税区分を判定するルールを管理します
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
              <TableCell>判定条件</TableCell>
              <TableCell>借方税区分</TableCell>
              <TableCell>貸方税区分</TableCell>
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
                    税区分判定ルールが登録されていません
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
                      {rule.conditions.taxRate && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">税率:</Typography>
                          <Chip 
                            label={`${(rule.conditions.taxRate * 100).toFixed(0)}%`} 
                            size="small" 
                            variant="outlined" 
                          />
                        </Box>
                      )}
                      {rule.conditions.invoiceCompliant !== undefined && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">インボイス:</Typography>
                          <Chip 
                            label={rule.conditions.invoiceCompliant ? '対応' : '非対応'} 
                            size="small" 
                            color={rule.conditions.invoiceCompliant ? 'success' : 'warning'}
                            variant="outlined" 
                          />
                        </Box>
                      )}
                      {rule.conditions.accountCodes && rule.conditions.accountCodes.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">対象科目:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {rule.conditions.accountCodes.slice(0, 3).join(', ')}
                            {rule.conditions.accountCodes.length > 3 && '...'}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={rule.assignment.debitTaxCode}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {getTaxCodeLabel(rule.assignment.debitTaxCode)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={rule.assignment.creditTaxCode}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {getTaxCodeLabel(rule.assignment.creditTaxCode)}
                    </Typography>
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
        ruleType="tax-assignment"
        title={selectedRule ? 'ルール編集' : 'ルール作成'}
      />

      {/* テストパネル */}
      <RuleTestPanel
        open={testPanelOpen}
        onClose={() => {
          setTestPanelOpen(false);
          setSelectedRule(null);
        }}
        rule={selectedRule}
        ruleType="tax-assignment"
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