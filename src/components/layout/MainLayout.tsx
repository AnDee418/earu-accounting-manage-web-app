'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Inbox as InboxIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
  CloudDownload as CloudDownloadIcon,
  SettingsApplications as SettingsApplicationsIcon,
  Business as BusinessIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

const drawerWidth = 240;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, signOut } = useAuth();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    handleProfileMenuClose();
    await signOut();
  };

  const menuItems = [
    {
      text: '受信ボックス',
      icon: <ReceiptIcon />,
      path: '/expenses',
      roles: ['manager', 'finance', 'admin'],
      description: '経費申請の確認・承認',
    },
    {
      text: 'ダッシュボード',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['manager', 'finance', 'admin'],
      description: '概要とレポート',
    },
    {
      text: 'エクスポート',
      icon: <CloudDownloadIcon />,
      path: '/export',
      roles: ['finance', 'admin'],
      description: 'PCA会計へのデータ出力',
    },
    {
      text: '設定',
      icon: <SettingsApplicationsIcon />,
      path: '/settings',
      roles: ['finance', 'admin'],
      description: 'マスタデータ管理',
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(userRole || '')
  );

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'finance':
        return 'warning';
      case 'manager':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'finance':
        return '経理';
      case 'manager':
        return 'マネージャー';
      case 'staff':
        return 'スタッフ';
      default:
        return '未設定';
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
          ml: open ? `${drawerWidth}px` : 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important', px: 3 }}>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ 
              mr: 2, 
              p: 1.5,
              borderRadius: 2,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                background: 'rgba(33, 150, 243, 0.08)',
                transform: 'scale(1.05)',
              }
            }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <BusinessIcon sx={{ mr: 1.5, fontSize: 28, color: 'primary.main' }} />
            <Typography 
              variant="h5" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
              }}
            >
              EARU 経理管理システム
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              sx={{ 
                p: 1.5,
                borderRadius: 2,
                '&:hover': {
                  background: 'rgba(33, 150, 243, 0.08)',
                }
              }}
            >
              <SearchIcon />
            </IconButton>
            
            <IconButton
              color="inherit"
              sx={{ 
                p: 1.5,
                borderRadius: 2,
                '&:hover': {
                  background: 'rgba(33, 150, 243, 0.08)',
                }
              }}
            >
              <NotificationsIcon />
            </IconButton>
            
            <Chip
              label={getRoleLabel(userRole)}
              color={getRoleBadgeColor(userRole)}
              size="small"
              sx={{ 
                mx: 1,
                fontWeight: 600,
                '& .MuiChip-label': {
                  px: 1.5,
                }
              }}
            />
            
            <Avatar
              sx={{ 
                width: 40, 
                height: 40,
                cursor: 'pointer',
                border: '2px solid rgba(33, 150, 243, 0.2)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  border: '2px solid rgba(33, 150, 243, 0.5)',
                  transform: 'scale(1.05)',
                }
              }}
              onClick={handleProfileMenuOpen}
            >
              <AccountCircleIcon />
            </Avatar>
          </Box>
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                minWidth: 250,
              }
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                ログイン中のユーザー
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {user?.email}
              </Typography>
              <Chip
                label={getRoleLabel(userRole)}
                color={getRoleBadgeColor(userRole)}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
            
            <MenuItem 
              onClick={handleSignOut}
              sx={{ 
                py: 1.5,
                px: 2,
                '&:hover': {
                  background: 'rgba(244, 67, 54, 0.08)',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography sx={{ color: 'error.main', fontWeight: 500 }}>
                ログアウト
              </Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            ...(open ? {} : { width: 0, overflow: 'hidden' }),
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <Toolbar sx={{ minHeight: '70px !important' }} />
        
        {/* ブランドセクション */}
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Typography variant="overline" sx={{ 
            color: 'text.secondary', 
            fontWeight: 600,
            letterSpacing: 1,
            fontSize: '0.75rem'
          }}>
            メインメニュー
          </Typography>
        </Box>
        
        <Box sx={{ overflow: 'auto', flex: 1, py: 2 }}>
          <List sx={{ px: 1 }}>
            {filteredMenuItems.map((item, index) => (
              <ListItem 
                key={item.text} 
                disablePadding
                sx={{ mb: 0.5 }}
              >
                <ListItemButton
                  selected={pathname === item.path}
                  onClick={() => router.push(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.12) 100%)',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4,
                        height: '60%',
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        borderRadius: '0 2px 2px 0',
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 44,
                    color: pathname === item.path ? 'primary.main' : 'text.secondary',
                    '& .MuiSvgIcon-root': {
                      fontSize: 24,
                      transition: 'all 0.2s ease-in-out',
                    }
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  
                  <ListItemText 
                    primary={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: pathname === item.path ? 600 : 500,
                          color: pathname === item.path ? 'primary.main' : 'text.primary',
                        }}
                      >
                        {item.text}
                      </Typography>
                    }
                    secondary={
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          mt: 0.5,
                          display: 'block'
                        }}
                      >
                        {item.description}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          
          {/* フッター情報 */}
          <Box sx={{ mt: 'auto', p: 3 }}>
            <Box sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0.1) 100%)',
              borderRadius: 2,
              border: '1px solid rgba(33, 150, 243, 0.1)'
            }}>
              <Typography variant="caption" sx={{ 
                color: 'text.secondary',
                fontWeight: 600,
                display: 'block'
              }}>
                システム情報
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'text.secondary',
                fontSize: '0.7rem'
              }}>
                Version 1.0.0
              </Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: { xs: 2, sm: 3 },
          width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
          ml: open ? 0 : `-${drawerWidth}px`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          position: 'relative',
          '&:before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.02) 0%, rgba(156, 39, 176, 0.02) 100%)',
            pointerEvents: 'none',
            zIndex: -1,
          }
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }} />
        <Box sx={{ 
          position: 'relative', 
          zIndex: 1,
          animation: 'fadeIn 0.6s ease-out',
          '@keyframes fadeIn': {
            '0%': {
              opacity: 0,
              transform: 'translateY(20px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          }
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}