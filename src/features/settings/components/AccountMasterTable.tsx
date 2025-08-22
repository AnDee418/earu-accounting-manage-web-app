import React from 'react';
import { Chip, Typography, Box } from '@mui/material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import MasterDataTable from '@/components/tables/MasterDataTable';
import { Account } from '@/types/settings';

interface AccountMasterTableProps {
  accounts: Account[];
  loading?: boolean;
  onRefresh?: () => void;
  onImport?: () => void;
}

export default function AccountMasterTable({ 
  accounts, 
  loading, 
  onRefresh, 
  onImport 
}: AccountMasterTableProps) {
  const columns = [
    {
      id: 'pcaCode',
      label: '科目',
      minWidth: 80,
      align: 'center' as const,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600} color="primary.main">
          {value}
        </Typography>
      ),
    },
    {
      id: 'name',
      label: '科目名',
      minWidth: 180,
      format: (value: string) => (
        <Typography variant="body2" fontWeight={600}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'kanaIndex',
      label: 'カナ',
      minWidth: 100,
      format: (value: string) => value || '-',
    },
    {
      id: 'balanceType',
      label: '貸借',
      minWidth: 100,
      align: 'center' as const,
      format: (value: number) => {
        if (!value) return '-';
        
        const label = value === 1 ? '資産費用' : '負債収益';
        const color = value === 1 ? 'primary' : 'secondary';
        
        return (
          <Chip
            label={label}
            size="small"
            color={color}
            variant="outlined"
          />
        );
      },
    },
    {
      id: 'debitTaxCode',
      label: '借方税',
      minWidth: 80,
      align: 'center' as const,
      format: (value: string) => value ? (
        <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
          {value}
        </Typography>
      ) : '-',
    },
    {
      id: 'creditTaxCode',
      label: '貸方税',
      minWidth: 80,
      align: 'center' as const,
      format: (value: string) => value ? (
        <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
          {value}
        </Typography>
      ) : '-',
    },
    {
      id: 'autoTaxCalc',
      label: '自動税',
      minWidth: 80,
      align: 'center' as const,
      format: (value: number) => {
        if (value === undefined) return '-';
        
        const enabled = value === 9;
        return (
          <Chip
            label={enabled ? '有効' : '無効'}
            size="small"
            color={enabled ? 'success' : 'default'}
            variant={enabled ? 'filled' : 'outlined'}
          />
        );
      },
    },
    {
      id: 'businessType',
      label: '課税業種',
      minWidth: 100,
      align: 'center' as const,
      format: (value: number) => {
        if (!value) return '-';
        
        const businessTypes: { [key: number]: { label: string; color: string } } = {
          1: { label: '第1種', color: '#1976d2' },
          2: { label: '第2種', color: '#388e3c' },
          3: { label: '第3種', color: '#f57c00' },
          4: { label: '第4種', color: '#7b1fa2' },
          5: { label: '第5種', color: '#d32f2f' },
          6: { label: '第6種', color: '#0288d1' },
        };
        
        const businessType = businessTypes[value];
        if (!businessType) return value.toString();
        
        return (
          <Chip
            label={businessType.label}
            size="small"
            sx={{
              backgroundColor: businessType.color,
              color: 'white',
              fontSize: '0.75rem',
            }}
          />
        );
      },
    },
    {
      id: 'isActive',
      label: '状態',
      minWidth: 100,
      align: 'center' as const,
      format: (value: boolean) => (
        <Chip
          label={value ? '有効' : '無効'}
          size="small"
          color={value ? 'success' : 'error'}
          variant={value ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      id: 'subAccounts',
      label: '補助',
      minWidth: 70,
      align: 'center' as const,
      format: (value: any[]) => {
        const count = Array.isArray(value) ? value.length : 0;
        return count > 0 ? (
          <Chip
            label={count.toString()}
            size="small"
            color="info"
            variant="outlined"
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            0
          </Typography>
        );
      },
    },
  ];

  return (
    <MasterDataTable
      title="勘定科目マスタ"
      data={accounts}
      columns={columns}
      loading={loading}
      onRefresh={onRefresh}
      onImport={onImport}
      emptyMessage="勘定科目データがありません。CSVファイルからインポートしてください。"
    />
  );
}
