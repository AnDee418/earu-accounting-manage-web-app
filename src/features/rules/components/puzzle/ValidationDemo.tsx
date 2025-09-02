'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ConditionBlock } from '@/types/rules';
import { validateConditionBlock, validateConditionBlocks } from '../../utils/puzzleValidation';
import ValidationDisplay from './ValidationDisplay';

/**
 * バリデーション機能のデモコンポーネント
 * 
 * Requirements: 設計書のValidation Rules
 * - 条件ブロックのリアルタイムバリデーション
 * - エラー状態の視覚的表示
 * - 具体的なエラーメッセージ表示
 * - 金額範囲の論理チェック機能
 */
export default function ValidationDemo() {
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    condition: ConditionBlock | ConditionBlock[];
    result: any;
  }>>([]);

  const runValidationTests = () => {
    const results = [];

    // テスト1: 正常な経費種別条件
    const validExpenseCondition: ConditionBlock = {
      id: 'test-1',
      type: 'expenseType',
      operator: 'AND',
      values: ['駐車場代', '交通費'],
      label: '経費種別',
      description: '正常な経費種別条件',
      validation: { required: true, minValues: 1, maxValues: 10 },
    };
    
    const result1 = validateConditionBlock(validExpenseCondition);
    results.push({
      name: '正常な経費種別条件',
      condition: validExpenseCondition,
      result: result1,
    });

    // テスト2: 空の経費種別条件（エラー）
    const emptyExpenseCondition: ConditionBlock = {
      id: 'test-2',
      type: 'expenseType',
      operator: 'AND',
      values: [],
      label: '経費種別',
      description: '空の経費種別条件',
      validation: { required: true, minValues: 1, maxValues: 10 },
    };
    
    const result2 = validateConditionBlock(emptyExpenseCondition);
    results.push({
      name: '空の経費種別条件（エラー）',
      condition: emptyExpenseCondition,
      result: result2,
    });

    // テスト3: 正常な金額範囲条件
    const validAmountCondition: ConditionBlock = {
      id: 'test-3',
      type: 'amount',
      operator: 'AND',
      values: { min: 1000, max: 5000, currency: 'JPY' },
      label: '金額範囲',
      description: '正常な金額範囲条件',
      validation: { required: true, minValues: 1, maxValues: 1 },
    };
    
    const result3 = validateConditionBlock(validAmountCondition);
    results.push({
      name: '正常な金額範囲条件',
      condition: validAmountCondition,
      result: result3,
    });

    // テスト4: 無効な金額範囲条件（最小 > 最大）
    const invalidAmountCondition: ConditionBlock = {
      id: 'test-4',
      type: 'amount',
      operator: 'AND',
      values: { min: 5000, max: 1000, currency: 'JPY' },
      label: '金額範囲',
      description: '無効な金額範囲条件',
      validation: { required: true, minValues: 1, maxValues: 1 },
    };
    
    const result4 = validateConditionBlock(invalidAmountCondition);
    results.push({
      name: '無効な金額範囲条件（最小 > 最大）',
      condition: invalidAmountCondition,
      result: result4,
    });

    // テスト5: 複数条件のバリデーション
    const multipleConditions = [validExpenseCondition, validAmountCondition];
    const result5 = validateConditionBlocks(multipleConditions);
    results.push({
      name: '複数条件のバリデーション（正常）',
      condition: multipleConditions,
      result: result5,
    });

    // テスト6: 空の条件配列
    const result6 = validateConditionBlocks([]);
    results.push({
      name: '空の条件配列（エラー）',
      condition: [],
      result: result6,
    });

    setTestResults(results);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        バリデーション機能デモ
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        パズルルールビルダーのバリデーション機能をテストします。
      </Typography>

      <Button 
        variant="contained" 
        onClick={runValidationTests}
        sx={{ mb: 3 }}
      >
        バリデーションテスト実行
      </Button>

      {testResults.map((test, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {test.name}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            条件: {JSON.stringify(test.condition, null, 2)}
          </Typography>
          
          <ValidationDisplay
            validationResult={test.result}
            showDetails={true}
            compact={false}
          />
          
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            結果: {JSON.stringify(test.result, null, 2)}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}