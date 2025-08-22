import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
  Avatar,
  Typography,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'error' | 'info' | 'success';
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '実行',
  cancelText = 'キャンセル',
  type = 'warning',
  loading = false,
}: ConfirmDialogProps) {
  const getTypeConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: <ErrorIcon />,
          color: 'error.main',
          bgColor: 'error.light',
          confirmColor: 'error' as const,
        };
      case 'info':
        return {
          icon: <InfoIcon />,
          color: 'info.main',
          bgColor: 'info.light',
          confirmColor: 'primary' as const,
        };
      case 'success':
        return {
          icon: <SuccessIcon />,
          color: 'success.main',
          bgColor: 'success.light',
          confirmColor: 'success' as const,
        };
      default: // warning
        return {
          icon: <WarningIcon />,
          color: 'warning.main',
          bgColor: 'warning.light',
          confirmColor: 'warning' as const,
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar 
            sx={{ 
              bgcolor: config.bgColor,
              color: config.color,
              width: 48,
              height: 48,
            }}
          >
            {config.icon}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              この操作を実行しますか？
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ py: 3 }}>
        <DialogContentText
          sx={{
            color: 'text.primary',
            fontSize: '1rem',
            lineHeight: 1.6,
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={config.confirmColor}
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? '実行中...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
