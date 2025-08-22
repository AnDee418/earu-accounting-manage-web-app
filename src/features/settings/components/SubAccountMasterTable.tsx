import React from 'react';
import { Chip, Typography } from '@mui/material';

import MasterDataTable from '@/components/tables/MasterDataTable';
import { SubAccount } from '@/types/settings';

interface SubAccountMasterTableProps {
  subAccounts: SubAccount[];
  loading?: boolean;
  onRefresh?: () => void;
  onImport?: () => void;
}

export default function SubAccountMasterTable({
  subAccounts,
  loading,
  onRefresh,
  onImport,
}: SubAccountMasterTableProps) {
  const columns = [
    {
      id: 'accountCode',
      label: '勘定科目コード',
      minWidth: 120,
      align: 'center' as const,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'accountName',
      label: '勘定科目名',
      minWidth: 120,
      format: (value: string) => (
        <Typography variant="body2" fontWeight={500}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'pcaSubCode',
      label: '補助科目コード',
      minWidth: 120,
      align: 'center' as const,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600} color="primary.main">
          {value}
        </Typography>
      ),
    },
    {
      id: 'name',
      label: '補助科目名',
      minWidth: 150,
      format: (value: string) => (
        <Typography variant="body2" fontWeight={600}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'kanaIndex',
      label: 'ｶﾅ索引',
      minWidth: 100,
      format: (value: string) => (
        <Typography variant="body2" color="text.secondary">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'fullName',
      label: '補助科目正式名',
      minWidth: 180,
      format: (value: string) => (
        <Typography variant="body2">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'fullNameKana',
      label: '正式名ﾌﾘｶﾞﾅ',
      minWidth: 150,
      format: (value: string) => (
        <Typography variant="body2" color="text.secondary">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'debitTaxCode',
      label: '借方税区分コード',
      minWidth: 130,
      align: 'center' as const,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'debitTaxName',
      label: '借方税区分名',
      minWidth: 120,
      format: (value: string) => (
        <Typography variant="body2">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'creditTaxCode',
      label: '貸方税区分コード',
      minWidth: 130,
      align: 'center' as const,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'creditTaxName',
      label: '貸方税区分名',
      minWidth: 120,
      format: (value: string) => (
        <Typography variant="body2">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'autoTaxCalc',
      label: '消費税自動計算',
      minWidth: 120,
      align: 'center' as const,
      format: (value: number) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'taxRounding',
      label: '消費税端数処理',
      minWidth: 130,
      align: 'center' as const,
      format: (value: number) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'postalCode',
      label: '郵便番号',
      minWidth: 100,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'address1',
      label: '住所１',
      minWidth: 200,
      format: (value: string) => (
        <Typography variant="body2">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'address2',
      label: '住所２',
      minWidth: 200,
      format: (value: string) => (
        <Typography variant="body2">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'tel',
      label: 'TEL',
      minWidth: 120,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'fax',
      label: 'FAX',
      minWidth: 120,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'bankInfo',
      label: '振込先',
      minWidth: 80,
      align: 'center' as const,
      format: (value: string | number) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'closingDay',
      label: '締日',
      minWidth: 80,
      align: 'center' as const,
      format: (value: number) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'paymentDay',
      label: '支払日',
      minWidth: 80,
      align: 'center' as const,
      format: (value: number) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'corporateNumber',
      label: '法人番号',
      minWidth: 120,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'businessType',
      label: '事業者区分',
      minWidth: 100,
      align: 'center' as const,
      format: (value: number) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'invoiceRegistrationNumber',
      label: '適格請求書発行事業者登録番号',
      minWidth: 200,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'digitalInvoiceReceive',
      label: 'デジタルインボイス受信',
      minWidth: 150,
      align: 'center' as const,
      format: (value: number) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'isActive',
      label: '状態',
      minWidth: 80,
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
      title="補助科目マスタ"
      data={subAccounts}
      columns={columns}
      loading={loading}
      onRefresh={onRefresh}
      onImport={onImport}
      emptyMessage="補助科目データがありません。CSVファイルからインポートしてください。"
    />
  );
}