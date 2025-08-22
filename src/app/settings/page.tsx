'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Alert } from '@mui/material';

import MainLayout from '@/components/layout/MainLayout';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  SettingsTabs,
  TabPanel,
  TAB_CONFIGS,
  TaxMasterTable,
  AccountMasterTable,
  SubAccountMasterTable,
  DepartmentMasterTable,
  CategoryMasterTable,
} from '@/features/settings/components';
import UserManagement from '@/features/users/components/UserManagement';
import { useMasterData } from '@/features/settings/hooks/useMasterData';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user, userRole } = useAuth();
  const { masterData, loading, fetchMasters } = useMasterData();
  const [activeTab, setActiveTab] = useState(0);

  // タブ変更ハンドラ
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // データ取得
  useEffect(() => {
    if (userRole === 'finance' || userRole === 'admin') {
      fetchMasters();
    }
  }, [userRole, fetchMasters]);

  // ユーザーロールに基づくアクセス制御
  const visibleTabs = TAB_CONFIGS.filter(tab => 
    !tab.roles.length || tab.roles.includes(userRole || 'staff')
  );

  // 権限チェック
  if (!user || (!['finance', 'admin'].includes(userRole || ''))) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              アクセスが制限されています
            </Typography>
            この機能は経理担当者または管理者のみアクセス可能です。
          </Alert>
        </Container>
      </MainLayout>
    );
  }



  return (
    <MainLayout>
      <ErrorBoundary>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* ページヘッダー */}
          <Box mb={4}>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              設定管理
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              マスタデータとシステム設定を管理します。PCA会計システムとの連携に必要なデータを設定できます。
            </Typography>
          </Box>

          {/* タブナビゲーション */}
          <SettingsTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            userRole={userRole}
          />

          {/* ローディング状態 */}
          {loading && activeTab < 5 && (
            <LoadingSpinner 
              message="マスタデータを読み込み中..." 
              sx={{ py: 8 }} 
            />
          )}

          {/* タブコンテンツ */}
          {visibleTabs.map((tabConfig, index) => (
            <TabPanel key={tabConfig.type} value={activeTab} index={index}>
              {tabConfig.type === 'taxes' && (
                <TaxMasterTable
                  taxes={masterData.taxes || []}
                  loading={loading}
                  onRefresh={fetchMasters}
                  onImport={() => {/* TODO: CSVインポート機能 */}}
                />
              )}
              
              {tabConfig.type === 'accounts' && (
                <AccountMasterTable
                  accounts={masterData.accounts || []}
                  loading={loading}
                  onRefresh={fetchMasters}
                  onImport={() => {/* TODO: CSVインポート機能 */}}
                />
              )}
              
              {tabConfig.type === 'subAccounts' && (
                <SubAccountMasterTable
                  subAccounts={masterData.subAccounts || []}
                  loading={loading}
                  onRefresh={fetchMasters}
                  onImport={() => {/* TODO: CSVインポート機能 */}}
                />
              )}
              
              {tabConfig.type === 'categories' && (
                <CategoryMasterTable
                  categories={masterData.categories || []}
                  loading={loading}
                  onRefresh={fetchMasters}
                  onImport={() => {/* TODO: カテゴリ作成機能 */}}
                />
              )}
              
              {tabConfig.type === 'departments' && (
                <DepartmentMasterTable
                  departments={masterData.departments || []}
                  loading={loading}
                  onRefresh={fetchMasters}
                  onImport={() => {/* TODO: CSVインポート機能 */}}
                />
              )}
              
              {tabConfig.type === 'users' && userRole === 'admin' && (
                <UserManagement 
                  departments={masterData.departments || []} 
                />
              )}
            </TabPanel>
          ))}
        </Container>
      </ErrorBoundary>
    </MainLayout>
  );
}
