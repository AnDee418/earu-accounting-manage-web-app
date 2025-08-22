import React from 'react';
import { Chip, Typography } from '@mui/material';

import MasterDataTable from '@/components/tables/MasterDataTable';
import { Tax } from '@/types/settings';

interface TaxMasterTableProps {
  taxes: Tax[];
  loading?: boolean;
  onRefresh?: () => void;
  onImport?: () => void;
}

export default function TaxMasterTable({ 
  taxes, 
  loading, 
  onRefresh, 
  onImport 
}: TaxMasterTableProps) {
  const columns = [
    {
      id: 'pcaTaxCode',
      label: 'コード',
      minWidth: 100,
      align: 'center' as const,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'shortName',
      label: '略称',
      minWidth: 120,
      format: (value: string) => (
        <Typography variant="body2" fontWeight={500}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'description',
      label: '説明',
      minWidth: 300,
      format: (value: string) => (
        <Typography variant="body2" color="text.secondary">
          {value}
        </Typography>
      ),
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
  ];

  return (
    <MasterDataTable
      title="税区分マスタ"
      data={taxes}
      columns={columns}
      loading={loading}
      onRefresh={onRefresh}
      onImport={onImport}
      emptyMessage="税区分データがありません。CSVファイルからインポートしてください。"
    />
  );
}
