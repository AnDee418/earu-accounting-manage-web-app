import { 
  ConditionBlock, 
  AmountRange,
  ValidationError,
  ValidationResult 
} from '@/types/rules';

/**
 * パズルルールビルダー専用バリデーションユーティリティ
 * 
 * Requirements: 設計書のValidation Rules
 * - 条件ブロックのリアルタイムバリデーション
 * - 具体的なエラーメッセージ表示
 * - 金額範囲の論理チェック機能
 */

// バリデーションルールの定義
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom' | 'amountRange';
  message: string;
  validator?: (value: any, condition?: ConditionBlock) => boolean;
  severity?: 'error' | 'warning' | 'info';
}

// 条件タイプ別バリデーションルール
export const VALIDATION_RULES: Record<string, ValidationRule[]> = {
  expenseType: [
    {
      type: 'required',
      message: '経費種別を1つ以上入力してください',
      severity: 'error'
    },
    {
      type: 'minLength',
      message: '経費種別は2文字以上で入力してください',
      validator: (values: string[]) => values.every(v => v.length >= 2),
      severity: 'error'
    },
    {
      type: 'maxLength',
      message: '経費種別は50文字以下で入力してください',
      validator: (values: string[]) => values.every(v => v.length <= 50),
      severity: 'error'
    },
    {
      type: 'custom',
      message: '経費種別に無効な文字が含まれています',
      validator: (values: string[]) => values.every(v => /^[a-zA-Z0-9ひらがなカタカナ漢字\s\-_]+$/.test(v)),
      severity: 'warning'
    }
  ],
  merchant: [
    {
      type: 'required',
      message: '取引先を1つ以上入力してください',
      severity: 'error'
    },
    {
      type: 'minLength',
      message: '取引先名は2文字以上で入力してください',
      validator: (values: string[]) => values.every(v => v.length >= 2),
      severity: 'error'
    },
    {
      type: 'maxLength',
      message: '取引先名は100文字以下で入力してください',
      validator: (values: string[]) => values.every(v => v.length <= 100),
      severity: 'error'
    },
    {
      type: 'pattern',
      message: '取引先名に正規表現パターンを使用する場合は正しい形式で入力してください',
      validator: (values: string[]) => {
        return values.every(v => {
          // 正規表現パターンかどうかをチェック
          if (v.includes('.*') || v.includes('^') || v.includes('$') || v.includes('[') || v.includes(']')) {
            try {
              new RegExp(v);
              return true;
            } catch {
              return false;
            }
          }
          return true;
        });
      },
      severity: 'error'
    }
  ],
  keyword: [
    {
      type: 'required',
      message: '摘要キーワードを1つ以上入力してください',
      severity: 'error'
    },
    {
      type: 'minLength',
      message: 'キーワードは1文字以上で入力してください',
      validator: (values: string[]) => values.every(v => v.length >= 1),
      severity: 'error'
    },
    {
      type: 'maxLength',
      message: 'キーワードは30文字以下で入力してください',
      validator: (values: string[]) => values.every(v => v.length <= 30),
      severity: 'error'
    }
  ],
  amount: [
    {
      type: 'required',
      message: '最小金額または最大金額のいずれかを入力してください',
      validator: (range: AmountRange) => range.min !== undefined || range.max !== undefined,
      severity: 'error'
    },
    {
      type: 'amountRange',
      message: '最小金額は最大金額より小さくしてください',
      validator: (range: AmountRange) => {
        if (range.min !== undefined && range.max !== undefined) {
          return range.min < range.max;
        }
        return true;
      },
      severity: 'error'
    },
    {
      type: 'custom',
      message: '金額は0以上で入力してください',
      validator: (range: AmountRange) => {
        const minValid = range.min === undefined || range.min >= 0;
        const maxValid = range.max === undefined || range.max >= 0;
        return minValid && maxValid;
      },
      severity: 'error'
    },
    {
      type: 'custom',
      message: '金額は1,000,000,000円以下で入力してください',
      validator: (range: AmountRange) => {
        const minValid = range.min === undefined || range.min <= 1000000000;
        const maxValid = range.max === undefined || range.max <= 1000000000;
        return minValid && maxValid;
      },
      severity: 'warning'
    },
    {
      type: 'custom',
      message: '最小金額と最大金額が同じ値です。範囲を指定してください',
      validator: (range: AmountRange) => {
        if (range.min !== undefined && range.max !== undefined) {
          return range.min !== range.max;
        }
        return true;
      },
      severity: 'warning'
    }
  ],
  receiptContent: [
    {
      type: 'required',
      message: '領収書内容パターンを入力してください',
      severity: 'error'
    },
    {
      type: 'minLength',
      message: '領収書内容パターンは3文字以上で入力してください',
      validator: (values: string[]) => values.every(v => v.length >= 3),
      severity: 'error'
    },
    {
      type: 'pattern',
      message: '正規表現パターンが正しくありません',
      validator: (values: string[]) => {
        return values.every(v => {
          try {
            new RegExp(v);
            return true;
          } catch {
            return false;
          }
        });
      },
      severity: 'error'
    },
    {
      type: 'custom',
      message: '危険な正規表現パターンが含まれています（ReDoS攻撃の可能性）',
      validator: (values: string[]) => {
        // 危険なパターンをチェック（簡易版）
        const dangerousPatterns = [
          /\(\?\=.*\)\+/,  // 先読みアサーション + 量詞
          /\(\?\!.*\)\+/,  // 否定先読み + 量詞
          /\(\?\<\=.*\)\+/, // 後読みアサーション + 量詞
          /\(\?\<\!.*\)\+/, // 否定後読み + 量詞
          /\(\.\*\)\+/,    // .* + 量詞
          /\(\.\+\)\+/,    // .+ + 量詞
        ];
        
        return values.every(v => {
          return !dangerousPatterns.some(pattern => pattern.test(v));
        });
      },
      severity: 'warning'
    }
  ]
};

