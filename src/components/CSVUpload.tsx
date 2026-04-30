'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function CSVUpload({ onUpload, user }: { onUpload: (ingredients: any[]) => void; user: User | null }) {
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
          const ingredients = results.data as any[];
          
          // Validate and transform data
          const validIngredients = ingredients
            .filter((item) => item.name && item.expiration_date)
            .map((item) => ({
              user_id: user?.id,
              name: item.name,
              quantity: parseFloat(item.quantity) || 1,
              unit: item.unit || 'pcs',
              expiration_date: item.expiration_date,
              calories_per_100g: item.calories_per_100g ? parseFloat(item.calories_per_100g) : null,
              protein_per_100g: item.protein_per_100g ? parseFloat(item.protein_per_100g) : null,
              carbs_per_100g: item.carbs_per_100g ? parseFloat(item.carbs_per_100g) : null,
              fat_per_100g: item.fat_per_100g ? parseFloat(item.fat_per_100g) : null,
              fibre_per_100g: item.fibre_per_100g ? parseFloat(item.fibre_per_100g) : null,
            }));

          if (validIngredients.length === 0) {
            throw new Error('No valid ingredients found in CSV');
          }

          // Insert into Supabase
          const { error } = await supabase.from('ingredients').insert(validIngredients);

          if (error) throw error;

          setSuccess(`Successfully imported ${validIngredients.length} ingredients`);
          onUpload(validIngredients);
          
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
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Import from CSV</h2>
      
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
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-gray-600">
              {loading ? 'Processing...' : 'Click to upload CSV file'}
            </span>
            <span className="text-xs text-gray-400">
              MacroFactor export format
            </span>
          </label>
        </div>

        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">Expected CSV format:</p>
          <code className="bg-gray-100 px-2 py-1 rounded">
            name,quantity,unit,expiration_date,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,fibre_per_100g
          </code>
        </div>
      </div>
    </div>
  );
}
