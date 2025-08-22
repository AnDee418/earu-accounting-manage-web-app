import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Paper,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  VerifiedUser as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { CompanyUser, UserRole } from '@/types/auth';
import { Department } from '@/types/settings';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import UserEditDialog from './UserEditDialog';
import UserAddDialog from './UserAddDialog';

interface UserManagementProps {
  departments: Department[];
}

export default function UserManagement({ departments }: UserManagementProps) {
  const { user: currentUser, userRole } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // ロール表示用のヘルパー関数
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return '管理者';
      case 'finance': return '経理担当';
      case 'manager': return 'マネージャー';
      case 'staff': return 'スタッフ';
      default: return role;
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

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <AdminIcon />;
      case 'finance': return <BusinessIcon />;
      case 'manager': return <BadgeIcon />;
      case 'staff': return <PersonIcon />;
      default: return <PersonIcon />;
    }
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return '未設定';
    const dept = departments.find(d => d.pcaDeptCode === departmentId);
    return dept ? dept.name : departmentId;
  };

  const getStatusColor = (disabled: boolean) => disabled ? 'error' : 'success';
  const getStatusIcon = (disabled: boolean) => disabled ? <CancelIcon /> : <CheckCircleIcon />;

  // ユーザー一覧取得
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // 編集ダイアログを開く
  const handleEditUser = (user: CompanyUser) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  // 編集ダイアログを閉じる
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingUser(null);
  };

  // ユーザー更新成功時のコールバック
  const handleUserUpdated = () => {
    fetchUsers(); // リストを再取得
    handleEditDialogClose();
  };

  // ユーザー追加ダイアログを開く
  const handleAddUser = () => {
    setAddDialogOpen(true);
  };

  // ユーザー追加ダイアログを閉じる
  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
  };

  // ユーザー追加成功時のコールバック
  const handleUserAdded = () => {
    fetchUsers(); // リストを再取得
    handleAddDialogClose();
  };

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  // 管理者権限チェック
  if (userRole !== 'admin') {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" color="error">
          この機能は管理者のみアクセス可能です
        </Typography>
      </Box>
    );
  }

  if (loading && users.length === 0) {
    return <LoadingSpinner message="ユーザー一覧を読み込み中..." />;
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">
          ユーザー管理
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleAddUser}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              }
            }}
          >
            ユーザー追加
          </Button>
          <Button
            variant="outlined"
            onClick={fetchUsers}
            disabled={loading}
          >
            再読み込み
          </Button>
        </Box>
      </Box>

      {/* ユーザー一覧テーブル */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ユーザー</TableCell>
              <TableCell>役割</TableCell>
              <TableCell>部門</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>メール認証</TableCell>
              <TableCell>作成日</TableCell>
              <TableCell>最終ログイン</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 36, height: 36 }}>
                      <EmailIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {user.displayName || 'ユーザー名未設定'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={getRoleLabel(user.role)}
                    size="small"
                    color={getRoleColor(user.role) as any}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getDepartmentName(user.departmentId)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(user.disabled)}
                    label={user.disabled ? '無効' : '有効'}
                    size="small"
                    color={getStatusColor(user.disabled)}
                    variant="filled"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={user.emailVerified ? <VerifiedIcon /> : <EmailIcon />}
                    label={user.emailVerified ? '認証済み' : '未認証'}
                    size="small"
                    color={user.emailVerified ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(new Date(user.createdAt), 'yyyy/MM/dd', { locale: ja })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.lastSignInTime 
                      ? format(new Date(user.lastSignInTime), 'yyyy/MM/dd HH:mm', { locale: ja })
                      : '-'
                    }
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleEditUser(user)}
                    sx={{
                      '&:hover': {
                        background: 'primary.light',
                        color: 'primary.contrastText',
                      }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    ユーザーが見つかりません
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ユーザー編集ダイアログ */}
      {editingUser && (
        <UserEditDialog
          open={editDialogOpen}
          user={editingUser}
          currentUser={currentUser}
          departments={departments}
          onClose={handleEditDialogClose}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* ユーザー追加ダイアログ */}
      <UserAddDialog
        open={addDialogOpen}
        departments={departments}
        onClose={handleAddDialogClose}
        onUserAdded={handleUserAdded}
      />
    </Box>
  );
}
