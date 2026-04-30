'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function FoodLogCSVUpload({ onUpload, user }: { onUpload: () => void; user: User | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const foodLogs = results.data as any[];
          
          // Validate and transform data - MacroFactor food log format
          const validLogs = foodLogs
            .filter((item) => item.name && item.date && item.quantity)
            .map((item) => ({
              user_id: user?.id,
              ingredient_name: item.name,
              quantity_consumed: parseFloat(item.quantity) || 1,
              unit: item.unit || 'g',
              log_date: item.date,
              meal_type: item.meal_type || null,
            }));

          if (validLogs.length === 0) {
            throw new Error('No valid food logs found in CSV');
          }

          // Insert food logs
          const { error } = await supabase.from('food_logs').insert(validLogs);

          if (error) throw error;

          // Auto-remove from inventory based on food logs
          for (const log of validLogs) {
            // Find matching ingredient by name
            const { data: ingredients } = await supabase
              .from('ingredients')
              .select('id, quantity, unit')
              .ilike('name', `%${log.ingredient_name}%`)
              .limit(1);

            if (ingredients && ingredients.length > 0) {
              const ingredient = ingredients[0];
              // Convert units if needed (simplified - assumes same unit)
              const newQuantity = Math.max(0, ingredient.quantity - log.quantity_consumed);
              
              await supabase
                .from('ingredients')
                .update({ quantity: newQuantity })
                .eq('id', ingredient.id);
            }
          }

          setSuccess(`Successfully imported ${validLogs.length} food logs and updated inventory`);
          onUpload();
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error: any) {
          setError(error.message || 'Failed to import CSV');
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        setError(error.message);
        setLoading(false);
      },
    });
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
