import { useState, useCallback } from 'react';
import { TaxAssignmentRule, TestResult, ReceiptData } from '@/types/rules';

export function useTaxAssignmentRules() {
  const [rules, setRules] = useState<TaxAssignmentRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/rules/tax-assignment');
      if (!response.ok) {
        throw new Error('Failed to fetch tax assignment rules');
      }
      const data = await response.json();
      setRules(data.rules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRule = useCallback(async (ruleData: Omit<TaxAssignmentRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    setError('');
    try {
      const response = await fetch('/api/rules/tax-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create tax assignment rule');
      }
      
      const data = await response.json();
      setRules(prev => [...prev, data.rule]);
      return data.rule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  const updateRule = useCallback(async (ruleId: string, ruleData: Partial<TaxAssignmentRule>) => {
    setError('');
    try {
      const response = await fetch(`/api/rules/tax-assignment/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update tax assignment rule');
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
      const response = await fetch(`/api/rules/tax-assignment/${ruleId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete tax assignment rule');
      }
      
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  const testRule = useCallback(async (rule: TaxAssignmentRule, testData: ReceiptData[]): Promise<TestResult> => {
    setError('');
    try {
      const response = await fetch('/api/rules/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ruleType: 'tax-assignment',
          rule,
          testData,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to test tax assignment rule');
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