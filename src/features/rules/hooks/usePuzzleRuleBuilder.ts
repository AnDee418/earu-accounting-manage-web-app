import { useState, useCallback, useEffect } from 'react';
import {
  ConditionBlock,
  ValidationResult,
  ValidationError,
  RuleConditions,
} from '@/types/rules';
import {
  convertLegacyToBlocks,
  convertBlocksToLegacy,
  convertLegacyToBlocksWithValidation,
  convertBlocksToLegacyWithValidation,
  generateConditionId,
  DataIntegrityResult,
} from '../utils/puzzleDataConverter';
import { usePuzzleValidation } from './usePuzzleValidation';
import { CONDITION_TYPES } from '../components/puzzle/PuzzleRuleBuilder';

/**
 * パズルルールビルダーの状態管理フック
 * 
 * Requirements: 1.1, 1.2, 6.2
 * - 条件ブロックの基本データ構造とstate管理
 * - パズル形式と従来形式の相互変換
 * - バリデーション機能
 */

interface UsePuzzleRuleBuilderOptions {
  initialConditions?: ConditionBlock[];
  initialLegacyConditions?: RuleConditions;
  onValidate?: (conditions: ConditionBlock[]) => ValidationResult;
  autoValidate?: boolean;
}

interface UsePuzzleRuleBuilderReturn {
  // 状態
  conditions: ConditionBlock[];
  draggedItem: string | null;
  validationErrors: ValidationError[];
  isValid: boolean;
  dataIntegrity: DataIntegrityResult | null;
  
  // アクション
  addCondition: (type: keyof typeof CONDITION_TYPES) => void;
  updateCondition: (id: string, updates: Partial<ConditionBlock>) => void;
  removeCondition: (id: string) => void;
  reorderConditions: (fromIndex: number, toIndex: number) => void;
  clearConditions: () => void;
  
  // ドラッグ&ドロップ
  handleDragStart: (id: string) => void;
  handleDragEnd: () => void;
  
  // データ変換（整合性チェック付き）
  toLegacyFormat: () => { conditions: RuleConditions; integrity: DataIntegrityResult };
  fromLegacyFormat: (legacyConditions: RuleConditions) => DataIntegrityResult;
  
  // 基本データ変換（後方互換性用）
  toLegacyFormatBasic: () => RuleConditions;
  fromLegacyFormatBasic: (legacyConditions: RuleConditions) => void;
  
  // バリデーション
  validate: () => ValidationResult;
  validateCondition: (id: string) => void;
  
  // データ整合性
  checkDataIntegrity: () => DataIntegrityResult;
  fixDataIntegrity: () => void;
}

