import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import {
  Receipt as TaxIcon,
  AccountBox as AccountIcon,
  Category as CategoryIcon,
  Business as DepartmentIcon,
  People as UsersIcon,
  Folder as SubAccountIcon,
} from '@mui/icons-material';

import { SettingsTabType } from '@/types/settings';
import { UserRole } from '@/types/auth';

interface SettingsTabsProps {
  activeTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  userRole?: UserRole | null;
}

interface TabConfig {
  label: string;
  icon: React.ReactElement;
  type: SettingsTabType;
  roles: UserRole[];
  description: string;
}

const TAB_CONFIGS: TabConfig[] = [
  {
    label: '税区分',
    icon: <TaxIcon />,
    type: 'taxes',
    roles: ['finance', 'admin'],
    description: 'PCA税区分マスタの管理',
  },
  {
    label: '勘定科目',
    icon: <AccountIcon />,
    type: 'accounts',
    roles: ['finance', 'admin'],
    description: 'PCA勘定科目マスタの管理',
  },
  {
    label: '補助科目',
    icon: <SubAccountIcon />,
    type: 'subAccounts',
    roles: ['finance', 'admin'],
    description: 'PCA補助科目マスタの管理',
  },
  {
    label: 'カテゴリ',
    icon: <CategoryIcon />,
    type: 'categories',
    roles: ['finance', 'admin'],
    description: '経費カテゴリの管理',
  },
  {
    label: '部門',
    icon: <DepartmentIcon />,
    type: 'departments',
    roles: ['finance', 'admin'],
    description: 'PCA部門マスタの管理',
  },
  {
    label: 'ユーザー管理',
    icon: <UsersIcon />,
    type: 'users',
    roles: ['admin'],
    description: '会社内ユーザーの管理',
  },
];

export default function SettingsTabs({ 
  activeTab, 
  onTabChange, 
  userRole
}: SettingsTabsProps) {
  // ユーザーロールに基づいてタブをフィルタリング
  const visibleTabs = TAB_CONFIGS.filter(tab => 
    !tab.roles.length || tab.roles.includes(userRole || 'staff')
  );

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs
        value={activeTab}
        onChange={onTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            minHeight: 72,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            px: 3,
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
          },
        }}
      >
        {visibleTabs.map((tab, index) => (
          <Tab
            key={tab.type}
            label={
              <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  {tab.icon}
                  {tab.label}
                </Box>
                <Box 
                  component="span" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    color: 'text.secondary',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.description}
                </Box>
              </Box>
            }
            id={`settings-tab-${index}`}
            aria-controls={`settings-tabpanel-${index}`}
          />
        ))}
      </Tabs>
    </Box>
  );
}

// タブパネル用のコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export { TAB_CONFIGS };
export type { TabConfig };
