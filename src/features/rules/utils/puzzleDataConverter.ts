import { 
  ConditionBlock, 
  RuleConditions, 
  AmountRange,
  LogicalOperator
} from '@/types/rules';
import { CONDITION_TYPES } from '../components/puzzle/PuzzleRuleBuilder';

/**
 * パズル形式と従来形式のデータ変換ユーティリティ
 * 
 * Requirements: 6.1, 6.2, 6.3
 * - 従来形式からパズルブロック形式への変換
 * - パズルブロック形式から従来形式への変換
 * - 後方互換性を保つためのデータマッピング
 */

/**
 * 従来形式からパズルブロック形式への変換
 */
export const convertLegacyToBlocks = (conditions: RuleConditions): ConditionBlock[] => {
  const blocks: ConditionBlock[] = [];
  let blockIndex = 0;

  // 経費種別パターンの変換
  if (conditions.expenseTypePatterns?.length) {
    blocks.push({
      id: `condition-legacy-${blockIndex++}`,
      type: 'expenseType',
      operator: 'AND',
      values: conditions.expenseTypePatterns,
      label: CONDITION_TYPES.expenseType.label,
      description: CONDITION_TYPES.expenseType.description,
      uiState: {
        isExpanded: true,
        isDragging: false,
        hasError: false,
      },
      validation: {
        required: true,
        minValues: 1,
        maxValues: 10,
      },
    });
  }

  // 取引先パターンの変換
  if (conditions.merchantPatterns?.length) {
    blocks.push({
      id: `condition-legacy-${blockIndex++}`,
      type: 'merchant',
      operator: 'AND',
      values: conditions.merchantPatterns,
      label: CONDITION_TYPES.merchant.label,
      description: CONDITION_TYPES.merchant.description,
      uiState: {
        isExpanded: true,
        isDragging: false,
        hasError: false,
      },
      validation: {
        required: true,
        minValues: 1,
        maxValues: 10,
      },
    });
  }

  // キーワードの変換
  if (conditions.keywords?.length) {
    blocks.push({
      id: `condition-legacy-${blockIndex++}`,
      type: 'keyword',
      operator: 'AND',
      values: conditions.keywords,
      label: CONDITION_TYPES.keyword.label,
      description: CONDITION_TYPES.keyword.description,
      uiState: {
        isExpanded: true,
        isDragging: false,
        hasError: false,
      },
      validation: {
        required: true,
        minValues: 1,
        maxValues: 10,
      },
    });
  }

  // 金額範囲の変換
  if (conditions.amountRange && (conditions.amountRange.min !== undefined || conditions.amountRange.max !== undefined)) {
    blocks.push({
      id: `condition-legacy-${blockIndex++}`,
      type: 'amount',
      operator: 'AND',
      values: {
        min: conditions.amountRange.min,
        max: conditions.amountRange.max,
        currency: 'JPY',
      } as AmountRange,
      label: CONDITION_TYPES.amount.label,
      description: CONDITION_TYPES.amount.description,
      uiState: {
        isExpanded: true,
        isDragging: false,
        hasError: false,
      },
      validation: {
        required: true,
        minValues: 1,
        maxValues: 1,
      },
    });
  }

  // 領収書内容パターンの変換
  if (conditions.receiptContentPatterns?.length) {
    blocks.push({
      id: `condition-legacy-${blockIndex++}`,
      type: 'receiptContent',
      operator: 'AND',
      values: conditions.receiptContentPatterns,
      label: CONDITION_TYPES.receiptContent.label,
      description: CONDITION_TYPES.receiptContent.description,
      uiState: {
        isExpanded: true,
        isDragging: false,
        hasError: false,
      },
      validation: {
        required: true,
        minValues: 1,
        maxValues: 10,
      },
    });
  }

  return blocks;
};

/**
 * パズルブロック形式から従来形式への変換
 */
export const convertBlocksToLegacy = (blocks: ConditionBlock[]): RuleConditions => {
  const conditions: RuleConditions = {
    conditionBlocks: blocks,
    // 後方互換性のため従来形式も生成
    expenseTypePatterns: [],
    merchantPatterns: [],
    keywords: [],
    receiptContentPatterns: [],
  };

  blocks.forEach(block => {
    switch (block.type) {
      case 'expenseType':
        if (Array.isArray(block.values)) {
          conditions.expenseTypePatterns!.push(...block.values);
        }
        break;
      
      case 'merchant':
        if (Array.isArray(block.values)) {
          conditions.merchantPatterns!.push(...block.values);
        }
        break;
      
      case 'keyword':
        if (Array.isArray(block.values)) {
          conditions.keywords!.push(...block.values);
        }
        break;
      
      case 'amount':
        if (!Array.isArray(block.values)) {
          const amountRange = block.values as AmountRange;
          conditions.amountRange = {
            min: amountRange.min,
            max: amountRange.max,
          };
        }
        break;
      
      case 'receiptContent':
        if (Array.isArray(block.values)) {
          conditions.receiptContentPatterns!.push(...block.values);
        }
        break;
    }
  });

  return conditions;
};

