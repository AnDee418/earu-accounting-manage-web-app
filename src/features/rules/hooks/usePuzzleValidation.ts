import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ConditionBlock,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '@/types/rules';
import {
  validateConditionBlock,
  validateConditionBlocks,
  createDebouncedValidator,
} from '../utils/puzzleValidation';

/**
 * パズルルールビルダー用リアルタイムバリデーションフック
 * 
 * Requirements: 設計書のValidation Rules
 * - 条件ブロックのリアルタイムバリデーション
 * - エラー状態の管理
 * - デバウンス処理による最適化
 */

interface UsePuzzleValidationOptions {
  autoValidate?: boolean;
  debounceDelay?: number;
  onValidationChange?: (result: ValidationResult) => void;
}

interface UsePuzzleValidationReturn {
  // バリデーション状態
  validationResult: ValidationResult | null;
  isValidating: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  
  // 個別条件のバリデーション状態
  conditionValidations: Map<string, ValidationResult>;
  
  // バリデーション実行
  validateConditions: (conditions: ConditionBlock[]) => ValidationResult;
  validateSingleCondition: (condition: ConditionBlock) => ValidationResult;
  
  // エラー管理
  getConditionErrors: (conditionId: string) => ValidationError[];
  getConditionWarnings: (conditionId: string) => ValidationWarning[];
  hasConditionErrors: (conditionId: string) => boolean;
  
  // バリデーション制御
  clearValidation: () => void;
  setValidationEnabled: (enabled: boolean) => void;
}

export const usePuzzleValidation = ({
  autoValidate = true,
  debounceDelay = 300,
  onValidationChange,
}: UsePuzzleValidationOptions = {}): UsePuzzleValidationReturn => {
  // バリデーション状態
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [conditionValidations, setConditionValidations] = useState<Map<string, ValidationResult>>(new Map());
  const [validationEnabled, setValidationEnabledState] = useState(autoValidate);

  // デバウンス用のref
  const debouncedValidatorRef = useRef(
    createDebouncedValidator(validateConditionBlock, debounceDelay)
  );

  // 全体バリデーション実行
  const validateConditions = useCallback((conditions: ConditionBlock[]): ValidationResult => {
    setIsValidating(true);
    
    try {
      const result = validateConditionBlocks(conditions);
      setValidationResult(result);
      
      // 個別条件のバリデーション結果も更新
      const newConditionValidations = new Map<string, ValidationResult>();
      conditions.forEach(condition => {
        const conditionResult = validateConditionBlock(condition);
        newConditionValidations.set(condition.id, conditionResult);
      });
      setConditionValidations(newConditionValidations);
      
      // コールバック実行
      if (onValidationChange) {
        onValidationChange(result);
      }
      
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [onValidationChange]);

  // 単一条件バリデーション実行
  const validateSingleCondition = useCallback((condition: ConditionBlock): ValidationResult => {
    const result = validateConditionBlock(condition);
    
    // 個別条件のバリデーション結果を更新
    setConditionValidations(prev => {
      const newMap = new Map(prev);
      newMap.set(condition.id, result);
      return newMap;
    });
    
    return result;
  }, []);

  // デバウンス付き単一条件バリデーション
  const validateSingleConditionDebounced = useCallback((
    condition: ConditionBlock,
    callback?: (result: ValidationResult) => void
  ) => {
    if (!validationEnabled) return;
    
    setIsValidating(true);
    debouncedValidatorRef.current(condition, (result) => {
      setConditionValidations(prev => {
        const newMap = new Map(prev);
        newMap.set(condition.id, result);
        return newMap;
      });
      setIsValidating(false);
      
      if (callback) {
        callback(result);
      }
    });
  }, [validationEnabled]);

  // 条件のエラー取得
  const getConditionErrors = useCallback((conditionId: string): ValidationError[] => {
    const validation = conditionValidations.get(conditionId);
    return validation?.errors || [];
  }, [conditionValidations]);

  // 条件の警告取得
  const getConditionWarnings = useCallback((conditionId: string): ValidationWarning[] => {
    const validation = conditionValidations.get(conditionId);
    return validation?.warnings || [];
  }, [conditionValidations]);

  // 条件にエラーがあるかチェック
  const hasConditionErrors = useCallback((conditionId: string): boolean => {
    const validation = conditionValidations.get(conditionId);
    return validation ? !validation.isValid : false;
  }, [conditionValidations]);

  // バリデーションクリア
  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setConditionValidations(new Map());
    setIsValidating(false);
  }, []);

  // バリデーション有効/無効切り替え
  const setValidationEnabled = useCallback((enabled: boolean) => {
    setValidationEnabledState(enabled);
    if (!enabled) {
      clearValidation();
    }
  }, [clearValidation]);

  // 計算プロパティ
  const hasErrors = validationResult ? !validationResult.isValid : false;
  const hasWarnings = validationResult ? validationResult.warnings.length > 0 : false;

  return {
    // バリデーション状態
    validationResult,
    isValidating,
    hasErrors,
    hasWarnings,
    
    // 個別条件のバリデーション状態
    conditionValidations,
    
    // バリデーション実行
    validateConditions,
    validateSingleCondition,
    
    // エラー管理
    getConditionErrors,
    getConditionWarnings,
    hasConditionErrors,
    
    // バリデーション制御
    clearValidation,
    setValidationEnabled,
  };
};

/**
 * 条件ブロック用のバリデーションフック（個別使用）
 */
export const useConditionValidation = (
  condition: ConditionBlock,
  options: { autoValidate?: boolean; debounceDelay?: number } = {}
) => {
  const { autoValidate = true, debounceDelay = 300 } = options;
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // デバウンス付きバリデーション
  const debouncedValidator = useRef(
    createDebouncedValidator(validateConditionBlock, debounceDelay)
  );

  // バリデーション実行
  const validate = useCallback(() => {
    if (!autoValidate) return;
    
    setIsValidating(true);
    debouncedValidator.current(condition, (result) => {
      setValidationResult(result);
      setIsValidating(false);
    });
  }, [condition, autoValidate]);

  // 条件が変更されたときに自動バリデーション
  useEffect(() => {
    if (autoValidate) {
      validate();
    }
  }, [condition.values, condition.type, validate, autoValidate]);

  return {
    validationResult,
    isValidating,
    hasErrors: validationResult ? !validationResult.isValid : false,
    hasWarnings: validationResult ? validationResult.warnings.length > 0 : false,
    validate,
  };
};