'use client';

import React from 'react';
import { Box } from '@mui/material';

import { ConditionBlock } from '@/types/rules';
import { CONDITION_TYPES } from '../ConditionPalette';
import TagInput from './TagInput';
import AmountRangeInput from './AmountRangeInput';
import TextInput from './TextInput';

interface ConditionInputProps {
  condition: ConditionBlock;
  onUpdate: (id: string, updates: Partial<ConditionBlock>) => void;
  readOnly?: boolean;
}

/**
 * 条件値入力コンポーネント
 * 
 * Requirements: 2.1, 5.4
 * - 経費種別・取引先・摘要キーワード用のタグ入力フィールドを実装
 * - 金額範囲用の最小・最大金額入力フィールドを実装
 * - 領収書内容用のテキスト入力フィールドを実装
 * - オートコンプリート機能と例示データの表示を実装
 */
export default function ConditionInput({
  condition,
  onUpdate,
  readOnly = false,
}: ConditionInputProps) {
  const conditionType = CONDITION_TYPES[condition.type];
  
  if (!conditionType) {
    return null;
  }

  // 値更新ハンドラー
  const handleValueChange = (values: string[] | { min?: number; max?: number }) => {
    onUpdate(condition.id, { values });
  };

  // 条件タイプに応じた入力コンポーネントを表示
  switch (conditionType.inputType) {
    case 'tags':
      return (
        <Box sx={{ width: '100%' }}>
          <TagInput
            values={Array.isArray(condition.values) ? condition.values : []}
            onChange={handleValueChange}
            placeholder={`${conditionType.label}を入力...`}
            suggestions={conditionType.examples}
            readOnly={readOnly}
            color={conditionType.color}
            helperText={`例: ${conditionType.examples.slice(0, 2).join('、')}`}
          />
        </Box>
      );

    case 'range':
      return (
        <Box sx={{ width: '100%' }}>
          <AmountRangeInput
            value={!Array.isArray(condition.values) ? condition.values : { min: undefined, max: undefined }}
            onChange={handleValueChange}
            readOnly={readOnly}
            color={conditionType.color}
          />
        </Box>
      );

    case 'text':
      return (
        <Box sx={{ width: '100%' }}>
          <TextInput
            value={Array.isArray(condition.values) ? condition.values[0] || '' : ''}
            onChange={(value) => handleValueChange([value])}
            placeholder={`${conditionType.label}を入力...`}
            suggestions={conditionType.examples}
            readOnly={readOnly}
            color={conditionType.color}
            helperText="正規表現パターンを入力できます"
          />
        </Box>
      );

    default:
      return null;
  }
}