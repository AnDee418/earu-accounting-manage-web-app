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
      icon: <InboxIcon />,
      path: '/expenses',
      roles: ['manager', 'finance', 'admin'],
    },
    {
      text: 'ダッシュボード',
      icon: <AssessmentIcon />,
      path: '/dashboard',
      roles: ['manager', 'finance', 'admin'],
    },
    {
      text: 'エクスポート',
      icon: <DownloadIcon />,
      path: '/export',
      roles: ['finance', 'admin'],
    },
    {
      text: '設定',
      icon: <SettingsIcon />,
      path: '/settings',
      roles: ['finance', 'admin'],
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
        sx={{
          width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
          ml: open ? `${drawerWidth}px` : 0,
          transition: 'width 0.3s, margin 0.3s',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            EARU 経理管理システム
          </Typography>
          <Chip
            label={getRoleLabel(userRole)}
            color={getRoleBadgeColor(userRole)}
            size="small"
            sx={{ mr: 2 }}
          />
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircleIcon />
          </IconButton>
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
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              ログアウト
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
            transition: 'width 0.3s',
            ...(open ? {} : { width: 0, overflow: 'hidden' }),
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {filteredMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={pathname === item.path}
                  onClick={() => router.push(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
          ml: open ? 0 : `-${drawerWidth}px`,
          transition: 'width 0.3s, margin 0.3s',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}