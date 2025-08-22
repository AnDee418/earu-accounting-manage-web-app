import React from 'react';
import { Chip, Typography } from '@mui/material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import MasterDataTable from '@/components/tables/MasterDataTable';
import { Department } from '@/types/settings';

interface DepartmentMasterTableProps {
  departments: Department[];
  loading?: boolean;
  onRefresh?: () => void;
  onImport?: () => void;
}

export default function DepartmentMasterTable({ 
  departments, 
  loading, 
  onRefresh, 
  onImport 
}: DepartmentMasterTableProps) {
  const columns = [
    {
      id: 'pcaDeptCode',
      label: '部門',
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
      label: '部門名',
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
      id: 'parentCode',
      label: '親部門',
      minWidth: 80,
      align: 'center' as const,
      format: (value: string) => value ? (
        <Typography variant="body2" fontFamily="monospace" color="text.secondary">
          {value}
        </Typography>
      ) : '-',
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
      id: 'effectiveFrom',
      label: '開始日',
      minWidth: 100,
      align: 'center' as const,
      format: (value: Date | string) => {
        if (!value) return '-';
        const date = typeof value === 'string' ? new Date(value) : value;
        return (
          <Typography variant="body2" color="text.secondary">
            {format(date, 'yyyy/MM/dd', { locale: ja })}
          </Typography>
        );
      },
    },
    {
      id: 'effectiveTo',
      label: '終了日',
      minWidth: 100,
      align: 'center' as const,
      format: (value: Date | string) => {
        if (!value) return (
          <Chip
            label="無期限"
            size="small"
            color="success"
            variant="outlined"
          />
        );
        const date = typeof value === 'string' ? new Date(value) : value;
        return (
          <Typography variant="body2" color="error.main">
            {format(date, 'yyyy/MM/dd', { locale: ja })}
          </Typography>
        );
      },
    },
  ];

  return (
    <MasterDataTable
      title="部門マスタ"
      data={departments}
      columns={columns}
      loading={loading}
      onRefresh={onRefresh}
      onImport={onImport}
      emptyMessage="部門データがありません。CSVファイルからインポートしてください。"
    />
  );
}
