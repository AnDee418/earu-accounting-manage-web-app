/**
 * ルール適用フック
 * 要件1.3, 1.5, 2.3, 3.3, 4.1, 4.2, 4.3に対応
 */

import { useState, useCallback } from 'react';
import { ProcessingReceiptData, ProcessedReceiptData, AccountAssignment, TaxAssignment, DepartmentAssignment } from '@/types/rules';
import { UserProfile } from '@/types/auth';

interface UseRuleApplicationOptions {
  companyId: string;
  userProfile?: UserProfile;
}

interface RuleApplicationState {
  isProcessing: boolean;
  error: string | null;
  lastProcessedReceipt: ProcessedReceiptData | null;
}

interface IndividualRuleResult {
  account?: AccountAssignment | null;
  tax?: TaxAssignment;
  department?: DepartmentAssignment;
  description?: string | null;
}

export function useRuleApplication({ companyId, userProfile }: UseRuleApplicationOptions) {
  const [state, setState] = useState<RuleApplicationState>({
    isProcessing: false,
    error: null,
    lastProcessedReceipt: null,
  });

  /**
   * 包括的ルール適用（全ルールを順次適用）
   * 要件1.3, 1.5, 2.3, 3.3, 4.1, 4.2, 4.3
   */
  const processReceipt = useCallback(async (receiptData: ProcessingReceiptData): Promise<ProcessedReceiptData | null> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const response = await fetch('/api/rules/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptData,
          companyId,
          userProfile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'ルール適用に失敗しました');
      }

      const { data } = await response.json();
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastProcessedReceipt: data,
      }));

      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ルール適用中にエラーが発生しました';
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));

      return null;
    }
  }, [companyId, userProfile]);

  /**
   * 個別ルール適用（テスト・プレビュー用）
   */
  const applyIndividualRule = useCallback(async (
    receiptData: ProcessingReceiptData,
    ruleType: 'account' | 'tax' | 'department' | 'format',
    accountAssignment?: AccountAssignment
  ): Promise<unknown> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const response = await fetch('/api/rules/apply', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptData,
          companyId,
          ruleType,
          userProfile,
          accountAssignment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || '個別ルール適用に失敗しました');
      }

      const { data } = await response.json();
      
      setState(prev => ({ ...prev, isProcessing: false }));

      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '個別ルール適用中にエラーが発生しました';
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));

      throw error;
    }
  }, [companyId, userProfile]);

  /**
   * 勘定科目ルール適用
   * 要件1.3, 1.5
   */
  const applyAccountRules = useCallback(async (receiptData: ProcessingReceiptData): Promise<AccountAssignment | null> => {
    try {
      return await applyIndividualRule(receiptData, 'account');
    } catch (error) {
      console.error('勘定科目ルール適用エラー:', error);
      return null;
    }
  }, [applyIndividualRule]);

  /**
   * 税区分ルール適用
   * 要件2.3
   */
  const applyTaxRules = useCallback(async (
    receiptData: ProcessingReceiptData,
    accountAssignment: AccountAssignment
  ): Promise<TaxAssignment | null> => {
    try {
      return await applyIndividualRule(receiptData, 'tax', accountAssignment);
    } catch (error) {
      console.error('税区分ルール適用エラー:', error);
      return null;
    }
  }, [applyIndividualRule]);

  /**
   * 部門ルール適用
   * 要件3.3
   */
  const applyDepartmentRules = useCallback(async (receiptData: ProcessingReceiptData): Promise<DepartmentAssignment | null> => {
    try {
      return await applyIndividualRule(receiptData, 'department');
    } catch (error) {
      console.error('部門ルール適用エラー:', error);
      return null;
    }
  }, [applyIndividualRule]);

  /**
   * 摘要生成
   * 要件4.1, 4.2, 4.3
   */
  const generateDescription = useCallback(async (receiptData: ProcessingReceiptData): Promise<string | null> => {
    try {
      return await applyIndividualRule(receiptData, 'format');
    } catch (error) {
      console.error('摘要生成エラー:', error);
      return null;
    }
  }, [applyIndividualRule]);

  /**
   * ルール適用プレビュー（段階的に適用結果を表示）
   */
  const previewRuleApplication = useCallback(async (receiptData: ProcessingReceiptData): Promise<{
    account?: AccountAssignment | null;
    tax?: TaxAssignment;
    department?: DepartmentAssignment;
    description?: string | null;
    errors: string[];
  }> => {
    const result: IndividualRuleResult = {};
    const errors: string[] = [];

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // 1. 勘定科目ルール適用
      try {
        result.account = await applyAccountRules(receiptData);
      } catch (error) {
        errors.push(`勘定科目: ${error instanceof Error ? error.message : String(error)}`);
      }

      // 2. 税区分ルール適用（勘定科目が成功した場合のみ）
      if (result.account) {
        try {
          result.tax = await applyTaxRules(receiptData, result.account);
        } catch (error) {
          errors.push(`税区分: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // 3. 部門ルール適用
      try {
        result.department = await applyDepartmentRules(receiptData);
      } catch (error) {
        errors.push(`部門: ${error instanceof Error ? error.message : String(error)}`);
      }

      // 4. 摘要生成
      try {
        result.description = await generateDescription(receiptData);
      } catch (error) {
        errors.push(`摘要: ${error instanceof Error ? error.message : String(error)}`);
      }

      setState(prev => ({ ...prev, isProcessing: false }));

      return { ...result, errors };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'プレビュー中にエラーが発生しました';
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));

      return { errors: [errorMessage] };
    }
  }, [applyAccountRules, applyTaxRules, applyDepartmentRules, generateDescription]);

  /**
   * バッチ処理（複数の領収書を一括処理）
   */
  const processBatchReceipts = useCallback(async (receipts: ProcessingReceiptData[]): Promise<{
    processed: ProcessedReceiptData[];
    failed: { receipt: ProcessingReceiptData; error: string }[];
  }> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    const processed: ProcessedReceiptData[] = [];
    const failed: { receipt: ProcessingReceiptData; error: string }[] = [];

    try {
      for (const receipt of receipts) {
        try {
          const result = await processReceipt(receipt);
          if (result) {
            processed.push(result);
          } else {
            failed.push({ receipt, error: '処理に失敗しました' });
          }
        } catch (error) {
          failed.push({ 
            receipt, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }

      setState(prev => ({ ...prev, isProcessing: false }));

      return { processed, failed };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'バッチ処理中にエラーが発生しました';
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));

      return { processed, failed };
    }
  }, [processReceipt]);

  /**
   * エラーリセット
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * 処理状態リセット
   */
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      lastProcessedReceipt: null,
    });
  }, []);

  return {
    // 状態
    isProcessing: state.isProcessing,
    error: state.error,
    lastProcessedReceipt: state.lastProcessedReceipt,

    // メイン機能
    processReceipt,
    previewRuleApplication,
    processBatchReceipts,

    // 個別ルール適用
    applyAccountRules,
    applyTaxRules,
    applyDepartmentRules,
    generateDescription,

    // ユーティリティ
    clearError,
    reset,
  };
}