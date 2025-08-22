import { useState, useCallback } from 'react';
import { MasterData, MasterDataFilters, ImportResult } from '@/types/settings';

interface UseMasterDataReturn {
  masterData: MasterData;
  loading: boolean;
  error: string | null;
  fetchMasters: (filters?: MasterDataFilters) => Promise<void>;
  importMasterData: (file: File, type: string) => Promise<ImportResult>;
  refreshMasters: () => Promise<void>;
}

export function useMasterData(): UseMasterDataReturn {
  const [masterData, setMasterData] = useState<MasterData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMasters = useCallback(async (filters?: MasterDataFilters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.type) {
        const types = Array.isArray(filters.type) ? filters.type : [filters.type];
        params.append('type', types.join(','));
      }
      if (filters?.isActiveOnly !== undefined) {
        params.append('isActiveOnly', filters.isActiveOnly.toString());
      }

      const response = await fetch(`/api/masters?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('マスタデータの取得に失敗しました');
      }

      const data = await response.json();
      setMasterData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'マスタデータの取得に失敗しました';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const importMasterData = useCallback(async (file: File, type: string): Promise<ImportResult> => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/masters/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('インポート処理に失敗しました');
      }

      const result: ImportResult = await response.json();
      
      // インポート成功時は自動的にデータを再取得
      if (result.success) {
        await fetchMasters();
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'インポート処理に失敗しました';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchMasters]);

  const refreshMasters = useCallback(async () => {
    await fetchMasters();
  }, [fetchMasters]);

  return {
    masterData,
    loading,
    error,
    fetchMasters,
    importMasterData,
    refreshMasters,
  };
}
