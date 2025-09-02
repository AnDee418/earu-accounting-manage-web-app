import { useState, useCallback } from 'react';
import { DepartmentCashMapping } from '@/types/rules';

export function useDepartmentCashMappings() {
  const [mappings, setMappings] = useState<DepartmentCashMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/rules/department-mapping');
      if (!response.ok) {
        throw new Error('Failed to fetch department cash mappings');
      }
      const data = await response.json();
      setMappings(data.mappings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createMapping = useCallback(async (mappingData: Omit<DepartmentCashMapping, 'id' | 'createdAt' | 'updatedAt'>) => {
    setError('');
    try {
      const response = await fetch('/api/rules/department-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappingData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create department cash mapping');
      }
      
      const data = await response.json();
      setMappings(prev => [...prev, data.mapping]);
      return data.mapping;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  const updateMapping = useCallback(async (mappingId: string, mappingData: Partial<DepartmentCashMapping>) => {
    setError('');
    try {
      const response = await fetch(`/api/rules/department-mapping/${mappingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappingData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update department cash mapping');
      }
      
      const data = await response.json();
      setMappings(prev => prev.map(mapping => mapping.id === mappingId ? data.mapping : mapping));
      return data.mapping;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  const deleteMapping = useCallback(async (mappingId: string) => {
    setError('');
    try {
      const response = await fetch(`/api/rules/department-mapping/${mappingId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete department cash mapping');
      }
      
      setMappings(prev => prev.filter(mapping => mapping.id !== mappingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  const syncWithMasterData = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/rules/department-mapping/sync', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync with master data');
      }
      
      const data = await response.json();
      setMappings(data.mappings || []);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  return {
    mappings,
    loading,
    error,
    fetchMappings,
    createMapping,
    updateMapping,
    deleteMapping,
    syncWithMasterData,
  };
}