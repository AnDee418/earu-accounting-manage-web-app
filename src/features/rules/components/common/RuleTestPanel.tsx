'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Paper,
  Alert,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import {
  PlayArrow as TestIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

import { 
  AccountAssignmentRule, 
  TaxAssignmentRule,
  TestResult,
  ReceiptData 
} from '@/types/rules';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type RuleType = 'account-assignment' | 'tax-assignment';
type Rule = AccountAssignmentRule | TaxAssignmentRule;

interface RuleTestPanelProps {
  open: boolean;
  onClose: () => void;
  rule: any | null;
  ruleType: RuleType;
  onTest: (rule: any, testData: ReceiptData[]) => Promise<TestResult>;
}

export default function RuleTestPanel({
  open,
  onClose,
  rule,
  ruleType,
  onTest,
}: RuleTestPanelProps) {
  const [testData, setTestData] = useState<string>('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleTest = async () => {
    if (!rule || !testData.trim()) {
      setError('ルールとテストデータが必要です');
      return;
    }

    setTesting(true);
    setError('');
    setTestResult(null);

    try {
      // Parse test data (expecting JSON format)
      const parsedTestData: ReceiptData[] = JSON.parse(testData);
      const result = await onTest(rule, parsedTestData);
      setTestResult(result);
    } catch (err) {
      setError('テストデータの形式が正しくありません。JSON形式で入力してください。');
      console.error('Test failed:', err);
    } finally {
      setTesting(false);
    }
  };

  const handleClose = () => {
    setTestData('');
    setTestResult(null);
    setError('');
    onClose();
  };

  const getSampleTestData = () => {
    switch (ruleType) {
      case 'account-assignment':
        return JSON.stringify([
          {
            id: 'test-1',
            merchant: 'JR東日本',
            amount: 1500,
            category: 'transportation',
            description: '電車代',
            date: '2024-01-15',
            keywords: ['電車', '交通費']
          },
          {
            id: 'test-2',
            merchant: 'スターバックス',
            amount: 800,
            category: 'meals',
            description: 'コーヒー代',
            date: '2024-01-15',
            keywords: ['コーヒー', '飲食']
          }
        ], null, 2);
      case 'tax-assignment':
        return JSON.stringify([
          {
            id: 'test-1',
            merchant: 'コンビニエンスストア',
            amount: 1080,
            taxRate: 0.10,
            invoiceCompliant: true,
            accountCode: '726',
            category: 'office_supplies'
          },
          {
            id: 'test-2',
            merchant: 'レストラン',
            amount: 2160,
            taxRate: 0.08,
            invoiceCompliant: false,
            accountCode: '638',
            category: 'meals'
          }
        ], null, 2);
      default:
        return '';
    }
  };

  const renderTestResult = () => {
    if (!testResult) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Divider sx={{ mb: 2 }}>
          <Typography variant="caption">テスト結果</Typography>
        </Divider>
        
        <Alert 
          severity={testResult.success ? 'success' : 'error'} 
          icon={testResult.success ? <SuccessIcon /> : <ErrorIcon />}
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle2">
            {testResult.success ? 'テスト成功' : 'テスト失敗'}
          </Typography>
          <Typography variant="body2">
            処理件数: {testResult.processedCount} / 成功: {testResult.successCount} / 失敗: {testResult.failureCount}
          </Typography>
        </Alert>

        {testResult.results && testResult.results.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              詳細結果
            </Typography>
            <Stack spacing={1}>
              {testResult.results.map((result, index) => (
                <Paper key={index} sx={{ p: 2 }} variant="outlined">
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="caption" color="text.secondary">
                        入力データ
                      </Typography>
                      <Typography variant="body2">
                        {result.input.merchant} - ¥{result.input.amount?.toLocaleString()}
                      </Typography>
                      {result.input.category && (
                        <Chip label={result.input.category} size="small" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="caption" color="text.secondary">
                        適用結果
                      </Typography>
                      {result.matched ? (
                        <Box>
                          <Chip label="マッチ" color="success" size="small" />
                          {ruleType === 'account-assignment' && result.assignment && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              借方: {result.assignment.debitAccountCode} / 
                              貸方: {result.assignment.creditAccountCode}
                            </Typography>
                          )}
                          {ruleType === 'tax-assignment' && result.taxAssignment && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              借方税区分: {result.taxAssignment.debitTaxCode} / 
                              貸方税区分: {result.taxAssignment.creditTaxCode}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Box>
                          <Chip label="非マッチ" color="default" size="small" />
                          {result.reason && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              理由: {result.reason}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {testResult.errors && testResult.errors.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="error" gutterBottom>
              エラー
            </Typography>
            <Stack spacing={1}>
              {testResult.errors.map((error, index) => (
                <Alert key={index} severity="error" variant="outlined">
                  {error}
                </Alert>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        ルールテスト - {rule?.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            テストデータをJSON形式で入力してルールの動作を確認できます。
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 400 }}>
              <Typography variant="subtitle2" gutterBottom>
                テストデータ (JSON形式)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={12}
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                placeholder={getSampleTestData()}
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
              <Button
                size="small"
                onClick={() => setTestData(getSampleTestData())}
                sx={{ mt: 1 }}
              >
                サンプルデータを使用
              </Button>
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 400 }}>
              <Typography variant="subtitle2" gutterBottom>
                ルール情報
              </Typography>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="body2">
                  <strong>ルール名:</strong> {rule?.name}
                </Typography>
                {rule?.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>説明:</strong> {rule.description}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>優先度:</strong> {rule?.priority}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>状態:</strong> 
                  <Chip 
                    label={rule?.isActive ? '有効' : '無効'} 
                    size="small" 
                    color={rule?.isActive ? 'success' : 'default'}
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Paper>

              {renderTestResult()}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {testing && (
            <Box sx={{ mt: 2 }}>
              <LoadingSpinner message="テスト実行中..." />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>閉じる</Button>
        <Button
          onClick={handleTest}
          variant="contained"
          startIcon={<TestIcon />}
          disabled={testing || !testData.trim()}
        >
          {testing ? 'テスト中...' : 'テスト実行'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}