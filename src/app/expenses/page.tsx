'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { jaJP } from '@mui/x-data-grid/locales';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { ExpenseSearch, ExpenseStatus, PcaStatus } from '@/types';

export default function ExpensesPage() {
  const router = useRouter();
  const { companyId, userRole } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | ''>('');
  const [pcaStatusFilter, setPcaStatusFilter] = useState<PcaStatus | ''>('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchExpenses = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    setError('');

    try {
      // expense_searchコレクションから取得
      const expenseSearchRef = collection(db, `companies/${companyId}/expense_search`);
      let q = query(expenseSearchRef);

      // フィルタ条件を追加
      if (statusFilter) {
        q = query(q, where('status', '==', statusFilter));
      }
      if (pcaStatusFilter) {
        q = query(q, where('pcaStatus', '==', pcaStatusFilter));
      }
      if (departmentFilter) {
        q = query(q, where('departmentId', '==', departmentFilter));
      }

      // 日付範囲フィルタ
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        q = query(q, where('paidAt', '>=', Timestamp.fromDate(fromDate)));
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        q = query(q, where('paidAt', '<=', Timestamp.fromDate(toDate)));
      }

      // ソートと制限
      q = query(q, orderBy('paidAt', 'desc'), limit(100));

      const querySnapshot = await getDocs(q);
      const expensesList: ExpenseSearch[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expensesList.push({
          id: doc.id,
          ...data,
          paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : data.paidAt,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as ExpenseSearch);
      });

      setExpenses(expensesList);
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [companyId, statusFilter, pcaStatusFilter, departmentFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as ExpenseStatus | '');
  };

  const handlePcaStatusFilterChange = (event: SelectChangeEvent) => {
    setPcaStatusFilter(event.target.value as PcaStatus | '');
  };

  const getStatusChip = (status: ExpenseStatus) => {
    const statusConfig = {
      draft: { label: '下書き', color: 'default' as const },
      submitted: { label: '提出済み', color: 'info' as const },
      approved: { label: '承認済み', color: 'success' as const },
      rejected: { label: '差戻し', color: 'error' as const },
      exported: { label: 'エクスポート済み', color: 'primary' as const },
    };
    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getPcaStatusChip = (status: PcaStatus) => {
    const statusConfig = {
      pending: { label: '未処理', color: 'warning' as const },
      exported: { label: 'PCA連携済み', color: 'success' as const },
      error: { label: 'エラー', color: 'error' as const },
    };
    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const columns: GridColDef[] = [
    {
      field: 'paidAt',
      headerName: '支払日',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        return format(date, 'yyyy/MM/dd', { locale: ja });
      },
    },
    {
      field: 'merchant',
      headerName: '支払先',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'total',
      headerName: '金額',
      width: 120,
      align: 'right',
      valueFormatter: (params) => {
        if (!params.value) return '¥0';
        return `¥${params.value.toLocaleString()}`;
      },
    },
    {
      field: 'departmentId',
      headerName: '部門',
      width: 100,
    },
    {
      field: 'status',
      headerName: 'ステータス',
      width: 140,
      renderCell: (params: GridRenderCellParams) => getStatusChip(params.value as ExpenseStatus),
    },
    {
      field: 'pcaStatus',
      headerName: 'PCA状態',
      width: 140,
      renderCell: (params: GridRenderCellParams) => getPcaStatusChip(params.value as PcaStatus),
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => router.push(`/expenses/${params.row.id}`)}
        >
          詳細
        </Button>
      ),
    },
  ];

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          受信ボックス
        </Typography>

        {/* フィルタセクション */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>ステータス</InputLabel>
              <Select value={statusFilter} onChange={handleStatusFilterChange} label="ステータス">
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="submitted">提出済み</MenuItem>
                <MenuItem value="approved">承認済み</MenuItem>
                <MenuItem value="rejected">差戻し</MenuItem>
                <MenuItem value="exported">エクスポート済み</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>PCA状態</InputLabel>
              <Select
                value={pcaStatusFilter}
                onChange={handlePcaStatusFilterChange}
                label="PCA状態"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="pending">未処理</MenuItem>
                <MenuItem value="exported">連携済み</MenuItem>
                <MenuItem value="error">エラー</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="部門"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              sx={{ width: 120 }}
            />

            <TextField
              size="small"
              label="開始日"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 150 }}
            />

            <TextField
              size="small"
              label="終了日"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 150 }}
            />

            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={fetchExpenses}
              disabled={loading}
            >
              検索
            </Button>

            <IconButton onClick={fetchExpenses} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* データグリッド */}
        <Paper sx={{ height: 600 }}>
          <DataGrid
            rows={expenses}
            columns={columns}
            loading={loading}
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            localeText={jaJP.components.MuiDataGrid.defaultProps.localeText}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell:hover': {
                cursor: 'pointer',
              },
            }}
          />
        </Paper>
      </Box>
    </MainLayout>
  );
}