/**
 * 単一条件ブロックのバリデーション
 */
export const validateConditionBlock = (condition: ConditionBlock): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const suggestions: string[] = [];

  const rules = VALIDATION_RULES[condition.type] || [];

  rules.forEach((rule, ruleIndex) => {
    let isValid = true;
    const values = condition.values;

    switch (rule.type) {
      case 'required':
        if (Array.isArray(values)) {
          isValid = values.length > 0 && values.some(v => v.trim().length > 0);
        } else {
          const range = values as AmountRange;
          isValid = range.min !== undefined || range.max !== undefined;
        }
        break;

      case 'minLength':
      case 'maxLength':
      case 'pattern':
      case 'custom':
      case 'amountRange':
        if (rule.validator) {
          isValid = rule.validator(values, condition);
        }
        break;
    }

    if (!isValid) {
      const error: ValidationError = {
        code: `${condition.type.toUpperCase()}_${rule.type.toUpperCase()}_${ruleIndex}`,
        message: rule.message,
        field: condition.id,
        severity: rule.severity || 'error',
        context: {
          conditionType: condition.type,
          conditionLabel: condition.label,
          ruleType: rule.type,
          values: values
        }
      };

      if (rule.severity === 'warning') {
        warnings.push(error);
      } else {
        errors.push(error);
      }
    }
  });

  // 条件タイプ別の提案を生成
  if (errors.length === 0 && warnings.length === 0) {
    suggestions.push(...generateSuggestions(condition));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

/**
 * 複数条件ブロックのバリデーション
 */
export const validateConditionBlocks = (conditions: ConditionBlock[]): ValidationResult => {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  const allSuggestions: string[] = [];

  // 条件ブロックが空の場合
  if (conditions.length === 0) {
    allErrors.push({
      code: 'NO_CONDITIONS',
      message: '条件ブロックを1つ以上追加してください',
      severity: 'error',
      context: { conditionCount: 0 }
    });
    return {
      isValid: false,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: ['条件パレットから条件ブロックを追加してください']
    };
  }

  // 各条件ブロックのバリデーション
  conditions.forEach((condition, index) => {
    const result = validateConditionBlock(condition);
    
    // エラーメッセージにブロック番号を追加
    result.errors.forEach(error => {
      allErrors.push({
        ...error,
        message: `条件${index + 1}: ${error.message}`,
        context: { ...error.context, blockIndex: index }
      });
    });

    result.warnings.forEach(warning => {
      allWarnings.push({
        ...warning,
        message: `条件${index + 1}: ${warning.message}`,
        context: { ...warning.context, blockIndex: index }
      });
    });

    allSuggestions.push(...result.suggestions);
  });

  // 条件ブロック間の関係性チェック
  const relationshipValidation = validateConditionRelationships(conditions);
  allErrors.push(...relationshipValidation.errors);
  allWarnings.push(...relationshipValidation.warnings);
  allSuggestions.push(...relationshipValidation.suggestions);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    suggestions: allSuggestions
  };
};

/**
 * 条件ブロック間の関係性バリデーション
 */
const validateConditionRelationships = (conditions: ConditionBlock[]): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const suggestions: string[] = [];

  // 重複チェック
  const duplicateCheck = checkDuplicateConditions(conditions);
  warnings.push(...duplicateCheck.warnings);
  suggestions.push(...duplicateCheck.suggestions);

  // 論理演算子の妥当性チェック
  const logicalCheck = checkLogicalOperators(conditions);
  warnings.push(...logicalCheck.warnings);
  suggestions.push(...logicalCheck.suggestions);

  // 条件の複雑さチェック
  const complexityCheck = checkConditionComplexity(conditions);
  warnings.push(...complexityCheck.warnings);
  suggestions.push(...complexityCheck.suggestions);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

/**
 * 重複条件のチェック
 */
