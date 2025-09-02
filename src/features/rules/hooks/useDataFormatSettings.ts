import { useState, useCallback } from 'react';
import { DataFormatSettings } from '@/types/rules';

export function useDataFormatSettings() {
  const [settings, setSettings] = useState<DataFormatSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/rules/data-format');
      if (!response.ok) {
        throw new Error('Failed to fetch data format settings');
      }
      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (settingsData: Partial<DataFormatSettings>) => {
    setError('');
    try {
      const response = await fetch('/api/rules/data-format', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update data format settings');
      }
      
      const data = await response.json();
      setSettings(data.settings);
      return data.settings;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  const resetToDefaults = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/rules/data-format/reset', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset data format settings');
      }
      
      const data = await response.json();
      setSettings(data.settings);
      return data.settings;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    resetToDefaults,
  };
}