'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Link,
} from '@mui/material';
import {
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { CompanyRegistration, UserRegistration, RegistrationResponse, UserRole } from '@/types';

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
      id={`registration-tabpanel-${index}`}
      aria-labelledby={`registration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 会社登録用状態
  const [companyData, setCompanyData] = useState<CompanyRegistration>({
    name: '',
    adminUser: {
      email: '',
      password: '',
      displayName: '',
    },
    settings: {
      currency: 'JPY',
      locale: 'ja-JP',
      timezone: 'Asia/Tokyo',
    },
  });

  // ユーザー登録用状態
  const [userData, setUserData] = useState<UserRegistration>({
    email: '',
    password: '',
    displayName: '',
    role: 'staff',
    companyId: '',
    departmentId: '',
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
  };

  const handleCompanyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/registration/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      const result: RegistrationResponse = await response.json();

      if (result.success) {
        setSuccess(
          `会社「${companyData.name}」とアカウントが正常に作成されました。ログイン後、設定画面でPCAマスタデータをCSVインポートしてください。ログインページへ移動します。`
        );
        setTimeout(() => {
          router.push('/login');
        }, 5000);
      } else {
        setError(result.error || '登録に失敗しました。');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError('登録中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/registration/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      const result: RegistrationResponse = await response.json();

      if (result.success) {
        setSuccess('ユーザーが正常に作成されました。');
        setUserData({
          email: '',
          password: '',
          displayName: '',
          role: 'staff',
          companyId: '',
          departmentId: '',
        });
      } else {
        setError(result.error || 'ユーザー作成に失敗しました。');
      }
    } catch (err: any) {
      console.error('User registration error:', err);
      setError('ユーザー作成中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/login')}
                sx={{ mr: 2 }}
              >
                ログインへ戻る
              </Button>
            </Box>

            <Typography variant="h4" align="center" gutterBottom>
              EARU アカウント登録
            </Typography>

            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
              新しい会社の登録、または既存会社へのユーザー追加
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
                <Tab
                  icon={<BusinessIcon />}
                  label="新規会社登録"
                  id="registration-tab-0"
                  aria-controls="registration-tabpanel-0"
                />
                <Tab
                  icon={<PersonAddIcon />}
                  label="ユーザー追加"
                  id="registration-tab-1"
                  aria-controls="registration-tabpanel-1"
                />
              </Tabs>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}

            {/* 新規会社登録タブ */}
            <TabPanel value={tabValue} index={0}>
              <Box component="form" onSubmit={handleCompanyRegistration}>
                <Typography variant="h6" gutterBottom>
                  会社情報
                </Typography>
                
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="会社名"
                    required
                    value={companyData.name}
                    onChange={(e) =>
                      setCompanyData(prev => ({ ...prev, name: e.target.value }))
                    }
                    disabled={loading}
                  />

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>通貨</InputLabel>
                      <Select
                        value={companyData.settings?.currency || 'JPY'}
                        label="通貨"
                        onChange={(e) =>
                          setCompanyData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, currency: e.target.value }
                          }))
                        }
                        disabled={loading}
                      >
                        <MenuItem value="JPY">日本円 (JPY)</MenuItem>
                        <MenuItem value="USD">米ドル (USD)</MenuItem>
                        <MenuItem value="EUR">ユーロ (EUR)</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>地域</InputLabel>
                      <Select
                        value={companyData.settings?.locale || 'ja-JP'}
                        label="地域"
                        onChange={(e) =>
                          setCompanyData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, locale: e.target.value }
                          }))
                        }
                        disabled={loading}
                      >
                        <MenuItem value="ja-JP">日本語</MenuItem>
                        <MenuItem value="en-US">English</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    管理者アカウント
                  </Typography>

                  <TextField
                    fullWidth
                    label="管理者名"
                    required
                    value={companyData.adminUser.displayName}
                    onChange={(e) =>
                      setCompanyData(prev => ({
                        ...prev,
                        adminUser: { ...prev.adminUser, displayName: e.target.value }
                      }))
                    }
                    disabled={loading}
                  />

                  <TextField
                    fullWidth
                    label="管理者メールアドレス"
                    type="email"
                    required
                    value={companyData.adminUser.email}
                    onChange={(e) =>
                      setCompanyData(prev => ({
                        ...prev,
                        adminUser: { ...prev.adminUser, email: e.target.value }
                      }))
                    }
                    disabled={loading}
                  />

                  <TextField
                    fullWidth
                    label="パスワード"
                    type="password"
                    required
                    value={companyData.adminUser.password}
                    onChange={(e) =>
                      setCompanyData(prev => ({
                        ...prev,
                        adminUser: { ...prev.adminUser, password: e.target.value }
                      }))
                    }
                    helperText="8文字以上で入力してください"
                    disabled={loading}
                  />

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>重要：</strong>新規会社では初期マスタデータは作成されません。
                      登録完了後、設定画面でPCAからエクスポートしたマスタデータをCSVインポートしてください。
                    </Typography>
                  </Alert>

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <BusinessIcon />}
                  >
                    {loading ? '登録中...' : '会社とアカウントを作成'}
                  </Button>
                </Stack>
              </Box>
            </TabPanel>

            {/* ユーザー追加タブ */}
            <TabPanel value={tabValue} index={1}>
              <Box component="form" onSubmit={handleUserRegistration}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  既存の会社にユーザーを追加するには、管理者権限でログインしてください。
                </Alert>

                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="ユーザー名"
                    required
                    value={userData.displayName}
                    onChange={(e) =>
                      setUserData(prev => ({ ...prev, displayName: e.target.value }))
                    }
                    disabled={loading}
                  />

                  <TextField
                    fullWidth
                    label="メールアドレス"
                    type="email"
                    required
                    value={userData.email}
                    onChange={(e) =>
                      setUserData(prev => ({ ...prev, email: e.target.value }))
                    }
                    disabled={loading}
                  />

                  <TextField
                    fullWidth
                    label="パスワード"
                    type="password"
                    required
                    value={userData.password}
                    onChange={(e) =>
                      setUserData(prev => ({ ...prev, password: e.target.value }))
                    }
                    helperText="8文字以上で入力してください"
                    disabled={loading}
                  />

                  <FormControl fullWidth required>
                    <InputLabel>ロール</InputLabel>
                    <Select
                      value={userData.role}
                      label="ロール"
                      onChange={(e) =>
                        setUserData(prev => ({ ...prev, role: e.target.value as UserRole }))
                      }
                      disabled={loading}
                    >
                      <MenuItem value="staff">一般スタッフ</MenuItem>
                      <MenuItem value="manager">マネージャー</MenuItem>
                      <MenuItem value="finance">経理担当</MenuItem>
                      <MenuItem value="admin">管理者</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="会社ID（オプション）"
                    value={userData.companyId}
                    onChange={(e) =>
                      setUserData(prev => ({ ...prev, companyId: e.target.value }))
                    }
                    helperText="空白の場合、ログインしているユーザーの会社に追加されます"
                    disabled={loading}
                  />

                  <TextField
                    fullWidth
                    label="部門ID（オプション）"
                    value={userData.departmentId}
                    onChange={(e) =>
                      setUserData(prev => ({ ...prev, departmentId: e.target.value }))
                    }
                    disabled={loading}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                  >
                    {loading ? '作成中...' : 'ユーザーを作成'}
                  </Button>
                </Stack>
              </Box>
            </TabPanel>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                既にアカウントをお持ちですか？{' '}
                <Link
                  component="button"
                  type="button"
                  onClick={() => router.push('/login')}
                  underline="hover"
                >
                  ログインはこちら
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