// Note: Validation functions moved to puzzleValidation.ts

/**
 * 条件ブロックから自然言語への変換（プレビュー用）
 */
export const generateNaturalLanguage = (blocks: ConditionBlock[]): string => {
  if (blocks.length === 0) {
    return '条件が設定されていません';
  }

  return blocks.map((block, index) => {
    const typeLabel = block.label;
    let values = '';

    if (Array.isArray(block.values)) {
      values = block.values.length > 0 ? block.values.join(', ') : '未設定';
    } else {
      const amountRange = block.values as AmountRange;
      const min = amountRange.min !== undefined ? `${amountRange.min}円` : '0円';
      const max = amountRange.max !== undefined ? `${amountRange.max}円` : '∞円';
      values = `${min}〜${max}`;
    }

    const connector = index < blocks.length - 1 ? ` ${block.operator} ` : '';
    
    return `${typeLabel} (${values})${connector}`;
  }).join('');
};

/**
 * データ整合性チェック結果
 */
export interface DataIntegrityResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedData?: ConditionBlock[] | RuleConditions;
}

/**
 * パズルブロック形式のデータ整合性チェック
 */
export const validateBlocksIntegrity = (blocks: ConditionBlock[]): DataIntegrityResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fixedBlocks: ConditionBlock[] = [];

  blocks.forEach((block, index) => {
    const fixedBlock = { ...block };
    
    // 必須フィールドのチェック
    if (!block.id) {
      errors.push(`ブロック${index + 1}: IDが設定されていません`);
      fixedBlock.id = generateConditionId();
    }
    
    if (!block.type || !CONDITION_TYPES[block.type]) {
      errors.push(`ブロック${index + 1}: 無効な条件タイプです (${block.type})`);
      return; // 修復不可能なエラー
    }
    
    // 値の整合性チェック
    if (block.type === 'amount') {
      if (Array.isArray(block.values)) {
        errors.push(`ブロック${index + 1}: 金額範囲条件の値が配列形式になっています`);
        fixedBlock.values = { min: undefined, max: undefined, currency: 'JPY' };
      } else {
        const amountRange = block.values as AmountRange;
        if (amountRange.min !== undefined && amountRange.max !== undefined && amountRange.min > amountRange.max) {
          errors.push(`ブロック${index + 1}: 最小金額が最大金額より大きくなっています`);
        }
        if (!amountRange.currency) {
          warnings.push(`ブロック${index + 1}: 通貨が設定されていません。JPYを設定します`);
          fixedBlock.values = { ...amountRange, currency: 'JPY' };
        }
      }
    } else {
      if (!Array.isArray(block.values)) {
        errors.push(`ブロック${index + 1}: ${block.type}条件の値が配列形式ではありません`);
        fixedBlock.values = [];
      } else if (block.values.length === 0) {
        warnings.push(`ブロック${index + 1}: 条件値が設定されていません`);
      }
    }
    
    // 論理演算子のチェック
    if (!['AND', 'OR'].includes(block.operator)) {
      warnings.push(`ブロック${index + 1}: 無効な論理演算子です。ANDに設定します`);
      fixedBlock.operator = 'AND' as LogicalOperator;
    }
    
    // UIStateの初期化
    if (!block.uiState) {
      fixedBlock.uiState = {
        isExpanded: true,
        isDragging: false,
        hasError: false,
      };
    }
    
    // バリデーション設定の初期化
    if (!block.validation) {
      const conditionType = CONDITION_TYPES[block.type];
      fixedBlock.validation = {
        required: true,
        minValues: conditionType.inputType === 'range' ? 1 : 1,
        maxValues: conditionType.inputType === 'range' ? 1 : 10,
      };
    }
    
    fixedBlocks.push(fixedBlock);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixedData: fixedBlocks,
  };
};

/**
 * 従来形式のデータ整合性チェック
 */
