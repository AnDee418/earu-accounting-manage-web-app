/**
 * ルール適用テスターコンポーネント
 * 要件1.3, 1.5, 2.3, 3.3, 4.1, 4.2, 4.3に対応
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ProcessingReceiptData, ProcessedReceiptData, AccountAssignment, TaxAssignment, DepartmentAssignment } from '@/types/rules';
import { UserProfile } from '@/types/auth';
import { useRuleApplication } from '../hooks/useRuleApplication';

interface IndividualRuleResult {
  account?: AccountAssignment | null;
  tax?: TaxAssignment;
  department?: DepartmentAssignment;
  description?: string | null;
  errors: string[];
}

interface RuleApplicationTesterProps {
  companyId: string;
  userProfile?: UserProfile;
}

export function RuleApplicationTester({ companyId, userProfile }: RuleApplicationTesterProps) {
  const {
    isProcessing,
    error,
    processReceipt,
    previewRuleApplication,
    clearError,
    reset,
  } = useRuleApplication({ companyId, userProfile });

  // テスト用の領収書データ
  const [testReceiptData, setTestReceiptData] = useState<ProcessingReceiptData>({
    id: 'test-receipt-001',
    merchant: 'JR東日本',
    accountCode: '726', // 旅費交通費
    amount: 1100,
    taxAmount: 100,
    taxRate: 0.10,
    date: new Date(),
    description: '旅費交通費代 JR東日本',
    invoiceCompliant: true,
    userId: userProfile?.id || 'test-user',
    departmentCode: userProfile?.departmentId || '3',
  });

  // プレビュー結果
  const [previewResult, setPreviewResult] = useState<IndividualRuleResult | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessedReceiptData | null>(null);

  /**
   * テストデータの更新
   */
  const updateTestData = useCallback((field: keyof ProcessingReceiptData, value: unknown) => {
    setTestReceiptData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * プレビュー実行
   */
  const handlePreview = useCallback(async () => {
    try {
      clearError();
      const result = await previewRuleApplication(testReceiptData);
      setPreviewResult(result);
    } catch (error) {
      console.error('プレビューエラー:', error);
    }
  }, [testReceiptData, previewRuleApplication, clearError]);

  /**
   * 完全処理実行
   */
  const handleProcess = useCallback(async () => {
    try {
      clearError();
      const result = await processReceipt(testReceiptData);
      setProcessedResult(result);
    } catch (error) {
      console.error('処理エラー:', error);
    }
  }, [testReceiptData, processReceipt, clearError]);

  /**
   * リセット
   */
  const handleReset = useCallback(() => {
    reset();
    setPreviewResult(null);
    setProcessedResult(null);
  }, [reset]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        ルール適用テスター
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        領収書データに対するルール適用をテスト・プレビューできます
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* テストデータ入力 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                テストデータ
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="取引先"
                    value={testReceiptData.merchant}
                    onChange={(e) => updateTestData('merchant', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>勘定科目</InputLabel>
                    <Select
                      value={testReceiptData.accountCode || ''}
                      onChange={(e) => updateTestData('accountCode', e.target.value)}
                    >
                      <MenuItem value="724">724 - 福利厚生費</MenuItem>
                      <MenuItem value="726">726 - 旅費交通費</MenuItem>
                      <MenuItem value="727">727 - 通信費</MenuItem>
                      <MenuItem value="729">729 - 車両費</MenuItem>
                      <MenuItem value="731">731 - 運賃</MenuItem>
                      <MenuItem value="733">733 - 交際接待費</MenuItem>
                      <MenuItem value="734">734 - 会議費</MenuItem>
                      <MenuItem value="737">737 - 消耗品費</MenuItem>
                      <MenuItem value="738">738 - 租税公課</MenuItem>
                      <MenuItem value="754">754 - 事務用消耗品費</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="金額"
                    type="number"
                    value={testReceiptData.amount}
                    onChange={(e) => updateTestData('amount', Number(e.target.value))}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>税率</InputLabel>
                    <Select
                      value={testReceiptData.taxRate || 0.10}
                      onChange={(e) => updateTestData('taxRate', Number(e.target.value))}
                    >
                      <MenuItem value={0.10}>10%</MenuItem>
                      <MenuItem value={0.08}>8%</MenuItem>
                      <MenuItem value={0}>0%</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={testReceiptData.invoiceCompliant || false}
                        onChange={(e) => updateTestData('invoiceCompliant', e.target.checked)}
                      />
                    }
                    label="インボイス対応"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="摘要"
                    value={testReceiptData.description || ''}
                    onChange={(e) => updateTestData('description', e.target.value)}
                    helperText="PCA形式: [○○代　ABC株式会社]"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="税額"
                    type="number"
                    value={testReceiptData.taxAmount || 0}
                    onChange={(e) => updateTestData('taxAmount', Number(e.target.value))}
                    helperText="消費税額（PCAでは空欄になります）"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>部門コード</InputLabel>
                    <Select
                      value={testReceiptData.departmentCode || ''}
                      onChange={(e) => updateTestData('departmentCode', e.target.value)}
                    >
                      <MenuItem value="1">1 - 札幌支店</MenuItem>
                      <MenuItem value="2">2 - 仙台事業所</MenuItem>
                      <MenuItem value="3">3 - 東京支店</MenuItem>
                      <MenuItem value="4">4 - 福岡事業所</MenuItem>
                      <MenuItem value="5">5 - 大阪事業所</MenuItem>
                      <MenuItem value="6">6 - 名古屋事務所</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {/* プリセットテストシナリオ */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  テストシナリオ
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setTestReceiptData({
                      id: 'test-001',
                      merchant: 'JR東日本',
                      accountCode: '726',
                      amount: 1100,
                      taxAmount: 100,
                      taxRate: 0.10,
                      date: new Date(),
                      description: '旅費交通費代 JR東日本',
                      invoiceCompliant: true,
                      userId: userProfile?.id || 'test-user',
                      departmentCode: '3',
                    })}
                  >
                    旅費交通費
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setTestReceiptData({
                      id: 'test-002',
                      merchant: 'エネオス',
                      accountCode: '729',
                      amount: 5500,
                      taxAmount: 500,
                      taxRate: 0.10,
                      date: new Date(),
                      description: '車両費代 エネオス',
                      invoiceCompliant: true,
                      userId: userProfile?.id || 'test-user',
                      departmentCode: '1',
                    })}
                  >
                    車両費（インボイス有）
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setTestReceiptData({
                      id: 'test-003',
                      merchant: '個人商店',
                      accountCode: '729',
                      amount: 3300,
                      taxAmount: 300,
                      taxRate: 0.10,
                      date: new Date(),
                      description: '車両費代 個人商店',
                      invoiceCompliant: false,
                      userId: userProfile?.id || 'test-user',
                      departmentCode: '2',
                    })}
                  >
                    車両費（インボイス無）
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setTestReceiptData({
                      id: 'test-004',
                      merchant: '○○市役所',
                      accountCode: '738',
                      amount: 10000,
                      taxAmount: 0,
                      taxRate: 0,
                      date: new Date(),
                      description: '租税公課代 ○○市役所',
                      invoiceCompliant: false,
                      userId: userProfile?.id || 'test-user',
                      departmentCode: '5',
                    })}
                  >
                    租税公課
                  </Button>
                </Box>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={handlePreview}
                  disabled={isProcessing}
                >
                  プレビュー
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleProcess}
                  disabled={isProcessing}
                >
                  完全処理
                </Button>
                <Button
                  variant="text"
                  startIcon={<RefreshIcon />}
                  onClick={handleReset}
                  disabled={isProcessing}
                >
                  リセット
                </Button>
              </Box>
              
              {isProcessing && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2">処理中...</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 結果表示 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                処理結果
              </Typography>
              
              {/* プレビュー結果 */}
              {previewResult && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>プレビュー結果</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ mb: 2 }}>
                      {previewResult.errors.length > 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2">エラー:</Typography>
                          {previewResult.errors.map((error: string, index: number) => (
                            <Typography key={index} variant="body2">• {error}</Typography>
                          ))}
                        </Alert>
                      )}
                      
                      {previewResult.account && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>勘定科目割り当て</Typography>
                          <Chip label={`借方: ${previewResult.account.debitAccountCode} ${previewResult.account.debitAccountName}`} sx={{ mr: 1, mb: 1 }} />
                          <Chip label={`貸方: ${previewResult.account.creditAccountCode} ${previewResult.account.creditAccountName}`} sx={{ mr: 1, mb: 1 }} />
                          <Typography variant="caption" display="block">
                            信頼度: {Math.round((previewResult.account.confidence || 0) * 100)}%
                          </Typography>
                        </Box>
                      )}
                      
                      {previewResult.tax && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>税区分</Typography>
                          <Chip label={`借方: ${previewResult.tax.debitTaxCode} ${previewResult.tax.debitTaxName}`} sx={{ mr: 1, mb: 1 }} />
                          <Chip label={`貸方: ${previewResult.tax.creditTaxCode} ${previewResult.tax.creditTaxName}`} sx={{ mr: 1, mb: 1 }} />
                        </Box>
                      )}
                      
                      {previewResult.department && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>部門・現金補助科目</Typography>
                          <Chip label={`部門: ${previewResult.department.departmentCode} ${previewResult.department.departmentName}`} sx={{ mr: 1, mb: 1 }} />
                          <Chip label={`現金補助: ${previewResult.department.cashAuxiliaryCode} ${previewResult.department.cashAuxiliaryName}`} sx={{ mr: 1, mb: 1 }} />
                        </Box>
                      )}
                      
                      {previewResult.description && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>生成摘要</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                            {previewResult.description}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
              
              {/* 完全処理結果 */}
              {processedResult && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>完全処理結果</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>PCA出力形式</Typography>
                      <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                        <div><strong>伝票日付:</strong> {processedResult.formattedData?.date} (YYYYMMDD形式)</div>
                        <div><strong>摘要:</strong> {processedResult.formattedData?.description}</div>
                        <div><strong>入力プログラム区分:</strong> {processedResult.formattedData?.programClassification} (固定値)</div>
                        <hr style={{ margin: '8px 0', border: '1px solid #ddd' }} />
                        <div><strong>借方勘定科目:</strong> {processedResult.accountAssignment?.debitAccountCode} {processedResult.accountAssignment?.debitAccountName}</div>
                        <div><strong>借方補助科目:</strong> {processedResult.accountAssignment?.debitSubAccountCode || '(空欄)'} {processedResult.accountAssignment?.debitSubAccountName || ''}</div>
                        <div><strong>借方税区分:</strong> {processedResult.taxAssignment?.debitTaxCode} ({processedResult.taxAssignment?.debitTaxName})</div>
                        <div><strong>借方金額:</strong> ¥{testReceiptData.amount.toLocaleString()} (税込)</div>
                        <div><strong>借方消費税額:</strong> (空欄) ※内税計算モード</div>
                        <div><strong>借方部門:</strong> {processedResult.departmentAssignment?.departmentCode}</div>
                        <hr style={{ margin: '8px 0', border: '1px solid #ddd' }} />
                        <div><strong>貸方勘定科目:</strong> {processedResult.accountAssignment?.creditAccountCode} {processedResult.accountAssignment?.creditAccountName}</div>
                        <div><strong>貸方補助科目:</strong> {processedResult.departmentAssignment?.cashAuxiliaryCode} {processedResult.departmentAssignment?.cashAuxiliaryName}</div>
                        <div><strong>貸方税区分:</strong> {processedResult.taxAssignment?.creditTaxCode} ({processedResult.taxAssignment?.creditTaxName})</div>
                        <div><strong>貸方金額:</strong> ¥{testReceiptData.amount.toLocaleString()} (税込)</div>
                        <div><strong>貸方消費税額:</strong> (空欄) ※内税計算モード</div>
                        <div><strong>貸方部門:</strong> {processedResult.departmentAssignment?.departmentCode}</div>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
              
              {!previewResult && !processedResult && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  プレビューまたは処理を実行してください
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}