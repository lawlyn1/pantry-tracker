'use client';

import { useState } from 'react';
import { getIngredientNutrition } from '@/lib/spoonacular';
import { insertIngredients } from '@/services/ingredients';
import { usePantry } from '@/context/PantryContext';
import { UNIT_OPTIONS } from '@/types';

const EMPTY_FORM = {
  name: '',
  quantity: 1,
  unit: 'pcs',
  expiration_date: '',
  calories_per_100g: '',
  protein_per_100g: '',
  carbs_per_100g: '',
  fat_per_100g: '',
  fibre_per_100g: '',
};

const numOrNull = (v: string): number | null => (v === '' ? null : parseFloat(v));

export default function AddIngredientForm() {
  const { user, refresh } = usePantry();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingNutrition, setFetchingNutrition] = useState(false);

  const handleAutoFetchNutrition = async () => {
    if (!formData.name) return setError('Please enter an ingredient name first');
    setFetchingNutrition(true);
    setError('');
    try {
      const n = await getIngredientNutrition(formData.name);
      if (!n) return setError('Could not find nutrition data for this ingredient');
      setFormData(prev => ({
        ...prev,
        calories_per_100g: String(n.calories),
        protein_per_100g:  String(n.protein),
        carbs_per_100g:    String(n.carbs),
        fat_per_100g:      String(n.fat),
        fibre_per_100g:    String(n.fibre),
      }));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch nutrition data');
    } finally {
      setFetchingNutrition(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await insertIngredients([{
        user_id: user?.id,
        name: formData.name,
        quantity: Number(formData.quantity) || 0,
        unit: formData.unit,
        expiration_date: formData.expiration_date,
        calories_per_100g: numOrNull(formData.calories_per_100g),
        protein_per_100g:  numOrNull(formData.protein_per_100g),
        carbs_per_100g:    numOrNull(formData.carbs_per_100g),
        fat_per_100g:      numOrNull(formData.fat_per_100g),
        fibre_per_100g:    numOrNull(formData.fibre_per_100g),
      }]);
      setFormData(EMPTY_FORM);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add ingredient');
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