export const validateLegacyIntegrity = (conditions: RuleConditions): DataIntegrityResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fixedConditions: RuleConditions = { ...conditions };

  // 配列フィールドの初期化
  if (!Array.isArray(conditions.expenseTypePatterns)) {
    warnings.push('経費種別パターンが配列ではありません。空配列で初期化します');
    fixedConditions.expenseTypePatterns = [];
  }
  
  if (!Array.isArray(conditions.merchantPatterns)) {
    warnings.push('取引先パターンが配列ではありません。空配列で初期化します');
    fixedConditions.merchantPatterns = [];
  }
  
  if (!Array.isArray(conditions.keywords)) {
    warnings.push('キーワードが配列ではありません。空配列で初期化します');
    fixedConditions.keywords = [];
  }
  
  if (!Array.isArray(conditions.receiptContentPatterns)) {
    warnings.push('領収書内容パターンが配列ではありません。空配列で初期化します');
    fixedConditions.receiptContentPatterns = [];
  }

  // 金額範囲のチェック
  if (conditions.amountRange) {
    const { min, max } = conditions.amountRange;
    if (min !== undefined && max !== undefined && min > max) {
      errors.push('金額範囲の最小値が最大値より大きくなっています');
    }
    if (min !== undefined && min < 0) {
      warnings.push('金額範囲の最小値が負の値です');
    }
  }

  // 空の文字列や無効な値の除去
  ['expenseTypePatterns', 'merchantPatterns', 'keywords', 'receiptContentPatterns'].forEach(field => {
    const array = fixedConditions[field as keyof RuleConditions] as string[];
    if (Array.isArray(array)) {
      const cleaned = array.filter(item => typeof item === 'string' && item.trim().length > 0);
      if (cleaned.length !== array.length) {
        warnings.push(`${field}: 空の文字列や無効な値を除去しました`);
        (fixedConditions as any)[field] = cleaned;
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixedData: fixedConditions,
  };
};

/**
 * 高度なデータ変換（整合性チェック付き）
 */
export const convertLegacyToBlocksWithValidation = (conditions: RuleConditions): {
  blocks: ConditionBlock[];
  integrity: DataIntegrityResult;
} => {
  // まず従来形式の整合性をチェック
  const legacyIntegrity = validateLegacyIntegrity(conditions);
  const validatedConditions = legacyIntegrity.fixedData as RuleConditions || conditions;
  
  // 基本変換を実行
  const blocks = convertLegacyToBlocks(validatedConditions);
  
  // パズルブロック形式の整合性をチェック
  const blocksIntegrity = validateBlocksIntegrity(blocks);
  
  return {
    blocks: blocksIntegrity.fixedData as ConditionBlock[] || blocks,
    integrity: {
      isValid: legacyIntegrity.isValid && blocksIntegrity.isValid,
      errors: [...legacyIntegrity.errors, ...blocksIntegrity.errors],
      warnings: [...legacyIntegrity.warnings, ...blocksIntegrity.warnings],
    },
  };
};

/**
 * 高度なデータ変換（整合性チェック付き）
 */
export const convertBlocksToLegacyWithValidation = (blocks: ConditionBlock[]): {
  conditions: RuleConditions;
  integrity: DataIntegrityResult;
} => {
  // まずパズルブロック形式の整合性をチェック
  const blocksIntegrity = validateBlocksIntegrity(blocks);
  const validatedBlocks = blocksIntegrity.fixedData as ConditionBlock[] || blocks;
  
  // 基本変換を実行
  const conditions = convertBlocksToLegacy(validatedBlocks);
  
  // 従来形式の整合性をチェック
  const legacyIntegrity = validateLegacyIntegrity(conditions);
  
  return {
    conditions: legacyIntegrity.fixedData as RuleConditions || conditions,
    integrity: {
      isValid: blocksIntegrity.isValid && legacyIntegrity.isValid,
      errors: [...blocksIntegrity.errors, ...legacyIntegrity.errors],
      warnings: [...blocksIntegrity.warnings, ...legacyIntegrity.warnings],
    },
  };
};

/**
 * データマイグレーション用のバッチ変換
 */
export const batchConvertLegacyData = (legacyRules: RuleConditions[]): {
  convertedRules: ConditionBlock[][];
  summary: {
    total: number;
    successful: number;
    withWarnings: number;
    withErrors: number;
    errors: Array<{ index: number; errors: string[] }>;
  };
} => {
  const convertedRules: ConditionBlock[][] = [];
  const summary = {
    total: legacyRules.length,
    successful: 0,
    withWarnings: 0,
    withErrors: 0,
    errors: [] as Array<{ index: number; errors: string[] }>,
  };

  legacyRules.forEach((rule, index) => {
    try {
      const { blocks, integrity } = convertLegacyToBlocksWithValidation(rule);
      convertedRules.push(blocks);
      
      if (integrity.isValid) {
        if (integrity.warnings.length > 0) {
          summary.withWarnings++;
        } else {
          summary.successful++;
        }
      } else {
        summary.withErrors++;
        summary.errors.push({ index, errors: integrity.errors });
      }
    } catch (error) {
      summary.withErrors++;
      summary.errors.push({ 
        index, 
        errors: [`変換中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      });
      convertedRules.push([]); // 空のブロック配列を追加
    }
  });

  return { convertedRules, summary };
};

/**
 * 一意なIDの生成
 */
export const generateConditionId = (): string => {
  return `condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};