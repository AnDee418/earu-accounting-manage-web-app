import { ConditionBlock, AmountRange } from '@/types/rules';
import { CONDITION_TYPES } from '../components/puzzle/ConditionPalette';

/**
 * 条件値をフォーマットする関数
 * 
 * Requirements: 3.1, 3.2
 * - 条件ブロックから自然言語への変換ロジック
 */
export const formatConditionValues = (condition: ConditionBlock): string => {
  // デバッグ用ログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('formatConditionValues:', {
      type: condition.type,
      values: condition.values,
      valuesType: typeof condition.values,
      isArray: Array.isArray(condition.values),
    });
  }

  // 値が未設定の場合
  if (!condition.values) {
    return '未設定';
  }

  // 配列の場合の空チェック
  if (Array.isArray(condition.values) && condition.values.length === 0) {
    return '未設定';
  }

  switch (condition.type) {
    case 'expenseType':
    case 'merchant':
    case 'keyword':
      if (Array.isArray(condition.values)) {
        const tags = condition.values.filter(tag => tag && tag.trim() !== '');
        return tags.length > 0 ? tags.join(', ') : '未設定';
      }
      return '未設定';
    
    case 'amount':
      if (!Array.isArray(condition.values)) {
        const range = condition.values as AmountRange;
        if (range && typeof range === 'object') {
          if (range.min !== undefined && range.max !== undefined) {
            return `${range.min.toLocaleString()}円〜${range.max.toLocaleString()}円`;
          } else if (range.min !== undefined) {
            return `${range.min.toLocaleString()}円以上`;
          } else if (range.max !== undefined) {
            return `${range.max.toLocaleString()}円以下`;
          }
        }
      }
      return '金額範囲未設定';
    
    case 'receiptContent':
      if (Array.isArray(condition.values)) {
        const patterns = condition.values.filter(pattern => pattern && pattern.trim() !== '');
        return patterns.length > 0 ? patterns.join(', ') : '未設定';
      }
      return '未設定';
    
    default:
      if (Array.isArray(condition.values)) {
        return condition.values.join(', ');
      }
      return String(condition.values);
  }
};

/**
 * 論理演算子の日本語表示を取得
 * 
 * Requirements: 3.1, 3.3
 */
export const getOperatorLabel = (operator: string): string => {
  switch (operator) {
    case 'AND':
      return 'かつ';
    case 'OR':
      return 'または';
    default:
      return operator;
  }
};

/**
 * 論理演算子の色を取得
 * 
 * Requirements: 3.3
 */
export const getOperatorColor = (operator: string): string => {
  switch (operator) {
    case 'AND':
      return '#4CAF50'; // 緑色
    case 'OR':
      return '#FF9800'; // オレンジ色
    default:
      return '#757575';
  }
};

/**
 * 自然言語の生成
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 * - 条件ブロックから自然言語への変換ロジック
 * - リアルタイムでのプレビュー更新機能
 * - 複雑な条件組み合わせの読みやすい表示
 */
export const generateNaturalLanguage = (conditions: ConditionBlock[]): string => {
  if (conditions.length === 0) {
    return '条件が設定されていません';
  }

  return conditions.map((condition, index) => {
    const typeConfig = CONDITION_TYPES[condition.type];
    const typeLabel = typeConfig?.label || condition.type;
    const values = formatConditionValues(condition);
    
    // 最後の条件でない場合は演算子を追加
    const connector = index < conditions.length - 1 
      ? ` ${getOperatorLabel(condition.operator)} ` 
      : '';
    
    return `${typeLabel} (${values})${connector}`;
  }).join('');
};

/**
 * 条件の完成度をチェック
 * 
 * Requirements: 3.4
 */
export const checkCompletionStatus = (conditions: ConditionBlock[]) => {
  const totalConditions = conditions.length;
  const completedConditions = conditions.filter(condition => {
    if (!condition.values) return false;
    
    // 配列タイプの条件（expenseType, merchant, keyword, receiptContent）
    if (Array.isArray(condition.values)) {
      const validValues = condition.values.filter(value => value && value.trim() !== '');
      return validValues.length > 0;
    }
    
    // 金額範囲タイプの条件
    if (condition.type === 'amount') {
      const range = condition.values as AmountRange;
      return range && (range.min !== undefined || range.max !== undefined);
    }
    
    return true;
  }).length;

  return {
    total: totalConditions,
    completed: completedConditions,
    percentage: totalConditions > 0 ? Math.round((completedConditions / totalConditions) * 100) : 0,
    isComplete: totalConditions > 0 && completedConditions === totalConditions,
  };
};