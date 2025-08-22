import React from 'react';
import { Chip, Typography, Avatar, Box } from '@mui/material';
import {
  Category as CategoryIcon,
  Receipt as ReceiptIcon,
  DirectionsCar as CarIcon,
  LocalDining as DiningIcon,
  Business as BusinessIcon,
  Flight as FlightIcon,
} from '@mui/icons-material';

import MasterDataTable from '@/components/tables/MasterDataTable';
import { Category } from '@/types/settings';

interface CategoryMasterTableProps {
  categories: Category[];
  loading?: boolean;
  onRefresh?: () => void;
  onImport?: () => void;
}

export default function CategoryMasterTable({ 
  categories, 
  loading, 
  onRefresh, 
  onImport 
}: CategoryMasterTableProps) {
  const getIconByName = (iconName?: string) => {
    switch (iconName) {
      case 'receipt': return <ReceiptIcon />;
      case 'car': return <CarIcon />;
      case 'dining': return <DiningIcon />;
      case 'business': return <BusinessIcon />;
      case 'flight': return <FlightIcon />;
      default: return <CategoryIcon />;
    }
  };

  const columns = [
    {
      id: 'icon',
      label: 'アイコン',
      minWidth: 80,
      align: 'center' as const,
      format: (value: string, row: Category) => (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: row.color || 'primary.main',
            margin: 'auto',
          }}
        >
          {getIconByName(row.icon)}
        </Avatar>
      ),
    },
    {
      id: 'name',
      label: 'カテゴリ名',
      minWidth: 180,
      format: (value: string, row: Category) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" fontWeight={600}>
            {value}
          </Typography>
          {row.color && (
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: row.color,
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
          )}
        </Box>
      ),
    },
    {
      id: 'defaultDebitAccountPcaCode',
      label: '借方科目',
      minWidth: 100,
      align: 'center' as const,
      format: (value: string) => value ? (
        <Typography variant="body2" fontFamily="monospace" color="primary.main">
          {value}
        </Typography>
      ) : '-',
    },
    {
      id: 'defaultCreditAccountPcaCode',
      label: '貸方科目',
      minWidth: 100,
      align: 'center' as const,
      format: (value: string) => value ? (
        <Typography variant="body2" fontFamily="monospace" color="secondary.main">
          {value}
        </Typography>
      ) : '-',
    },
    {
      id: 'taxRule',
      label: '税規則',
      minWidth: 100,
      format: (value: string) => value || '-',
    },
    {
      id: 'hints',
      label: 'ヒント',
      minWidth: 200,
      format: (value: string[]) => {
        if (!Array.isArray(value) || value.length === 0) return '-';
        
        return (
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {value.slice(0, 2).map((hint, index) => (
              <Chip
                key={index}
                label={hint}
                size="small"
                variant="outlined"
                color="info"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
            {value.length > 2 && (
              <Chip
                label={`+${value.length - 2}個`}
                size="small"
                variant="filled"
                color="default"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        );
      },
    },
    {
      id: 'sortOrder',
      label: '順序',
      minWidth: 80,
      align: 'center' as const,
      format: (value: number) => (
        <Typography variant="body2" fontFamily="monospace">
          {value}
        </Typography>
      ),
    },
    {
      id: 'id',
      label: 'ID',
      minWidth: 200,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace" color="text.secondary" fontSize="0.75rem">
          {value}
        </Typography>
      ),
    },
  ];

  return (
    <MasterDataTable
      title="経費カテゴリ"
      data={categories}
      columns={columns}
      loading={loading}
      onRefresh={onRefresh}
      onImport={onImport}
      emptyMessage="経費カテゴリがありません。新しいカテゴリを作成してください。"
    />
  );
}
