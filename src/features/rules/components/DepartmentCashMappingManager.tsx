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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';

import { DepartmentCashMapping } from '@/types/rules';
import { useDepartmentCashMappings } from '@/features/rules/hooks/useDepartmentCashMappings';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RuleFormDialog from './common/RuleFormDialog';

interface DepartmentCashMappingManagerProps {
  onRefresh?: () => void;
}

export default function DepartmentCashMappingManager({ 
  onRefresh 
}: DepartmentCashMappingManagerProps) {
  const {
    mappings,
    loading,
    error,
    createMapping,
    updateMapping,
    deleteMapping,
    syncWithMasterData,
    fetchMappings,
  } = useDepartmentCashMappings();

  const [selectedMapping, setSelectedMapping] = useState<DepartmentCashMapping | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const handleCreateMapping = () => {
    setSelectedMapping(null);
    setFormOpen(true);
  };

  const handleEditMapping = (mapping: DepartmentCashMapping) => {
    setSelectedMapping(mapping);
    setFormOpen(true);
  };

  const handleDeleteMapping = (mappingId: string) => {
    setMappingToDelete(mappingId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (mappingToDelete) {
      await deleteMapping(mappingToDelete);
      setDeleteConfirmOpen(false);
      setMappingToDelete(null);
      onRefresh?.();
    }
  };

  const handleSyncWithMasterData = async () => {
    setSyncing(true);
    try {
      await syncWithMasterData();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to sync with master data:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveMapping = async (mappingData: Partial<DepartmentCashMapping>) => {
    try {
      if (selectedMapping) {
        await updateMapping(selectedMapping.id, mappingData);
      } else {
        await createMapping(mappingData as Omit<DepartmentCashMapping, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setFormOpen(false);
      setSelectedMapping(null);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to save mapping:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="部門・現金マッピングを読み込み中..." />;
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            部門・現金補助科目マッピング
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ユーザーの部門情報に基づいて現金補助科目を自動設定するマッピングを管理します
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={handleSyncWithMasterData}
            disabled={syncing}
            sx={{ minWidth: 140 }}
          >
            {syncing ? '同期中...' : 'マスタ同期'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateMapping}
            sx={{ minWidth: 140 }}
          >
            新規作成
          </Button>
        </Box>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* マッピング一覧テーブル */}
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>部門コード</TableCell>
              <TableCell>部門名</TableCell>
              <TableCell>現金補助科目コード</TableCell>
              <TableCell>現金補助科目名</TableCell>
              <TableCell>状態</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    部門・現金マッピングが登録されていません
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    「マスタ同期」ボタンでマスタデータから自動作成できます
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              mappings.map((mapping) => (
                <TableRow key={mapping.id} hover>
                  <TableCell>
                    <Chip 
                      label={mapping.departmentCode} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {mapping.departmentName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={mapping.cashAuxiliaryCode} 
                      size="small" 
                      color="secondary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {mapping.cashAuxiliaryName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={mapping.isActive ? '有効' : '無効'}
                      size="small"
                      color={mapping.isActive ? 'success' : 'default'}
                      variant={mapping.isActive ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="編集">
                        <IconButton
                          size="small"
                          onClick={() => handleEditMapping(mapping)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="削除">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteMapping(mapping.id)}
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

      {/* マッピング作成・編集ダイアログ */}
      <RuleFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedMapping(null);
        }}
        onSave={handleSaveMapping}
        rule={selectedMapping}
        ruleType="department-mapping"
        title={selectedMapping ? 'マッピング編集' : 'マッピング作成'}
      />

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="マッピング削除の確認"
        message="このマッピングを削除してもよろしいですか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
      />
    </Box>
  );
}