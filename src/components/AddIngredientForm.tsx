'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getIngredientNutrition } from '@/lib/spoonacular';
import type { User } from '@supabase/supabase-js';
import type { Ingredient, NutritionInfo } from '@/types';
import { UNIT_OPTIONS } from '@/types';

export default function AddIngredientForm({ onIngredientAdded, user }: { onIngredientAdded: () => void; user: User | null }) {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    unit: 'pcs',
    expiration_date: '',
    calories_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fat_per_100g: '',
    fibre_per_100g: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingNutrition, setFetchingNutrition] = useState(false);

  const handleAutoFetchNutrition = async () => {
    if (!formData.name) {
      setError('Please enter an ingredient name first');
      return;
    }

    setFetchingNutrition(true);
    setError('');

    try {
      const nutrition = await getIngredientNutrition(formData.name);
      
      if (nutrition) {
        setFormData({
          ...formData,
          calories_per_100g: nutrition.calories.toString(),
          protein_per_100g: nutrition.protein.toString(),
          carbs_per_100g: nutrition.carbs.toString(),
          fat_per_100g: nutrition.fat.toString(),
          fibre_per_100g: nutrition.fibre.toString(),
        });
      } else {
        setError('Could not find nutrition data for this ingredient');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch nutrition data');
    } finally {
      setFetchingNutrition(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.from('ingredients').insert([
        {
          user_id: user?.id,
          name: formData.name,
          quantity: parseFloat(formData.quantity.toString()),
          unit: formData.unit,
          expiration_date: formData.expiration_date,
          calories_per_100g: formData.calories_per_100g ? parseFloat(formData.calories_per_100g) : null,
          protein_per_100g: formData.protein_per_100g ? parseFloat(formData.protein_per_100g) : null,
          carbs_per_100g: formData.carbs_per_100g ? parseFloat(formData.carbs_per_100g) : null,
          fat_per_100g: formData.fat_per_100g ? parseFloat(formData.fat_per_100g) : null,
          fibre_per_100g: formData.fibre_per_100g ? parseFloat(formData.fibre_per_100g) : null,
        },
      ]);

      if (error) throw error;

      setFormData({
        name: '',
        quantity: 1,
        unit: 'pcs',
        expiration_date: '',
        calories_per_100g: '',
        protein_per_100g: '',
        carbs_per_100g: '',
        fat_per_100g: '',
        fibre_per_100g: '',
      });
      onIngredientAdded();
    } catch (error: any) {
      setError(error.message || 'Failed to add ingredient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Ingredient</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Chicken Breast"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date *</label>
          <input
            type="date"
            required
            value={formData.expiration_date}
            onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Nutrition per 100g (Optional)</h3>
            <button
              type="button"
              onClick={handleAutoFetchNutrition}
              disabled={fetchingNutrition || !formData.name}
              className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fetchingNutrition ? 'Fetching...' : 'Auto-Fetch'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Calories</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.calories_per_100g}
                onChange={(e) => setFormData({ ...formData, calories_per_100g: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Protein (g)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.protein_per_100g}
                onChange={(e) => setFormData({ ...formData, protein_per_100g: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Carbs (g)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.carbs_per_100g}
                onChange={(e) => setFormData({ ...formData, carbs_per_100g: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fat (g)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.fat_per_100g}
                onChange={(e) => setFormData({ ...formData, fat_per_100g: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fibre (g)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.fibre_per_100g}
                onChange={(e) => setFormData({ ...formData, fibre_per_100g: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Ingredient'}
        </button>
      </form>
    </div>
  );
}
