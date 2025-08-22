import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  AccountCircle as AccountCircleIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  VerifiedUser as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Key as KeyIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { CompanyUser, UserRole, SessionUser } from '@/types/auth';
import { Department } from '@/types/settings';
import { useSnackbar } from '@/hooks/useSnackbar';

interface UserEditDialogProps {
  open: boolean;
  user: CompanyUser;
  currentUser: SessionUser | null;
  departments: Department[];
  onClose: () => void;
  onUserUpdated: () => void;
}

interface EditFormData {
  role: UserRole;
  departmentId: string;
  disabled: boolean;
  newPassword?: string;
}

export default function UserEditDialog({
  open,
  user,
  currentUser,
  departments,
  onClose,
  onUserUpdated,
}: UserEditDialogProps) {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    role: user.role,
    departmentId: user.departmentId || '',
    disabled: user.disabled,
    newPassword: '',
  });

  // ユーザーが変わったらフォームデータをリセット
  useEffect(() => {
    setFormData({
      role: user.role,
      departmentId: user.departmentId || '',
      disabled: user.disabled,
      newPassword: '',
    });
    setPasswordChanged(false);
    setShowPassword(false);
  }, [user]);

  // ヘルパー関数
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <AdminIcon />;
      case 'finance': return <BusinessIcon />;
      case 'manager': return <BadgeIcon />;
      case 'staff': return <PersonIcon />;
      default: return <PersonIcon />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'error';
      case 'finance': return 'warning';
      case 'manager': return 'info';
      case 'staff': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (disabled: boolean) => disabled ? 'error' : 'success';
  const getStatusIcon = (disabled: boolean) => disabled ? <CancelIcon /> : <CheckCircleIcon />;

  // 一時パスワード生成
  const generateTemporaryPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // 必須文字種を含める
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 26)); // 大文字
    password += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26)); // 小文字
    password += '0123456789'.charAt(Math.floor(Math.random() * 10)); // 数字
    password += '!@#$%^&*'.charAt(Math.floor(Math.random() * 8)); // 記号
    
    // 残りの文字をランダム生成
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // パスワードをシャッフル
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // 一時パスワード設定
  const handleGeneratePassword = () => {
    const newPassword = generateTemporaryPassword();
    setFormData(prev => ({ ...prev, newPassword }));
    setPasswordChanged(true);
  };

  // ユーザー更新処理
  const handleUpdateUser = async () => {
    try {
      setLoading(true);

      // パスワード変更時のみパスワードを送信
      const updateData = {
        uid: user.uid,
        role: formData.role,
        departmentId: formData.departmentId,
        disabled: formData.disabled,
        ...(passwordChanged && formData.newPassword ? { newPassword: formData.newPassword } : {}),
      };

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの更新に失敗しました');
      }

      let message = 'ユーザー情報を更新しました';
      if (passwordChanged && formData.newPassword) {
        message += '\nパスワードも変更されました';
      }
      
      showSuccess(message);
      setPasswordChanged(false);
      setFormData(prev => ({ ...prev, newPassword: '' }));
      onUserUpdated();
    } catch (error) {
      console.error('Error updating user:', error);
      const message = error instanceof Error ? error.message : 'ユーザーの更新に失敗しました';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const isSelfEdit = user.uid === currentUser?.uid;
  const cannotRemoveAdminRole = isSelfEdit && formData.role !== 'admin' && currentUser?.role === 'admin';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <EditIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">ユーザー編集</Typography>
            <Typography variant="body2" color="text.secondary">
              ユーザーの権限と設定を管理
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* ユーザー情報カード */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: getRoleColor(user.role) + '.main',
                    width: 56,
                    height: 56
                  }}
                >
                  {getRoleIcon(user.role)}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" gutterBottom>
                    {user.displayName || 'ユーザー名未設定'}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      icon={<CalendarIcon />}
                      label={format(new Date(user.createdAt), 'yyyy/MM/dd登録', { locale: ja })}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={user.emailVerified ? <VerifiedIcon /> : <EmailIcon />}
                      label={user.emailVerified ? '認証済み' : '未認証'}
                      size="small"
                      color={user.emailVerified ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </Stack>
                </Box>
                <Box>
                  <Chip
                    icon={getStatusIcon(user.disabled)}
                    label={user.disabled ? '無効' : '有効'}
                    color={getStatusColor(user.disabled)}
                    variant="filled"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Divider />

          <Grid container spacing={3}>
            {/* 役割設定 */}
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SecurityIcon color="primary" />
                    <Typography variant="h6">役割設定</Typography>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>ユーザーの役割</InputLabel>
                    <Select
                      value={formData.role}
                      label="ユーザーの役割"
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))
                      }
                    >
                      <MenuItem value="staff">
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon fontSize="small" />
                          一般スタッフ
                        </Box>
                      </MenuItem>
                      <MenuItem value="manager">
                        <Box display="flex" alignItems="center" gap={1}>
                          <BadgeIcon fontSize="small" />
                          マネージャー
                        </Box>
                      </MenuItem>
                      <MenuItem value="finance">
                        <Box display="flex" alignItems="center" gap={1}>
                          <BusinessIcon fontSize="small" />
                          経理担当
                        </Box>
                      </MenuItem>
                      <MenuItem value="admin">
                        <Box display="flex" alignItems="center" gap={1}>
                          <AdminIcon fontSize="small" />
                          管理者
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {formData.role === 'admin' && '全ての機能にアクセス可能'}
                    {formData.role === 'finance' && '経理関連の機能を管理'}
                    {formData.role === 'manager' && '部門の経費を承認・管理'}
                    {formData.role === 'staff' && '自分の経費を入力・申請'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* 部門設定 */}
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <BusinessIcon color="primary" />
                    <Typography variant="h6">部門設定</Typography>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>所属部門</InputLabel>
                    <Select
                      value={formData.departmentId}
                      label="所属部門"
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, departmentId: e.target.value }))
                      }
                    >
                      <MenuItem value="">
                        <em>部門未設定</em>
                      </MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept.pcaDeptCode} value={dept.pcaDeptCode}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                              {dept.pcaDeptCode}
                            </Typography>
                            {dept.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    部門が設定されていない場合、全社共通として扱われます
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* アカウント状態設定 */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <AccountCircleIcon color="primary" />
                  <Box>
                    <Typography variant="h6">アカウント状態</Typography>
                    <Typography variant="body2" color="text.secondary">
                      アカウントの有効・無効を切り替えます
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!formData.disabled}
                      onChange={(e) => 
                        setFormData(prev => ({ ...prev, disabled: !e.target.checked }))
                      }
                      color="success"
                    />
                  }
                  label={
                    <Chip
                      icon={getStatusIcon(formData.disabled)}
                      label={formData.disabled ? 'アカウント無効' : 'アカウント有効'}
                      color={getStatusColor(formData.disabled)}
                      size="small"
                    />
                  }
                />
              </Box>
              {formData.disabled && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  無効にされたユーザーはログインできなくなります。
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* パスワード変更設定 */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LockIcon color="primary" />
                <Box>
                  <Typography variant="h6">パスワード変更</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ユーザーのパスワードを変更または自動生成します
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="新しいパスワード"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, newPassword: e.target.value }));
                      setPasswordChanged(true);
                    }}
                    placeholder="新しいパスワードを入力または自動生成"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            size="small"
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleGeneratePassword}
                    startIcon={<RefreshIcon />}
                    size="small"
                    sx={{ height: 40 }}
                  >
                    自動生成
                  </Button>
                </Grid>
              </Grid>

              {passwordChanged && formData.newPassword && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 1 }}>
                  <Typography variant="body2">
                    パスワードが変更されます。ユーザーに新しいパスワードを安全に共有してください。
                  </Typography>
                </Alert>
              )}

              {!formData.newPassword && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  パスワードを空欄のまま保存すると、現在のパスワードは変更されません
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* 警告メッセージ */}
          {cannotRemoveAdminRole && (
            <Alert 
              severity="error" 
              sx={{ borderRadius: 2 }}
              icon={<SecurityIcon />}
            >
              <Typography variant="subtitle2" gutterBottom>
                自己権限削除の警告
              </Typography>
              自分自身の管理者権限を削除することはできません。他の管理者に変更を依頼してください。
            </Alert>
          )}

          {isSelfEdit && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                自分自身を編集中
              </Typography>
              現在ログイン中のアカウントを編集しています。権限変更は次回ログイン時に反映されます。
            </Alert>
          )}
        </Stack>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          startIcon={<CancelIcon />}
        >
          キャンセル
        </Button>
        <Button
          onClick={handleUpdateUser}
          variant="contained"
          disabled={cannotRemoveAdminRole || loading}
          startIcon={<CheckCircleIcon />}
        >
          {loading ? '更新中...' : '変更を保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
