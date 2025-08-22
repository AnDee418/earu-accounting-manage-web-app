import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  Typography,
  Alert,
  LinearProgress,
  IconButton,
  InputAdornment,
  Avatar,
  Paper,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import { UserRole } from '@/types/auth';
import { Department } from '@/types/settings';

interface UserAddDialogProps {
  open: boolean;
  departments: Department[];
  onClose: () => void;
  onUserAdded: () => void;
}

interface NewUserData {
  email: string;
  displayName: string;
  role: UserRole;
  departmentId?: string;
  password?: string;
}

export default function UserAddDialog({
  open,
  departments,
  onClose,
  onUserAdded,
}: UserAddDialogProps) {
  const [formData, setFormData] = useState<NewUserData>({
    email: '',
    displayName: '',
    role: 'staff',
    departmentId: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // フォームバリデーション
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.displayName.trim()) {
      errors.displayName = '表示名は必須です';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/registration/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          displayName: formData.displayName,
          role: formData.role,
          departmentId: formData.departmentId || undefined,
          password: formData.password || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーの追加に失敗しました');
      }

      const result = await response.json();
      
      // 一時パスワードが生成された場合は表示
      if (result.temporaryPassword) {
        setTemporaryPassword(result.temporaryPassword);
      } else {
        onUserAdded();
        handleClose();
      }
    } catch (error) {
      console.error('Error adding user:', error);
      setError(error instanceof Error ? error.message : 'ユーザーの追加中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // ダイアログを閉じる
  const handleClose = () => {
    setFormData({
      email: '',
      displayName: '',
      role: 'staff',
      departmentId: '',
      password: '',
    });
    setError(null);
    setValidationErrors({});
    setTemporaryPassword(null);
    setShowPassword(false);
    onClose();
  };

  // パスワード完了処理
  const handlePasswordComplete = () => {
    onUserAdded();
    handleClose();
  };

  // パスワードをクリップボードにコピー
  const copyToClipboard = async () => {
    if (temporaryPassword) {
      try {
        await navigator.clipboard.writeText(temporaryPassword);
      } catch (error) {
        console.error('Failed to copy password:', error);
      }
    }
  };

  // フォームデータ更新
  const handleInputChange = (field: keyof NewUserData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // エラーをクリア
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ロール表示名を取得
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return '管理者';
      case 'finance': return '経理';
      case 'manager': return 'マネージャー';
      case 'staff': return 'スタッフ';
      default: return role;
    }
  };

  // ロール色を取得
  const getRoleColor = (role: UserRole): 'error' | 'warning' | 'info' | 'success' => {
    switch (role) {
      case 'admin': return 'error';
      case 'finance': return 'warning';
      case 'manager': return 'info';
      case 'staff': return 'success';
      default: return 'info';
    }
  };

  // 一時パスワード表示の場合
  if (temporaryPassword) {
    return (
      <Dialog 
        open={open} 
        onClose={handlePasswordComplete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 38px rgba(0, 0, 0, 0.14), 0 9px 46px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 2, textAlign: 'center' }}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64,
                backgroundColor: 'success.main',
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} color="success.main">
              ユーザー追加完了
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={600} gutterBottom>
              ユーザーが正常に作成されました！
            </Typography>
            <Typography variant="body2">
              以下の一時パスワードをユーザーに安全に共有してください。
            </Typography>
          </Alert>

          <Paper 
            elevation={2}
            sx={{ 
              p: 3,
              borderRadius: 2,
              backgroundColor: 'grey.50',
              border: '1px solid',
              borderColor: 'success.main',
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
              一時パスワード
            </Typography>
            <TextField
              fullWidth
              value={temporaryPassword}
              type={showPassword ? 'text' : 'password'}
              InputProps={{
                readOnly: true,
                sx: {
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  borderRadius: 2,
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                    <IconButton
                      onClick={copyToClipboard}
                      edge="end"
                      color="primary"
                    >
                      <CopyIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ mt: 1, display: 'block', textAlign: 'center' }}
            >
              このパスワードは初回ログイン時に変更してもらってください
            </Typography>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, justifyContent: 'center' }}>
          <Button
            onClick={handlePasswordComplete}
            variant="contained"
            color="success"
            sx={{ borderRadius: 2, px: 4 }}
          >
            完了
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={600}>
          ユーザー追加
        </Typography>
      </DialogTitle>

      {loading && <LinearProgress />}

      <DialogContent sx={{ px: 3, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
            disabled={loading}
            size="small"
            placeholder="user@example.com"
          />
          
          <TextField
            fullWidth
            label="名前"
            value={formData.displayName}
            onChange={handleInputChange('displayName')}
            error={!!validationErrors.displayName}
            helperText={validationErrors.displayName}
            disabled={loading}
            size="small"
            placeholder="山田太郎"
          />

          <TextField
            fullWidth
            label="パスワード (省略時は自動生成)"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange('password')}
            disabled={loading}
            size="small"
            placeholder="任意のパスワード"
            InputProps={{
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
            helperText="空欄の場合、12文字の一時パスワードが自動生成されます"
          />

          <FormControl fullWidth disabled={loading} size="small">
            <InputLabel>権限</InputLabel>
            <Select
              value={formData.role}
              label="権限"
              onChange={handleInputChange('role')}
            >
              <MenuItem value="staff">スタッフ</MenuItem>
              <MenuItem value="manager">マネージャー</MenuItem>
              <MenuItem value="finance">経理</MenuItem>
              <MenuItem value="admin">管理者</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loading} size="small">
            <InputLabel>所属</InputLabel>
            <Select
              value={formData.departmentId || ''}
              label="所属"
              onChange={handleInputChange('departmentId')}
            >
              <MenuItem value="">なし</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.pcaDeptCode} value={dept.pcaDeptCode}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          fullWidth
        >
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          fullWidth
        >
          追加
        </Button>
      </DialogActions>
    </Dialog>
  );
}