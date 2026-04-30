'use client';

import { useState, useRef } from 'react';
import { parseCSV, csvToFoodLogInserts } from '@/services/csvImport';
import { insertFoodLogs, applyConsumptionToInventory } from '@/services/foodLogs';
import { usePantry } from '@/context/PantryContext';

interface Props {
  onComplete?: () => void;
}

export default function FoodLogCSVUpload({ onComplete }: Props) {
  const { user, refresh } = usePantry();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const rows = await parseCSV(file);
      const logs = csvToFoodLogInserts(rows, user?.id);
      if (logs.length === 0) throw new Error('No valid food logs found in CSV');

      // Two-phase: insert all logs in a single batch, then resolve inventory deltas
      // via a single SELECT IN + parallel updates (replaces N+1 loop).
      await insertFoodLogs(logs);
      await applyConsumptionToInventory(logs);

      setSuccess(`Successfully imported ${logs.length} food logs and updated inventory`);
      await refresh();
      onComplete?.();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err?.message ?? 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Import Food Logs from CSV</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
            id="foodlog-csv-upload"
          />
          <label
            htmlFor="foodlog-csv-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-gray-600">
              {loading ? 'Processing...' : 'Click to upload CSV file'}
            </span>
            <span className="text-xs text-gray-400">
              MacroFactor food log export
            </span>
          </label>
        </div>

        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">Expected CSV format:</p>
          <code className="bg-gray-100 px-2 py-1 rounded">
            name,quantity,unit,date,meal_type
          </code>
        </div>
      </div>
    </div>
  );
}
