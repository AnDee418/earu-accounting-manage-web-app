import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row?: any) => React.ReactNode;
}

interface MasterDataTableProps<T> {
  title: string;
  data: T[];
  columns: Column[];
  loading?: boolean;
  onRefresh?: () => void;
  onImport?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  emptyMessage?: string;
}

export default function MasterDataTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  loading = false,
  onRefresh,
  onImport,
  onEdit,
  onDelete,
  emptyMessage = 'データがありません',
}: MasterDataTableProps<T>) {
  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Box display="flex" gap={1}>
          {onImport && (
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={onImport}
              size="small"
            >
              インポート
            </Button>
          )}
          {onRefresh && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={loading}
              size="small"
            >
              更新
            </Button>
          )}
        </Box>
      </Box>

      {/* テーブル */}
      <TableContainer 
        component={Paper}
        sx={{
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ 
                    minWidth: column.minWidth,
                    whiteSpace: 'nowrap',
                    padding: '16px 12px',
                  }}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    backgroundColor: '#2e3440', // ダークブルーグレー
                    color: '#ffffff !important', // 純白（強制適用）
                    borderBottom: '2px solid #4c566a',
                    letterSpacing: '0.025em',
                    '& *': {
                      color: '#ffffff !important', // 子要素も白色に強制
                    },
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              {(onEdit || onDelete) && (
                <TableCell
                  align="center"
                  style={{ 
                    whiteSpace: 'nowrap',
                    padding: '16px 12px',
                  }}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    backgroundColor: '#2e3440', // ダークブルーグレー
                    color: '#ffffff !important', // 純白（強制適用）
                    borderBottom: '2px solid #4c566a',
                    letterSpacing: '0.025em',
                    '& *': {
                      color: '#ffffff !important', // 子要素も白色に強制
                    },
                  }}
                >
                  操作
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} 
                  align="center"
                  sx={{ py: 6 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {loading ? 'データを読み込み中...' : emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow 
                  key={index} 
                  hover
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                    '&:hover': {
                      backgroundColor: '#e3f2fd', // ライトブルー
                      '& .MuiTableCell-root': {
                        color: '#1565c0', // ダークブルー
                      },
                    },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align}>
                      {column.format 
                        ? column.format(row[column.id], row) 
                        : row[column.id] || '-'
                      }
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && (
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={1}>
                        {onEdit && (
                          <Tooltip title="編集">
                            <IconButton
                              size="small"
                              onClick={() => onEdit(row)}
                              sx={{
                                color: 'primary.main',
                                '&:hover': {
                                  backgroundColor: '#1976d2',
                                  color: '#ffffff',
                                },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="削除">
                            <IconButton
                              size="small"
                              onClick={() => onDelete(row)}
                              sx={{
                                color: 'error.main',
                                '&:hover': {
                                  backgroundColor: '#d32f2f',
                                  color: '#ffffff',
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* データ数表示 */}
      {data.length > 0 && (
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Typography variant="caption" color="text.secondary">
            {data.length} 件のデータ
          </Typography>
        </Box>
      )}
    </Box>
  );
}
