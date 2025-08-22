'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Expense, ExpenseStatus, PcaStatus } from '@/types';

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { companyId, userRole } = useAuth();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    const fetchExpenseDetail = async () => {
      if (!companyId || !params.id) return;

      setLoading(true);
      setError('');

      try {
        // まずexpense_searchから基本情報を取得
        const expenseSearchDoc = await getDoc(
          doc(db, `companies/${companyId}/expense_search`, params.id as string)
        );

        if (!expenseSearchDoc.exists()) {
          setError('経費データが見つかりません。');
          setLoading(false);
          return;
        }

        const searchData = expenseSearchDoc.data();
        const userId = searchData.userId;

        // users/{userId}/expenses/{expenseId}から詳細を取得
        const expenseDetailDoc = await getDoc(
          doc(
            db,
            `companies/${companyId}/users/${userId}/expenses`,
            params.id as string
          )
        );

        if (expenseDetailDoc.exists()) {
          const detailData = expenseDetailDoc.data();
          setExpense({
            id: expenseDetailDoc.id,
            ...detailData,
            paidAt: detailData.paidAt?.toDate ? detailData.paidAt.toDate() : detailData.paidAt,
            createdAt: detailData.createdAt?.toDate
              ? detailData.createdAt.toDate()
              : detailData.createdAt,
            updatedAt: detailData.updatedAt?.toDate
              ? detailData.updatedAt.toDate()
              : detailData.updatedAt,
            approvedAt: detailData.approvedAt?.toDate
              ? detailData.approvedAt.toDate()
              : detailData.approvedAt,
            exportAt: detailData.exportAt?.toDate
              ? detailData.exportAt.toDate()
              : detailData.exportAt,
          } as Expense);

          // expense_filesを取得
          const filesSnapshot = await getDocs(
            collection(
              db,
              `companies/${companyId}/users/${userId}/expense_files/${params.id}`
            )
          );
          const filesList: any[] = [];
          filesSnapshot.forEach((doc) => {
            filesList.push({ id: doc.id, ...doc.data() });
          });
          setFiles(filesList);
        } else {
          setError('詳細データが見つかりません。');
        }
      } catch (err: any) {
        console.error('Error fetching expense detail:', err);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseDetail();
  }, [companyId, params.id]);

  const getStatusChip = (status: ExpenseStatus) => {
    const statusConfig = {
      draft: { label: '下書き', color: 'default' as const },
      submitted: { label: '提出済み', color: 'info' as const },
      approved: { label: '承認済み', color: 'success' as const },
      rejected: { label: '差戻し', color: 'error' as const },
      exported: { label: 'エクスポート済み', color: 'primary' as const },
    };
    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} />;
  };

  const getPcaStatusChip = (status: PcaStatus) => {
    const statusConfig = {
      pending: { label: '未処理', color: 'warning' as const },
      exported: { label: 'PCA連携済み', color: 'success' as const },
      error: { label: 'エラー', color: 'error' as const },
    };
    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} />;
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'yyyy年MM月dd日', { locale: ja });
  };

  const formatDateTime = (date: Date | undefined) => {
    if (!date) return '-';
    return format(date, 'yyyy年MM月dd日 HH:mm', { locale: ja });
  };

  if (loading) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error || !expense) {
    return (
      <MainLayout>
        <Alert severity="error">{error || 'データが見つかりません'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mt: 2 }}>
          戻る
        </Button>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box>
        {/* ヘッダー */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => router.back()}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4">経費詳細</Typography>
            {getStatusChip(expense.status)}
            {getPcaStatusChip(expense.pcaStatus)}
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              disabled={expense.status !== 'submitted'}
            >
              承認
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              disabled={expense.status !== 'submitted'}
            >
              差戻し
            </Button>
            <Button variant="outlined" startIcon={<EditIcon />}>
              編集
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* 基本情報 */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    支払日
                  </Typography>
                  <Typography variant="body1">{formatDate(expense.paidAt)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    支払先
                  </Typography>
                  <Typography variant="body1">{expense.merchant}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    金額（税込）
                  </Typography>
                  <Typography variant="h5">¥{expense.total.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    税額
                  </Typography>
                  <Typography variant="body1">¥{expense.tax.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    カテゴリ
                  </Typography>
                  <Typography variant="body1">{expense.categoryId || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    部門
                  </Typography>
                  <Typography variant="body1">{expense.departmentId || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    備考
                  </Typography>
                  <Typography variant="body1">{expense.note || '-'}</Typography>
                </Grid>
              </Grid>

              {/* AI情報 */}
              {expense.ai && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    AI抽出情報
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        エンジン
                      </Typography>
                      <Typography variant="body1">{expense.ai.engine}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        信頼度
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">
                          {(expense.ai.confidence * 100).toFixed(1)}%
                        </Typography>
                        {expense.ai.confidence >= 0.85 && (
                          <Chip label="高精度" color="success" size="small" />
                        )}
                        {expense.ai.confidence >= 0.6 && expense.ai.confidence < 0.85 && (
                          <Chip label="要確認" color="warning" size="small" />
                        )}
                        {expense.ai.confidence < 0.6 && (
                          <Chip label="低精度" color="error" size="small" />
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* PCA情報 */}
              {expense.accountSnapshot && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    勘定科目情報
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        勘定科目コード
                      </Typography>
                      <Typography variant="body1">{expense.accountSnapshot.pcaCode}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        勘定科目名
                      </Typography>
                      <Typography variant="body1">{expense.accountSnapshot.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        税区分
                      </Typography>
                      <Typography variant="body1">{expense.accountSnapshot.taxCode}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        税率
                      </Typography>
                      <Typography variant="body1">
                        {(expense.accountSnapshot.rate * 100).toFixed(0)}%
                      </Typography>
                    </Grid>
                  </Grid>
                </>
              )}
            </Paper>
          </Grid>

          {/* サイドバー */}
          <Grid item xs={12} md={4}>
            {/* 添付ファイル */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  添付ファイル
                </Typography>
                {files.length > 0 ? (
                  <List dense>
                    {files.map((file) => (
                      <ListItem key={file.id}>
                        <ListItemText
                          primary={`ページ ${file.page}`}
                          secondary={`ステータス: ${file.ocrStatus || '未処理'}`}
                        />
                        <IconButton size="small">
                          <DownloadIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    添付ファイルはありません
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* タイムライン */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  履歴
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="作成"
                      secondary={formatDateTime(expense.createdAt)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="最終更新"
                      secondary={formatDateTime(expense.updatedAt)}
                    />
                  </ListItem>
                  {expense.approvedAt && (
                    <ListItem>
                      <ListItemText
                        primary="承認"
                        secondary={formatDateTime(expense.approvedAt)}
                      />
                    </ListItem>
                  )}
                  {expense.exportAt && (
                    <ListItem>
                      <ListItemText
                        primary="エクスポート"
                        secondary={formatDateTime(expense.exportAt)}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}