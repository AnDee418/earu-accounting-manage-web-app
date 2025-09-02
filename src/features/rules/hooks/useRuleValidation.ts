import { useState, useCallback } from 'react';
import { ValidationResult, ComprehensiveRuleSet, ComplianceResult } from '@/types/rules';

export function useRuleValidation() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const validateRuleSet = useCallback(async (ruleSet: ComprehensiveRuleSet): Promise<ValidationResult> => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/rules/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ruleSet }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate rule set');
      }
      
      const data = await response.json();
      setValidationResult(data.result);
      return data.result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const validatePCACompliance = useCallback(async (ruleSet: ComprehensiveRuleSet): Promise<ComplianceResult> => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/rules/validate/pca-compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ruleSet }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate PCA compliance');
      }
      
      const data = await response.json();
      return data.result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkRuleConflicts = useCallback(async (newRule: any, existingRules: any[]) => {
    setError('');
    try {
      const response = await fetch('/api/rules/validate/conflicts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRule, existingRules }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to check rule conflicts');
      }
      
      const data = await response.json();
      return data.result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  return {
    validationResult,
    loading,
    error,
    validateRuleSet,
    validatePCACompliance,
    checkRuleConflicts,
  };
}