export const usePuzzleRuleBuilder = ({
  initialConditions = [],
  initialLegacyConditions,
  onValidate,
  autoValidate = true,
}: UsePuzzleRuleBuilderOptions = {}): UsePuzzleRuleBuilderReturn => {
  // 初期条件の設定
  const getInitialConditions = (): ConditionBlock[] => {
    if (initialConditions.length > 0) {
      return initialConditions;
    }
    if (initialLegacyConditions) {
      return convertLegacyToBlocks(initialLegacyConditions);
    }
    return [];
  };

  // 状態管理
  const [conditions, setConditions] = useState<ConditionBlock[]>(getInitialConditions);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // バリデーションフックの使用
  const {
    validationResult,
    validateConditions,
    validateSingleCondition,
    clearValidation,
  } = usePuzzleValidation({
    autoValidate,
    debounceDelay: 300,
    onValidationChange: () => {
      // カスタムバリデーション関数がある場合は追加で実行
      if (onValidate) {
        onValidate(conditions);
        // カスタム結果をマージ（実装は簡略化）
      }
    },
  });

  // バリデーション実行
  const validate = useCallback((): ValidationResult => {
    // カスタムバリデーション関数がある場合は使用
    if (onValidate) {
      return onValidate(conditions);
    }

    // デフォルトバリデーション
    return validateConditions(conditions);
  }, [conditions, onValidate, validateConditions]);

  // 自動バリデーション
  useEffect(() => {
    if (autoValidate && conditions.length > 0) {
      validateConditions(conditions);
    } else if (conditions.length === 0) {
      clearValidation();
    }
  }, [conditions, autoValidate, validateConditions, clearValidation]);

  // 条件ブロック追加
  const addCondition = useCallback((type: keyof typeof CONDITION_TYPES) => {
    const conditionType = CONDITION_TYPES[type];
    const newCondition: ConditionBlock = {
      id: generateConditionId(),
      type: type as ConditionBlock['type'],
      operator: 'AND',
      values: conditionType.inputType === 'range' 
        ? { min: undefined, max: undefined, currency: 'JPY' }
        : [],
      label: conditionType.label,
      description: conditionType.description,
      uiState: {
        isExpanded: true,
        isDragging: false,
        hasError: false,
      },
      validation: {
        required: true,
        minValues: 1,
        maxValues: conditionType.inputType === 'range' ? 1 : 10,
      },
    };

    setConditions(prev => [...prev, newCondition]);
  }, []);

  // 条件ブロック更新
  const updateCondition = useCallback((id: string, updates: Partial<ConditionBlock>) => {
    setConditions(prev => {
      const newConditions = prev.map(condition => {
        if (condition.id === id) {
          const updatedCondition = { ...condition, ...updates };
          
          // リアルタイムバリデーション実行
          if (autoValidate) {
            const validationResult = validateSingleCondition(updatedCondition);
            updatedCondition.uiState = {
              ...updatedCondition.uiState,
              hasError: !validationResult.isValid,
              errorMessage: validationResult.errors[0]?.message,
            };
          }
          
          return updatedCondition;
        }
        return condition;
      });
      
      return newConditions;
    });
  }, [autoValidate, validateSingleCondition]);

  // 条件ブロック削除
  const removeCondition = useCallback((id: string) => {
    setConditions(prev => prev.filter(condition => condition.id !== id));
  }, []);

  // 条件ブロック順序変更
  const reorderConditions = useCallback((fromIndex: number, toIndex: number) => {
    setConditions(prev => {
      const newConditions = [...prev];
      const [movedCondition] = newConditions.splice(fromIndex, 1);
      newConditions.splice(toIndex, 0, movedCondition);
      return newConditions;
    });
  }, []);

  // 全条件クリア
  const clearConditions = useCallback(() => {
    setConditions([]);
  }, []);

  // ドラッグ開始
  const handleDragStart = useCallback((id: string) => {
    setDraggedItem(id);
  }, []);

  // ドラッグ終了
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  // 従来形式への変換
  const toLegacyFormat = useCallback((): RuleConditions => {
    return convertBlocksToLegacy(conditions);
  }, [conditions]);

  // 従来形式からの変換
  const fromLegacyFormat = useCallback((legacyConditions: RuleConditions) => {
    const convertedConditions = convertLegacyToBlocks(legacyConditions);
    setConditions(convertedConditions);
  }, []);

  // 個別条件のバリデーション
  const validateCondition = useCallback((id: string) => {
    const condition = conditions.find(c => c.id === id);
    if (condition) {
      const result = validateSingleCondition(condition);
      updateCondition(id, {
        uiState: {
          ...condition.uiState,
          hasError: !result.isValid,
          errorMessage: result.errors[0]?.message,
        },
      });
    }
  }, [conditions, validateSingleCondition, updateCondition]);

  // バリデーション状態の計算
  const validationErrors = validationResult?.errors || [];
  const isValid = validationResult?.isValid ?? true;

  return {
    // 状態
    conditions,
    draggedItem,
    validationErrors,
    isValid,
    
    // アクション
    addCondition,
    updateCondition,
    removeCondition,
    reorderConditions,
    clearConditions,
    
    // ドラッグ&ドロップ
    handleDragStart,
    handleDragEnd,
    
    // データ変換
    toLegacyFormat,
    fromLegacyFormat,
    
    // バリデーション
    validate,
    validateCondition,
  };
};