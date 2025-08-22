'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Snackbar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import MainLayout from '@/components/layout/MainLayout';
import { Account, Tax, Department, Category } from '@/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // CSVインポート関連の状態
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const fetchMasters = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/masters');
      if (!response.ok) {
        throw new Error('Failed to fetch master data');
      }

      const data = await response.json();
      setAccounts(data.accounts || []);
      setTaxes(data.taxes || []);
      setDepartments(data.departments || []);
      setCategories(data.categories || []);
    } catch (err: any) {
      console.error('Error fetching masters:', err);
      setError('マスタデータの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'yyyy/MM/dd', { locale: ja });
  };

  // CSVインポート関連の関数
  const handleImportDialogOpen = () => {
    setImportDialogOpen(true);
    setImportType('');
    setImportFile(null);
  };

  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setImportType('');
    setImportFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setImportFile(files[0]);
    }
  };

  const handleImport = async () => {
    if (!importType || !importFile) {
      setSnackbarMessage('マスタータイプとファイルを選択してください。');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('type', importType);

    try {
      const response = await fetch('/api/masters/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSnackbarMessage(result.message || 'インポートが完了しました。');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        handleImportDialogClose();
        fetchMasters(); // マスタデータを再取得
      } else {
        throw new Error(result.error || 'インポートに失敗しました。');
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setSnackbarMessage(err.message || 'インポート中にエラーが発生しました。');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setImporting(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <MainLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">設定</Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchMasters}
              disabled={loading}
            >
              更新
            </Button>
            <Button 
              variant="contained" 
              startIcon={<UploadIcon />}
              onClick={handleImportDialogOpen}
            >
              CSVインポート
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab label="勘定科目" />
            <Tab label="税区分" />
            <Tab label="部門" />
            <Tab label="カテゴリ" />
            <Tab label="エクスポート設定" />
          </Tabs>

          {/* 勘定科目タブ */}
          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PCAコード</TableCell>
                      <TableCell>科目名</TableCell>
                      <TableCell>税区分</TableCell>
                      <TableCell>補助科目数</TableCell>
                      <TableCell>状態</TableCell>
                      <TableCell>有効期間</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.pcaCode}>
                        <TableCell>{account.pcaCode}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.taxCode}</TableCell>
                        <TableCell>{account.subAccounts?.length || 0}</TableCell>
                        <TableCell>
                          <Chip
                            label={account.isActive ? '有効' : '無効'}
                            color={account.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(account.effectiveFrom)} 〜{' '}
                          {formatDate(account.effectiveTo)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* 税区分タブ */}
          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PCA税区分コード</TableCell>
                      <TableCell>税率</TableCell>
                      <TableCell>計算方法</TableCell>
                      <TableCell>端数処理</TableCell>
                      <TableCell>状態</TableCell>
                      <TableCell>有効期間</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {taxes.map((tax) => (
                      <TableRow key={tax.pcaTaxCode}>
                        <TableCell>{tax.pcaTaxCode}</TableCell>
                        <TableCell>{(tax.rate * 100).toFixed(0)}%</TableCell>
                        <TableCell>
                          {tax.method === 'exclusive' ? '外税' : '内税'}
                        </TableCell>
                        <TableCell>
                          {tax.rounding === 'round'
                            ? '四捨五入'
                            : tax.rounding === 'ceil'
                            ? '切り上げ'
                            : '切り捨て'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tax.isActive ? '有効' : '無効'}
                            color={tax.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(tax.effectiveFrom)} 〜 {formatDate(tax.effectiveTo)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* 部門タブ */}
          <TabPanel value={tabValue} index={2}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>部門コード</TableCell>
                      <TableCell>部門名</TableCell>
                      <TableCell>親部門</TableCell>
                      <TableCell>状態</TableCell>
                      <TableCell>有効期間</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.pcaDeptCode}>
                        <TableCell>{dept.pcaDeptCode}</TableCell>
                        <TableCell>{dept.name}</TableCell>
                        <TableCell>{dept.parentCode || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={dept.isActive ? '有効' : '無効'}
                            color={dept.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(dept.effectiveFrom)} 〜 {formatDate(dept.effectiveTo)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* カテゴリタブ */}
          <TabPanel value={tabValue} index={3}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>カテゴリ名</TableCell>
                      <TableCell>デフォルト借方科目</TableCell>
                      <TableCell>デフォルト貸方科目</TableCell>
                      <TableCell>税ルール</TableCell>
                      <TableCell>表示順</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.defaultDebitAccountPcaCode || '-'}</TableCell>
                        <TableCell>{category.defaultCreditAccountPcaCode || '-'}</TableCell>
                        <TableCell>{category.taxRule || '-'}</TableCell>
                        <TableCell>{category.sortOrder}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* エクスポート設定タブ */}
          <TabPanel value={tabValue} index={4}>
            <Box>
              <Typography variant="h6" gutterBottom>
                エクスポートプロファイル
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>プロファイル名</TableCell>
                      <TableCell>文字コード</TableCell>
                      <TableCell>区切り文字</TableCell>
                      <TableCell>日付形式</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>PCA標準</TableCell>
                      <TableCell>Shift_JIS</TableCell>
                      <TableCell>カンマ (,)</TableCell>
                      <TableCell>YYYY/MM/DD</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined">
                          編集
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                disabled
              >
                プロファイル追加
              </Button>
            </Box>
          </TabPanel>
        </Paper>

        {/* CSVインポートダイアログ */}
        <Dialog open={importDialogOpen} onClose={handleImportDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>マスタデータのCSVインポート</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="import-type-label">マスタータイプ</InputLabel>
                <Select
                  labelId="import-type-label"
                  value={importType}
                  label="マスタータイプ"
                  onChange={(e) => setImportType(e.target.value)}
                >
                  <MenuItem value="accounts">勘定科目</MenuItem>
                  <MenuItem value="subAccounts">補助科目</MenuItem>
                  <MenuItem value="departments">部門</MenuItem>
                  <MenuItem value="taxes">税区分</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <input
                  accept=".csv,.xlsx,.xls"
                  style={{ display: 'none' }}
                  id="csv-file-input"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="csv-file-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                  >
                    ファイルを選択 (CSV/Excel)
                  </Button>
                </label>
                {importFile && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    選択されたファイル: {importFile.name}
                  </Typography>
                )}
              </Box>

              <Alert severity="info">
                <Typography variant="body2">
                  インポート時の注意事項：
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>CSVファイルはShift-JIS/UTF-8形式に対応しています</li>
                  <li>税区分はExcelファイル（.xlsx）にも対応しています</li>
                  <li>既存のデータは上書きされます</li>
                  <li>補助科目は勘定科目の後にインポートしてください</li>
                </ul>
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleImportDialogClose} disabled={importing}>
              キャンセル
            </Button>
            <Button
              onClick={handleImport}
              variant="contained"
              disabled={importing || !importType || !importFile}
            >
              {importing ? <CircularProgress size={24} /> : 'インポート'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* スナックバー */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}