const checkDuplicateConditions = (conditions: ConditionBlock[]): ValidationResult => {
  const warnings: ValidationError[] = [];
  const suggestions: string[] = [];

  // 同じタイプの条件が複数ある場合の警告
  const typeCount = conditions.reduce((acc, condition) => {
    acc[condition.type] = (acc[condition.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(typeCount).forEach(([type, count]) => {
    if (count > 1) {
      warnings.push({
        code: 'DUPLICATE_CONDITION_TYPE',
        message: `${conditions.find(c => c.type === type)?.label}の条件が${count}個あります`,
        severity: 'warning',
        context: { conditionType: type, count }
      });
      suggestions.push(`${conditions.find(c => c.type === type)?.label}の条件を統合することを検討してください`);
    }
  });

  return {
    isValid: true,
    errors: [],
    warnings,
    suggestions
  };
};

/**
 * 論理演算子の妥当性チェック
 */
const checkLogicalOperators = (conditions: ConditionBlock[]): ValidationResult => {
  const warnings: ValidationError[] = [];
  const suggestions: string[] = [];

  if (conditions.length > 1) {
    const andCount = conditions.filter(c => c.operator === 'AND').length;
    const orCount = conditions.filter(c => c.operator === 'OR').length;

    // すべてORの場合の警告
    if (orCount === conditions.length - 1 && andCount === 0) {
      warnings.push({
        code: 'ALL_OR_CONDITIONS',
        message: 'すべての条件がOR接続されています。意図した動作か確認してください',
        severity: 'warning',
        context: { andCount, orCount }
      });
      suggestions.push('OR条件は「どれか1つでも満たせば適用」という意味です');
    }

    // 複雑な組み合わせの場合の提案
    if (andCount > 0 && orCount > 0) {
      suggestions.push('ANDとORが混在しています。プレビューで動作を確認してください');
    }
  }

  return {
    isValid: true,
    errors: [],
    warnings,
    suggestions
  };
};

/**
 * 条件の複雑さチェック
 */
const checkConditionComplexity = (conditions: ConditionBlock[]): ValidationResult => {
  const warnings: ValidationError[] = [];
  const suggestions: string[] = [];

  // 条件数が多い場合の警告
  if (conditions.length > 5) {
    warnings.push({
      code: 'TOO_MANY_CONDITIONS',
      message: `条件が${conditions.length}個あります。ルールが複雑になっています`,
      severity: 'warning',
      context: { conditionCount: conditions.length }
    });
    suggestions.push('条件を整理して、より単純なルールに分割することを検討してください');
  }

  // 各条件の値の数をチェック
  conditions.forEach((condition, index) => {
    if (Array.isArray(condition.values) && condition.values.length > 5) {
      warnings.push({
        code: 'TOO_MANY_VALUES',
        message: `条件${index + 1}に${condition.values.length}個の値があります`,
        severity: 'warning',
        context: { blockIndex: index, valueCount: condition.values.length }
      });
      suggestions.push(`${condition.label}の値を整理することを検討してください`);
    }
  });

  return {
    isValid: true,
    errors: [],
    warnings,
    suggestions
  };
};

/**
 * 条件タイプ別の提案生成
 */
const generateSuggestions = (condition: ConditionBlock): string[] => {
  const suggestions: string[] = [];

  switch (condition.type) {
    case 'expenseType':
      if (Array.isArray(condition.values) && condition.values.length === 1) {
        suggestions.push('関連する経費種別を追加すると、より柔軟なルールになります');
      }
      break;

    case 'merchant':
      if (Array.isArray(condition.values)) {
        const hasRegex = condition.values.some(v => v.includes('.*') || v.includes('^') || v.includes('$'));
        if (!hasRegex && condition.values.length === 1) {
          suggestions.push('正規表現パターン（例: .*コンビニ.*）を使用すると、より柔軟なマッチングができます');
        }
      }
      break;

    case 'amount':
      if (!Array.isArray(condition.values)) {
        const range = condition.values as AmountRange;
        if (range.min !== undefined && range.max === undefined) {
          suggestions.push('最大金額も設定すると、より具体的な範囲指定ができます');
        } else if (range.min === undefined && range.max !== undefined) {
          suggestions.push('最小金額も設定すると、より具体的な範囲指定ができます');
        }
      }
      break;

    case 'keyword':
      if (Array.isArray(condition.values) && condition.values.length === 1) {
        suggestions.push('関連キーワードを追加すると、検索精度が向上します');
      }
      break;

    case 'receiptContent':
      if (Array.isArray(condition.values)) {
        const simplePatterns = condition.values.filter(v => !v.includes('.*') && !v.includes('^') && !v.includes('$'));
        if (simplePatterns.length > 0) {
          suggestions.push('正規表現パターンを使用すると、より柔軟なマッチングができます（例: .*駐車場.*）');
        }
      }
      break;
  }

  return suggestions;
};

/**
 * リアルタイムバリデーション用のデバウンス関数
 */
export const createDebouncedValidator = (
  validator: (condition: ConditionBlock) => ValidationResult,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;

  return (condition: ConditionBlock, callback: (result: ValidationResult) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(condition);
      callback(result);
    }, delay);
  };
};

/**
 * バリデーション結果のマージ
 */
export const mergeValidationResults = (results: ValidationResult[]): ValidationResult => {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  const allSuggestions: string[] = [];

  results.forEach(result => {
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
    allSuggestions.push(...result.suggestions);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    suggestions: [...new Set(allSuggestions)] // 重複除去
  };
};