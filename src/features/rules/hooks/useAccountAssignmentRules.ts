import { useState, useCallback } from 'react';
import { AccountAssignmentRule, TestResult, ReceiptData } from '@/types/rules';

export function useAccountAssignmentRules() {
  const [rules, setRules] = useState<AccountAssignmentRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/rules/account-assignment');
      if (!response.ok) {
        throw new Error('Failed to fetch account assignment rules');
      }
      const data = await response.json();
      setRules(data.rules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRule = useCallback(async (ruleData: Omit<AccountAssignmentRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    setError('');
    try {
      const response = await fetch('/api/rules/account-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create account assignment rule');
      }
      
      const data = await response.json();
      setRules(prev => [...prev, data.rule]);
      return data.rule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  const updateRule = useCallback(async (ruleId: string, ruleData: Partial<AccountAssignmentRule>) => {
    setError('');
    try {
      const response = await fetch(`/api/rules/account-assignment/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update account assignment rule');
      }
      
      const data = await response.json();
      setRules(prev => prev.map(rule => rule.id === ruleId ? data.rule : rule));
      return data.rule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  const deleteRule = useCallback(async (ruleId: string) => {
    setError('');
    try {
      const response = await fetch(`/api/rules/account-assignment/${ruleId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account assignment rule');
      }
      
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  const testRule = useCallback(async (rule: AccountAssignmentRule, testData: ReceiptData[]): Promise<TestResult> => {
    setError('');
    try {
      const response = await fetch('/api/rules/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ruleType: 'account-assignment',
          rule,
          testData,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to test account assignment rule');
      }
      
      const data = await response.json();
      return data.result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  return {
    rules,
    loading,
    error,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    testRule,
  };
}